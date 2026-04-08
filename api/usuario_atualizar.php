<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Usuário não autenticado",
    "data" => null
];

$usuario_id = $_SESSION['usuario_id'] ?? null;

if (empty($usuario_id)) {
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$nome = trim($_POST['nome'] ?? '');
$telefone = trim($_POST['telefone'] ?? '');
$documento = trim($_POST['documento'] ?? '');
$data_nascimento = trim($_POST['data_nascimento'] ?? '');
$nome_empresa = trim($_POST['nome_empresa'] ?? '');
$nome_responsavel = trim($_POST['nome_responsavel'] ?? '');

if (empty($nome)) {
    $retorno["mensagem"] = "Informe o nome do usuário.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($data_nascimento === '') {
    $data_nascimento = null;
}

$stmt = $conexao->prepare(
    "UPDATE usuarios
     SET nome = ?, telefone = ?, documento = ?, data_nascimento = ?, nome_empresa = ?, nome_responsavel = ?
     WHERE id = ?"
);
$stmt->bind_param(
    "ssssssi",
    $nome,
    $telefone,
    $documento,
    $data_nascimento,
    $nome_empresa,
    $nome_responsavel,
    $usuario_id
);

if ($stmt->execute()) {
    $_SESSION['usuario_nome'] = $nome;
    $retorno["status"] = "ok";
    $retorno["mensagem"] = "Usuário atualizado com sucesso";
    $retorno["data"] = ["id" => $usuario_id, "nome" => $nome];
} else {
    $retorno["mensagem"] = "Erro ao atualizar: " . $stmt->error;
}

$stmt->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
