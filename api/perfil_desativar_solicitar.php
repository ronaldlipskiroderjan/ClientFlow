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

$senha = $_POST['senha_confirmar'] ?? '';

if (empty($senha)) {
    $retorno["mensagem"] = "Informe sua senha para confirmar.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$stmt = $conexao->prepare("SELECT senha_hash, status_conta FROM usuarios WHERE id = ?");
$stmt->bind_param("i", $usuario_id);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows !== 1) {
    $retorno["mensagem"] = "Usuário não encontrado.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$row = $res->fetch_assoc();
$stmt->close();

if (!password_verify($senha, $row['senha_hash'])) {
    $retorno["mensagem"] = "Senha incorreta.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($row['status_conta'] === 'desativado') {
    $retorno["mensagem"] = "Esta conta já está desativada.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$stmt_upd = $conexao->prepare(
    "UPDATE usuarios SET status_conta = 'desativado', desativacao_aceita_em = NOW() WHERE id = ?"
);
$stmt_upd->bind_param("i", $usuario_id);

if ($stmt_upd->execute()) {
    session_unset();
    session_destroy();
    $retorno["status"]   = "ok";
    $retorno["mensagem"] = "Conta desativada. Você tem 180 dias para reativá-la.";
} else {
    $retorno["mensagem"] = "Erro ao desativar a conta.";
}

$stmt_upd->close();
$conexao->close();
header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
