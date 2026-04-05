<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Usuário não autenticado",
    "data" => null
];

$agencia_usuario_id = $_SESSION['usuario_id'] ?? null;
$usuario_tipo = $_SESSION['usuario_tipo'] ?? null;

if (empty($agencia_usuario_id)) {
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($usuario_tipo === "client") {
    $retorno["mensagem"] = "Perfil sem permissão para cadastrar clientes.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$nome = trim($_POST['nome'] ?? '');
$email = trim($_POST['email'] ?? '');
$senha = $_POST['senha'] ?? '';
$empresa = trim($_POST['empresa'] ?? '');

if (empty($nome) || empty($email) || empty($senha)) {
    $retorno["mensagem"] = "Preencha nome, e-mail e senha.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $retorno["mensagem"] = "E-mail inválido.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$conexao->begin_transaction();

try {
    $stmt_usuario = $conexao->prepare(
        "INSERT INTO usuarios (nome, email, senha_hash, tipo, nome_empresa, status_conta)
         VALUES (?, ?, ?, 'client', ?, 'aprovado')"
    );

    $senha_hash = password_hash($senha, PASSWORD_DEFAULT);
    $stmt_usuario->bind_param("ssss", $nome, $email, $senha_hash, $empresa);
    $stmt_usuario->execute();
    $usuario_id = $conexao->insert_id;
    $stmt_usuario->close();

    $stmt_cliente = $conexao->prepare(
        "INSERT INTO clientes (agencia_usuario_id, usuario_id, nome, email, senha, empresa)
         VALUES (?, ?, ?, ?, ?, ?)"
    );

    $stmt_cliente->bind_param(
        "iissss",
        $agencia_usuario_id,
        $usuario_id,
        $nome,
        $email,
        $senha_hash,
        $empresa
    );

    $stmt_cliente->execute();
    $cliente_id = $conexao->insert_id;
    $stmt_cliente->close();

    $conexao->commit();

    $retorno["status"] = "ok";
    $retorno["mensagem"] = "Cliente cadastrado com sucesso.";
    $retorno["data"] = [
        "id" => $cliente_id,
        "usuario_id" => $usuario_id,
        "nome" => $nome,
        "email" => $email,
        "empresa" => $empresa
    ];
} catch (Exception $e) {
    $conexao->rollback();

    if ($conexao->errno == 1062) {
        $retorno["mensagem"] = "Este e-mail já está cadastrado.";
    } else {
        $retorno["mensagem"] = "Erro ao cadastrar cliente.";
    }
}

$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
