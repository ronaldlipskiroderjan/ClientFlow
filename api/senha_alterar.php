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

$senha_atual     = $_POST['senha_atual'] ?? '';
$nova_senha      = $_POST['nova_senha'] ?? '';
$confirmar_senha = $_POST['confirmar_senha'] ?? '';

if (empty($senha_atual) || empty($nova_senha) || empty($confirmar_senha)) {
    $retorno["mensagem"] = "Preencha todos os campos.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($nova_senha !== $confirmar_senha) {
    $retorno["mensagem"] = "A nova senha e a confirmação não coincidem.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if (strlen($nova_senha) < 8) {
    $retorno["mensagem"] = "A nova senha deve ter pelo menos 8 caracteres.";
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
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$row = $res->fetch_assoc();
$stmt->close();

if (!password_verify($senha_atual, $row['senha_hash'])) {
    $retorno["mensagem"] = "Senha atual incorreta.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$novo_hash = password_hash($nova_senha, PASSWORD_DEFAULT);
$stmt_upd  = $conexao->prepare("UPDATE usuarios SET senha_hash = ? WHERE id = ?");
$stmt_upd->bind_param("si", $novo_hash, $usuario_id);

if ($stmt_upd->execute()) {
    $retorno["status"]   = "ok";
    $retorno["mensagem"] = "Senha alterada com sucesso!";
} else {
    $retorno["mensagem"] = "Erro ao alterar senha.";
}

$stmt_upd->close();
$conexao->close();
header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
