<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Não autorizado"
];

$usuario_tipo = $_SESSION['usuario_tipo'] ?? null;

if ($usuario_tipo !== 'admin') {
    $retorno["mensagem"] = "Perfil sem permissão para acessar esta área.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$usuario_id = isset($_POST['usuario_id']) ? (int)$_POST['usuario_id'] : 0;
$novo_status = isset($_POST['status']) ? trim($_POST['status']) : '';

if ($usuario_id <= 0 || !in_array($novo_status, ['aprovado', 'banido'])) {
    $retorno["mensagem"] = "Dados inválidos.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$stmt = $conexao->prepare("UPDATE usuarios SET status_conta = ? WHERE id = ?");
$stmt->bind_param("si", $novo_status, $usuario_id);

if ($stmt->execute()) {
    $retorno["status"] = "ok";
    $retorno["mensagem"] = "Status atualizado com sucesso.";
} else {
    $retorno["mensagem"] = "Erro ao atualizar status: " . $conexao->error;
}

$stmt->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
