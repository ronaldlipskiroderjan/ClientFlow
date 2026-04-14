<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Usuário não autenticado",
    "data" => null
];

$agencia_usuario_id = $_SESSION['usuario_id'] ?? null;
$usuario_tipo = $_SESSION['usuario_tipo'] ?? null;

if (empty($agencia_usuario_id)) {
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($usuario_tipo === "client") {
    $retorno["mensagem"] = "Perfil sem permissão para criar formulário.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$titulo = trim($_POST['titulo'] ?? '');
$descricao = trim($_POST['descricao'] ?? '');
$itens_json = $_POST['itens'] ?? '[]';
$itens = json_decode($itens_json, true);

if (empty($titulo)) {
    $retorno["mensagem"] = "Informe o título do projeto.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if (!is_array($itens) || count($itens) === 0) {
    $retorno["mensagem"] = "Adicione pelo menos um item no formulário.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$link_hash = bin2hex(random_bytes(16));

function parse_int_or_null($value) {
    if ($value === null || $value === '') {
        return null;
    }

    if (!is_numeric($value)) {
        return null;
    }

    $parsed = intval($value);
    return $parsed > 0 ? $parsed : null;
}

function normalize_extensions($value) {
    if ($value === null || $value === '') {
        return null;
    }

    $parts = explode(',', strtolower($value));
    $normalized = [];

    foreach ($parts as $part) {
        $clean = preg_replace('/[^a-z0-9]/', '', trim($part));
        if ($clean !== '' && !in_array($clean, $normalized, true)) {
            $normalized[] = $clean;
        }
    }

    return count($normalized) ? implode(',', $normalized) : null;
}

$conexao->begin_transaction();

try {
    $stmt_checklist = $conexao->prepare(
        "INSERT INTO checklists (agencia_usuario_id, titulo, descricao, link_hash, status)
         VALUES (?, ?, ?, ?, 'pending')"
    );
    $stmt_checklist->bind_param("isss", $agencia_usuario_id, $titulo, $descricao, $link_hash);
    $stmt_checklist->execute();
    $checklist_id = $conexao->insert_id;
    $stmt_checklist->close();

    $stmt_item = $conexao->prepare(
        "INSERT INTO itens_checklist (
            checklist_id,
            nome_item,
            descricao_item,
            formato_esperado,
            min_chars,
            max_chars,
            allowed_extensions,
            max_file_size_kb,
            min_width,
            max_width,
            min_height,
            max_height,
            status
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')"
    );

    foreach ($itens as $item) {
        $nome_item = trim($item['nome'] ?? '');
        $descricao_item = trim($item['descricao'] ?? '');
        $formato = trim($item['tipo'] ?? 'text');
        $min_chars = parse_int_or_null($item['min_chars'] ?? null);
        $max_chars = parse_int_or_null($item['max_chars'] ?? null);
        $allowed_extensions = normalize_extensions($item['allowed_extensions'] ?? null);
        $max_file_size_kb = parse_int_or_null($item['max_file_size_kb'] ?? null);
        $min_width = parse_int_or_null($item['min_width'] ?? null);
        $max_width = parse_int_or_null($item['max_width'] ?? null);
        $min_height = parse_int_or_null($item['min_height'] ?? null);
        $max_height = parse_int_or_null($item['max_height'] ?? null);

        if ($nome_item === '') {
            continue;
        }

        if ($min_chars !== null && $max_chars !== null && $min_chars > $max_chars) {
            $tmp = $min_chars;
            $min_chars = $max_chars;
            $max_chars = $tmp;
        }

        $stmt_item->bind_param(
            "isssiisiiiii",
            $checklist_id,
            $nome_item,
            $descricao_item,
            $formato,
            $min_chars,
            $max_chars,
            $allowed_extensions,
            $max_file_size_kb,
            $min_width,
            $max_width,
            $min_height,
            $max_height
        );
        $stmt_item->execute();
    }

    $stmt_item->close();
    $conexao->commit();

    $retorno["status"] = "ok";
    $retorno["mensagem"] = "Formulário criado com sucesso.";
    $retorno["data"] = [
        "checklist_id" => $checklist_id,
        "link_hash" => $link_hash
    ];
} catch (Exception $e) {
    $conexao->rollback();
    $retorno["mensagem"] = "Erro ao criar formulário.";
}

$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
