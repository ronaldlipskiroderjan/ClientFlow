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

$nome = trim($_POST['nome'] ?? '');
$telefone = trim($_POST['telefone'] ?? '');
//$prova_autoria = trim($_POST['prova_autoria'] ?? '');

if (empty($nome)) {
    $retorno["mensagem"] = "O nome é obrigatório.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$stmt = $conexao->prepare("UPDATE usuarios SET nome = ?, telefone = ?, /*prova_autoria = ?,*/ WHERE id = ?");
$stmt->bind_param("ssi" /*s*/, $nome, $telefone, /*$prova_autoria,*/ $usuario_id);

if ($stmt->execute()) {
    $_SESSION['usuario_nome'] = $nome;
    $retorno["status"] = "ok";
    $retorno["mensagem"] = "Perfil atualizado com sucesso!";
} else {
    $retorno["mensagem"] = "Erro ao atualizar perfil.";
}

$stmt->close();
$conexao->close();
header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>