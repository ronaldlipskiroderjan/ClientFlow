<?php

include_once __DIR__ . '/../db_conexao.php';
session_start();

header('Content-Type: application/json; charset=utf-8');

$retorno = [
    'status' => 'nok',
    'mensagem' => 'Houve um erro ao processar',
    'data' => null,
];

$agencia_id = $_SESSION['agencia_id'] ?? null;
$usuario_tipo = $_SESSION['usuario_tipo'] ?? null;

if (empty($agencia_id)) {
    $retorno['mensagem'] = 'Usuário não autenticado';
    http_response_code(401);
    echo json_encode($retorno);
    exit();
}

if ($usuario_tipo === 'client') {
    $retorno['mensagem'] = 'Perfil sem permissão para cadastrar clientes.';
    http_response_code(403);
    echo json_encode($retorno);
    exit();
}

$payload = json_decode(file_get_contents('php://input'), true);
$dados = is_array($payload) ? $payload : $_POST;

if (is_array($payload)) {
    $dados = array_merge($_POST, $payload);
}

$nome = trim($dados['nome'] ?? '');
$email = trim($dados['email'] ?? '');
$telefone = trim($dados['telefone'] ?? '');
$senha = $dados['senha'] ?? '';
$empresa = trim($dados['empresa'] ?? '');

if (empty($nome) || empty($email) || empty($senha) || empty($empresa)) {
    $retorno['mensagem'] = 'Preenchimento obrigatório de todos os campos.';
    http_response_code(400);
    echo json_encode($retorno);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $retorno['mensagem'] = 'E-mail inválido.';
    http_response_code(400);
    echo json_encode($retorno);
    exit();
}

$senha_hash = password_hash($senha, PASSWORD_DEFAULT);

$conexao->begin_transaction();

$stmt_usuario = $conexao->prepare(
    "INSERT INTO usuarios (nome, email, senha_hash, tipo, telefone, nome_empresa, status_conta)
     VALUES (?, ?, ?, 'client', ?, ?, 'aprovado')"
);

if (!$stmt_usuario) {
    $conexao->rollback();
    $retorno['mensagem'] = 'Erro ao preparar cadastro do usuário.';
    http_response_code(500);
    echo json_encode($retorno);
    exit();
}

$stmt_usuario->bind_param('sssss', $nome, $email, $senha_hash, $telefone, $empresa);

if (!$stmt_usuario->execute()) {
    $conexao->rollback();
    $retorno['mensagem'] = ($conexao->errno == 1062) ? 'Este e-mail já está cadastrado.' : 'Erro ao cadastrar cliente.';
    $stmt_usuario->close();
    http_response_code(400);
    echo json_encode($retorno);
    exit();
}

$usuario_id = $conexao->insert_id;
$stmt_usuario->close();

$stmt_cliente = $conexao->prepare(
    "INSERT INTO clientes (agencia_id, usuario_id, nome, email, telefone, senha, empresa)
     VALUES (?, ?, ?, ?, ?, ?, ?)"
);

if (!$stmt_cliente) {
    $conexao->rollback();
    $retorno['mensagem'] = 'Erro ao preparar cadastro do cliente.';
    http_response_code(500);
    echo json_encode($retorno);
    exit();
}

$stmt_cliente->bind_param('iisssss', $agencia_id, $usuario_id, $nome, $email, $telefone, $senha_hash, $empresa);

if (!$stmt_cliente->execute()) {
    $conexao->rollback();
    $retorno['mensagem'] = ($conexao->errno == 1062) ? 'Este e-mail já está cadastrado.' : 'Erro ao cadastrar cliente.';
    $stmt_cliente->close();
    http_response_code(500);
    echo json_encode($retorno);
    exit();
}

$cliente_id = $conexao->insert_id;
$stmt_cliente->close();

$conexao->commit();

$retorno['status'] = 'ok';
$retorno['mensagem'] = 'Cliente cadastrado com sucesso.';
$retorno['data'] = [
    'id' => $cliente_id,
    'usuario_id' => $usuario_id,
    'nome' => $nome,
    'email' => $email,
    'empresa' => $empresa,
];

echo json_encode($retorno);

?>
