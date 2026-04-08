<?php
session_start(); // SEMPRE antes de qualquer include ou output
include_once("../db_conexao.php");
header("Content-Type: application/json; charset=utf-8");

$usuario_id = $_SESSION['usuario_id'] ?? null;
if (!$usuario_id) {
    echo json_encode(["status" => "nok", "mensagem" => "Usuário não autenticado"]);
    exit();
}

$titulo     = trim($_POST['titulo'] ?? '');
$descricao  = trim($_POST['descricao'] ?? '');
$itens_json = $_POST['itens'] ?? '';

if (!$titulo || !$itens_json) {
    echo json_encode(["status" => "nok", "mensagem" => "Título e itens obrigatórios"]);
    exit();
}

$itens = json_decode($itens_json, true);
if (!is_array($itens) || count($itens) === 0) {
    echo json_encode(["status" => "nok", "mensagem" => "Itens inválidos"]);
    exit();
}

// Tipos permitidos — validação que estava faltando
$tipos_permitidos = ['text', 'long_text', 'file', 'image', 'url'];

$stmt = $conexao->prepare(
    "INSERT INTO checklists (agencia_usuario_id, titulo, descricao, status, created_at)
     VALUES (?, ?, ?, 'ativo', NOW())"
);
$stmt->bind_param("iss", $usuario_id, $titulo, $descricao);

if (!$stmt->execute()) {
    echo json_encode(["status" => "nok", "mensagem" => "Erro ao criar checklist"]);
    exit();
}

$checklist_id = $stmt->insert_id;
$stmt_item = $conexao->prepare(
    "INSERT INTO checklist_itens (checklist_id, nome, descricao, tipo) VALUES (?, ?, ?, ?)"
);

foreach ($itens as $item) {
    $nome = trim($item['nome'] ?? '');
    $desc = trim($item['descricao'] ?? '');
    $tipo = trim($item['tipo'] ?? '');

    if (!$nome || !in_array($tipo, $tipos_permitidos)) continue; // ignora itens inválidos

    $stmt_item->bind_param("isss", $checklist_id, $nome, $desc, $tipo);
    $stmt_item->execute();
}

echo json_encode(["status" => "ok", "mensagem" => "Checklist criado com sucesso"]);
exit();