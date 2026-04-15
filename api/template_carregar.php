<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Usuário não autenticado",
    "data" => null
];

function responder_json($payload) {
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($payload);
    exit();
}

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
    if (is_array($value)) {
        return null;
    }

    $value = trim((string)$value);
    if ($value === '') {
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

function normalizar_item_template($item) {
    $nome = trim((string)($item['nome'] ?? ''));
    if ($nome === '') {
        return null;
    }

    $tipo = strtolower(trim((string)($item['tipo'] ?? 'text')));
    $tipos_validos = ['text', 'long_text', 'url', 'file', 'image', 'color'];
    if (!in_array($tipo, $tipos_validos, true)) {
        $tipo = 'text';
    }

    $min_chars = parse_int_or_null($item['min_chars'] ?? null);
    $max_chars = parse_int_or_null($item['max_chars'] ?? null);
    if ($min_chars !== null && $max_chars !== null && $min_chars > $max_chars) {
        $tmp = $min_chars;
        $min_chars = $max_chars;
        $max_chars = $tmp;
    }

    return [
        "nome" => $nome,
        "tipo" => $tipo,
        "descricao" => trim((string)($item['descricao'] ?? '')),
        "min_chars" => $min_chars,
        "max_chars" => $max_chars,
        "allowed_extensions" => normalize_extensions($item['allowed_extensions'] ?? null),
        "max_file_size_kb" => parse_int_or_null($item['max_file_size_kb'] ?? null),
        "min_width" => parse_int_or_null($item['min_width'] ?? null),
        "max_width" => parse_int_or_null($item['max_width'] ?? null),
        "min_height" => parse_int_or_null($item['min_height'] ?? null),
        "max_height" => parse_int_or_null($item['max_height'] ?? null)
    ];
}

$usuario_id = $_SESSION['usuario_id'] ?? null;
$usuario_tipo = $_SESSION['usuario_tipo'] ?? null;
$agencia_id = $_SESSION['agencia_id'] ?? null;
$papel_agencia = $_SESSION['papel_agencia'] ?? null;
$permissoes = $_SESSION['permissoes'] ?? [];

if (empty($usuario_id)) {
    responder_json($retorno);
}

if ($usuario_tipo !== 'agency' && $usuario_tipo !== 'agency_member') {
    $retorno["mensagem"] = "Templates estão disponíveis apenas para usuários da agência.";
    responder_json($retorno);
}

if (empty($agencia_id)) {
    $retorno["mensagem"] = "Agência não identificada para o usuário logado.";
    responder_json($retorno);
}

if ($papel_agencia !== 'admin_agencia' && empty($permissoes['perm_criar_projetos'])) {
    $retorno["mensagem"] = "Você não tem permissão para criar projetos por template.";
    responder_json($retorno);
}

$template_id = intval($_POST['template_id'] ?? 0);
$titulo = trim($_POST['titulo'] ?? '');
$descricao = trim($_POST['descricao'] ?? '');

if ($template_id <= 0) {
    $retorno["mensagem"] = "Template inválido.";
    responder_json($retorno);
}

if ($titulo === '') {
    $retorno["mensagem"] = "Informe o título do projeto.";
    responder_json($retorno);
}

if (strlen($titulo) > 150) {
    $retorno["mensagem"] = "O título do projeto deve ter no máximo 150 caracteres.";
    responder_json($retorno);
}

$stmt_template = $conexao->prepare(
    "SELECT id, nome, descricao, itens
     FROM templates_checklist
     WHERE id = ? AND agencia_id = ?
     LIMIT 1"
);
if (!$stmt_template) {
    $retorno["mensagem"] = "Erro ao carregar template.";
    responder_json($retorno);
}

$stmt_template->bind_param("ii", $template_id, $agencia_id);
if (!$stmt_template->execute()) {
    $stmt_template->close();
    $retorno["mensagem"] = "Erro ao carregar template.";
    responder_json($retorno);
}
$res_template = $stmt_template->get_result();

if ($res_template->num_rows !== 1) {
    $stmt_template->close();
    $retorno["mensagem"] = "Template não encontrado para esta agência.";
    responder_json($retorno);
}

$template = $res_template->fetch_assoc();
$stmt_template->close();

$itens_raw = json_decode($template['itens'] ?? '[]', true);
if (!is_array($itens_raw) || !count($itens_raw)) {
    $retorno["mensagem"] = "Template sem itens válidos para criação de projeto.";
    responder_json($retorno);
}

$itens_template = [];
foreach ($itens_raw as $item) {
    if (!is_array($item)) {
        continue;
    }
    $item_normalizado = normalizar_item_template($item);
    if ($item_normalizado !== null) {
        $itens_template[] = $item_normalizado;
    }
}

if (!count($itens_template)) {
    $retorno["mensagem"] = "Template sem itens válidos para criação de projeto.";
    responder_json($retorno);
}

$link_hash = bin2hex(random_bytes(16));
$conexao->begin_transaction();

try {
    $stmt_checklist = $conexao->prepare(
        "INSERT INTO checklists (agencia_id, titulo, descricao, link_hash, status)
         VALUES (?, ?, ?, ?, 'Aberto')"
    );
    if (!$stmt_checklist) {
        throw new Exception("Falha ao preparar criação do checklist.");
    }

    $stmt_checklist->bind_param("isss", $agencia_id, $titulo, $descricao, $link_hash);
    if (!$stmt_checklist->execute()) {
        $stmt_checklist->close();
        throw new Exception("Falha ao criar checklist.");
    }
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
    if (!$stmt_item) {
        throw new Exception("Falha ao preparar criação de itens.");
    }

    foreach ($itens_template as $item) {
        $nome_item = $item['nome'];
        $descricao_item = $item['descricao'];
        $formato = $item['tipo'];
        $min_chars = $item['min_chars'];
        $max_chars = $item['max_chars'];
        $allowed_extensions = $item['allowed_extensions'];
        $max_file_size_kb = $item['max_file_size_kb'];
        $min_width = $item['min_width'];
        $max_width = $item['max_width'];
        $min_height = $item['min_height'];
        $max_height = $item['max_height'];

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
        if (!$stmt_item->execute()) {
            $stmt_item->close();
            throw new Exception("Falha ao criar item do checklist.");
        }
    }

    $stmt_item->close();
    $conexao->commit();
} catch (Exception $e) {
    $conexao->rollback();
    $retorno["mensagem"] = "Erro ao criar checklist a partir do template.";
    responder_json($retorno);
}

$conexao->close();

$retorno["status"] = "ok";
$retorno["mensagem"] = "Checklist criado a partir do template com sucesso.";
$retorno["data"] = [
    "checklist_id" => $checklist_id,
    "link_hash" => $link_hash,
    "template_id" => $template_id,
    "template_nome" => $template['nome']
];

responder_json($retorno);
?>
