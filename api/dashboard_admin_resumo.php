<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Usuário não autenticado",
    "data" => null
];

$usuario_id = $_SESSION['usuario_id'] ?? null;
$usuario_tipo = $_SESSION['usuario_tipo'] ?? null;

if (empty($usuario_id)) {
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($usuario_tipo !== 'admin') {
    $retorno["mensagem"] = "Perfil sem permissão para acessar esta área.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$activeUsers = 0;
$activeAgencies = 0;
$clients = 0;
$alerts = 0;

$stmt = $conexao->prepare("SELECT COUNT(*) AS total FROM usuarios WHERE status_conta = 'aprovado'");
if ($stmt) {
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $activeUsers = intval($row['total'] ?? 0);
    $stmt->close();
}

$stmt = $conexao->prepare("SELECT COUNT(*) AS total FROM agencias WHERE status_conta = 'Ativa'");
if ($stmt) {
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $activeAgencies = intval($row['total'] ?? 0);
    $stmt->close();
}

$stmt = $conexao->prepare("SELECT COUNT(*) AS total FROM clientes");
if ($stmt) {
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $clients = intval($row['total'] ?? 0);
    $stmt->close();
}

$stmt = $conexao->prepare("SELECT COUNT(*) AS total FROM usuarios WHERE status_conta != 'aprovado'");
if ($stmt) {
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $alerts = intval($row['total'] ?? 0);
    $stmt->close();
}

$stmt = $conexao->prepare("SELECT COUNT(*) AS total FROM agencias WHERE status_conta != 'Ativa'");
if ($stmt) {
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $alerts += intval($row['total'] ?? 0);
    $stmt->close();
}

$retorno["status"] = "ok";
$retorno["mensagem"] = "Resumo administrativo carregado com sucesso.";
$retorno["data"] = [
    "active_users" => $activeUsers,
    "active_agencies" => $activeAgencies,
    "clients" => $clients,
    "alerts" => $alerts
];

$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
