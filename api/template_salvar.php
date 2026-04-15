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
$ua_id = $_SESSION['ua_id'] ?? null;
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
    $retorno["mensagem"] = "Você não tem permissão para criar templates.";
    responder_json($retorno);
}

$nome = trim($_POST['nome'] ?? '');
$descricao = trim($_POST['descricao'] ?? '');
$checklist_id = intval($_POST['checklist_id'] ?? 0);
$itens_json = $_POST['itens'] ?? '';

if ($nome === '') {
    $retorno["mensagem"] = "Informe o nome do template.";
    responder_json($retorno);
}

if (strlen($nome) < 3 || strlen($nome) > 255) {
    $retorno["mensagem"] = "O nome do template deve ter entre 3 e 255 caracteres.";
    responder_json($retorno);
}

$itens_template = [];

if ($itens_json !== '') {
    $itens_recebidos = json_decode($itens_json, true);
    if (!is_array($itens_recebidos)) {
        $retorno["mensagem"] = "A estrutura de itens enviada é inválida.";
        responder_json($retorno);
    }

    foreach ($itens_recebidos as $item) {
        if (!is_array($item)) {
            continue;
        }
        $item_normalizado = normalizar_item_template($item);
        if ($item_normalizado !== null) {
            $itens_template[] = $item_normalizado;
        }
    }
} elseif ($checklist_id > 0) {
    if ($papel_agencia === 'dev') {
        $stmt_acesso = $conexao->prepare(
            "SELECT c.id
             FROM checklists c
             INNER JOIN projetos_membros pm ON pm.checklist_id = c.id
             WHERE c.id = ? AND c.agencia_id = ? AND pm.usuario_agencia_id = ?
             LIMIT 1"
        );
        if (!$stmt_acesso) {
            $retorno["mensagem"] = "Erro ao validar acesso do checklist.";
            responder_json($retorno);
        }
        $stmt_acesso->bind_param("iii", $checklist_id, $agencia_id, $ua_id);
    } else {
        $stmt_acesso = $conexao->prepare(
            "SELECT id
             FROM checklists
             WHERE id = ? AND agencia_id = ?
             LIMIT 1"
        );
        if (!$stmt_acesso) {
            $retorno["mensagem"] = "Erro ao validar acesso do checklist.";
            responder_json($retorno);
        }
        $stmt_acesso->bind_param("ii", $checklist_id, $agencia_id);
    }

    if (!$stmt_acesso->execute()) {
        $stmt_acesso->close();
        $retorno["mensagem"] = "Erro ao validar acesso do checklist.";
        responder_json($retorno);
    }
    $res_acesso = $stmt_acesso->get_result();
    if ($res_acesso->num_rows !== 1) {
        $stmt_acesso->close();
        $retorno["mensagem"] = "Checklist não encontrado ou sem permissão para reutilizar este projeto.";
        responder_json($retorno);
    }
    $stmt_acesso->close();

    $stmt_itens = $conexao->prepare(
        "SELECT
            nome_item,
            formato_esperado,
            descricao_item,
            min_chars,
            max_chars,
            allowed_extensions,
            max_file_size_kb,
            min_width,
            max_width,
            min_height,
            max_height
         FROM itens_checklist
         WHERE checklist_id = ?
         ORDER BY id ASC"
    );
    if (!$stmt_itens) {
        $retorno["mensagem"] = "Erro ao carregar itens do checklist.";
        responder_json($retorno);
    }

    $stmt_itens->bind_param("i", $checklist_id);
    if (!$stmt_itens->execute()) {
        $stmt_itens->close();
        $retorno["mensagem"] = "Erro ao carregar itens do checklist.";
        responder_json($retorno);
    }
    $res_itens = $stmt_itens->get_result();

    while ($row = $res_itens->fetch_assoc()) {
        $item_normalizado = normalizar_item_template([
            "nome" => $row['nome_item'],
            "tipo" => $row['formato_esperado'],
            "descricao" => $row['descricao_item'],
            "min_chars" => $row['min_chars'],
            "max_chars" => $row['max_chars'],
            "allowed_extensions" => $row['allowed_extensions'],
            "max_file_size_kb" => $row['max_file_size_kb'],
            "min_width" => $row['min_width'],
            "max_width" => $row['max_width'],
            "min_height" => $row['min_height'],
            "max_height" => $row['max_height']
        ]);

        if ($item_normalizado !== null) {
            $itens_template[] = $item_normalizado;
        }
    }
    $stmt_itens->close();
} else {
    $retorno["mensagem"] = "Envie os itens do formulário ou um checklist válido para salvar o template.";
    responder_json($retorno);
}

if (!count($itens_template)) {
    $retorno["mensagem"] = "Não há itens válidos para salvar no template.";
    responder_json($retorno);
}

$stmt_nome = $conexao->prepare(
    "SELECT id
     FROM templates_checklist
     WHERE agencia_id = ? AND nome = ?
     LIMIT 1"
);
if (!$stmt_nome) {
    $retorno["mensagem"] = "Erro ao validar nome do template.";
    responder_json($retorno);
}

$stmt_nome->bind_param("is", $agencia_id, $nome);
if (!$stmt_nome->execute()) {
    $stmt_nome->close();
    $retorno["mensagem"] = "Erro ao validar nome do template.";
    responder_json($retorno);
}
$res_nome = $stmt_nome->get_result();
if ($res_nome->num_rows > 0) {
    $stmt_nome->close();
    $retorno["mensagem"] = "Já existe um template com esse nome para sua agência.";
    responder_json($retorno);
}
$stmt_nome->close();

$itens_serializados = json_encode($itens_template, JSON_UNESCAPED_UNICODE);
if ($itens_serializados === false) {
    $retorno["mensagem"] = "Falha ao serializar os itens do template.";
    responder_json($retorno);
}

$stmt_insert = $conexao->prepare(
    "INSERT INTO templates_checklist (agencia_id, nome, descricao, itens)
     VALUES (?, ?, ?, ?)"
);
if (!$stmt_insert) {
    $retorno["mensagem"] = "Erro ao preparar gravação do template.";
    responder_json($retorno);
}

$stmt_insert->bind_param("isss", $agencia_id, $nome, $descricao, $itens_serializados);

if (!$stmt_insert->execute()) {
    $stmt_insert->close();
    $retorno["mensagem"] = "Erro ao salvar template.";
    responder_json($retorno);
}

$template_id = $conexao->insert_id;
$stmt_insert->close();
$conexao->close();

$retorno["status"] = "ok";
$retorno["mensagem"] = "Template salvo com sucesso.";
$retorno["data"] = [
    "template_id" => $template_id,
    "nome" => $nome,
    "descricao" => $descricao,
    "quantidade_itens" => count($itens_template)
];

responder_json($retorno);
?>
