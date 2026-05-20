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
$agencia_id = $_SESSION['agencia_id'] ?? null;
$permissoes = $_SESSION['permissoes'] ?? [];

if (empty($usuario_id)) {
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

if (($usuario_tipo === 'agency' || $usuario_tipo === 'agency_member' || $usuario_tipo === 'freelancer') && empty($permissoes['perm_criar_clientes'])) {
    $retorno["mensagem"] = "Você não tem permissão para cadastrar clientes.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if (empty($agencia_id)) {
    $retorno["mensagem"] = "Agência não identificada na sessão.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$nome = trim($_POST['nome'] ?? '');
$email = trim($_POST['email'] ?? '');
$telefone = trim($_POST['telefone'] ?? '');
$senha = $_POST['senha'] ?? '';
$empresa = trim($_POST['empresa'] ?? '');
$documento = preg_replace('/[^0-9]/', '', $_POST['cpf'] ?? ''); // Opcional no form antigo, mas importante agora! Se o form enviar, nós salvamos.

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
    // 1. Verifica se já existe um usuário com esse email (podem ter se cadastrado já na plataforma mas nao estao na agencia)
    $stmt_usr_check = $conexao->prepare("SELECT id, senha_hash FROM usuarios WHERE email = ? LIMIT 1");
    $stmt_usr_check->bind_param("s", $email);
    $stmt_usr_check->execute();
    $res_usr = $stmt_usr_check->get_result();
    
    $cli_usuario_id = 0;
    $senha_hash = "";
    
    if ($res_usr->num_rows === 1) {
        $u_existente = $res_usr->fetch_assoc();
        $cli_usuario_id = $u_existente['id'];
        $senha_hash = $u_existente['senha_hash'];
    } else {
        $stmt_usuario = $conexao->prepare(
            "INSERT INTO usuarios (nome, email, senha_hash, tipo, telefone, nome_empresa, documento, status_conta)
             VALUES (?, ?, ?, 'client', ?, ?, ?, 'aprovado')"
        );
    
        $senha_hash = password_hash($senha, PASSWORD_DEFAULT);
        $stmt_usuario->bind_param("ssssss", $nome, $email, $senha_hash, $telefone, $empresa, $documento);
        if (!$stmt_usuario->execute()) {
             throw new Exception("Erro ao cadastrar usuário base.");
        }
        $cli_usuario_id = $conexao->insert_id;
        $stmt_usuario->close();
    }
    $stmt_usr_check->close();

    // 2. Vincula o cliente à agência/workspace da conta atual.
    $stmt_cliente = $conexao->prepare(
        "INSERT INTO clientes (agencia_id, usuario_id, nome, email, telefone, senha, empresa)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt_cliente->bind_param("iisssss", $agencia_id, $cli_usuario_id, $nome, $email, $telefone, $senha_hash, $empresa);
    if (!$stmt_cliente->execute()) {
        $err_no = $stmt_cliente->errno;
        $stmt_cliente->close();
        if ($err_no === 1062) {
            throw new Exception("Este cliente já está vinculado à sua agência.");
        }
        throw new Exception("Erro interno ao vincular cliente. Por favor, tente novamente.");
    }
    $cliente_id = $conexao->insert_id;
    $stmt_cliente->close();

    $conexao->commit();

    $retorno["status"] = "ok";
    $retorno["mensagem"] = "Cliente cadastrado com sucesso.";
    $retorno["data"] = [
        "id" => $cliente_id,
        "usuario_id" => $cli_usuario_id,
        "nome" => $nome,
        "email" => $email,
        "empresa" => $empresa
    ];
} catch (Exception $e) {
    $conexao->rollback();
    $retorno["mensagem"] = $e->getMessage();
}

$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
