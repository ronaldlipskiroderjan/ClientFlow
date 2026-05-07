<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Não autorizado",
    "data" => null
];

$agencia_id = $_SESSION['agencia_id'] ?? null;
$usuario_id = $_SESSION['usuario_id'] ?? null;

if (!$agencia_id || !$usuario_id) {
    $retorno["mensagem"] = "Sessão inválida.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$cliente_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($cliente_id <= 0) {
    $retorno["mensagem"] = "ID de cliente inválido.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

// Verifica se o cliente pertence à agência atual
$stmt = $conexao->prepare("SELECT id, nome, email, telefone, empresa, criado_em FROM clientes WHERE id = ? AND agencia_id = ?");
$stmt->bind_param("ii", $cliente_id, $agencia_id);
$stmt->execute();
$res_cliente = $stmt->get_result();

if ($res_cliente->num_rows === 0) {
    $retorno["mensagem"] = "Cliente não encontrado ou você não tem permissão.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$cliente = $res_cliente->fetch_assoc();
$stmt->close();

// Buscar Projetos (Checklists)
$projetos = [];
$stmt_proj = $conexao->prepare("SELECT id, titulo, status, criado_em FROM checklists WHERE cliente_id = ?");
$stmt_proj->bind_param("i", $cliente_id);
$stmt_proj->execute();
$res_proj = $stmt_proj->get_result();
while ($p = $res_proj->fetch_assoc()) {
    $projetos[] = $p;
}
$stmt_proj->close();

// Buscar Contratos
$contratos = [];
$stmt_cont = $conexao->prepare("SELECT id, titulo, valor_total, status_pagamento, status_projeto FROM contratos WHERE cliente_id = ?");
$stmt_cont->bind_param("i", $cliente_id);
$stmt_cont->execute();
$res_cont = $stmt_cont->get_result();
while ($c = $res_cont->fetch_assoc()) {
    $contratos[] = $c;
}
$stmt_cont->close();

$conexao->close();

$cliente["projetos"] = $projetos;
$cliente["contratos"] = $contratos;

$retorno["status"] = "ok";
$retorno["mensagem"] = "Detalhes recuperados com sucesso";
$retorno["data"] = $cliente;

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
