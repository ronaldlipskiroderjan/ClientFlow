<?php
include_once("db_conexao.php");
session_start();

$retorno = ["status" => "nok", "mensagem" => "Usuário não autenticado", "data" => null];

$usuario_id = $_SESSION['usuario_id'] ?? null;
if (empty($usuario_id)) {
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$senha_atual = $_POST['senha_atual'] ?? '';
if ($senha_atual === '') {
    $retorno["mensagem"] = "Informe a senha atual.";
    $retorno["data"] = ["valida" => false];
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$stmt = $conexao->prepare("SELECT senha_hash FROM usuarios WHERE id = ?");
$stmt->bind_param("i", $usuario_id);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows !== 1) {
    $retorno["mensagem"] = "Usuário não encontrado.";
    $retorno["data"] = ["valida" => false];
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$row = $res->fetch_assoc();
$stmt->close();

$valida = password_verify($senha_atual, $row['senha_hash']);
$retorno["status"] = "ok";
$retorno["mensagem"] = $valida ? "Senha atual válida." : "Senha atual incorreta.";
$retorno["data"] = ["valida" => $valida];

$conexao->close();
header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
