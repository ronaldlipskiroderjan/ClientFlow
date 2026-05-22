<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Requisição inválida.",
    "data" => null
];

$usuario_id = $_SESSION['usuario_id'] ?? null;
$tipo = $_SESSION['usuario_tipo'] ?? null;
$agencia_id = $_SESSION['agencia_id'] ?? null;
$permissoes = $_SESSION['permissoes'] ?? [];

if (empty($usuario_id)) {
    $retorno["mensagem"] = "Usuário não autenticado.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($tipo === 'client') {
    $retorno["mensagem"] = "Perfil sem permissão para buscar clientes.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if (($tipo === 'agency' || $tipo === 'agency_member' || $tipo === 'freelancer') && empty($permissoes['perm_designar_projetos'])) {
    $retorno["mensagem"] = "Você não tem permissão para vincular clientes por documento.";
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

$cpf_input = $_POST['cpf'] ?? $_GET['cpf'] ?? '';
$cpf_cnpj = preg_replace('/[^0-9]/', '', $cpf_input);

if (empty($cpf_cnpj) || (strlen($cpf_cnpj) !== 11 && strlen($cpf_cnpj) !== 14)) {
    $retorno["mensagem"] = "CPF/CNPJ inválido.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$stmt = $conexao->prepare("SELECT id, nome, email, nome_empresa FROM usuarios WHERE documento = ? AND tipo = 'client' LIMIT 1");
$stmt->bind_param("s", $cpf_cnpj);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    $retorno["mensagem"] = "Nenhum cliente encontrado com este CPF/CNPJ.";
    $stmt->close();
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$cliente_usuario = $res->fetch_assoc();
$cliente_usuario_id = intval($cliente_usuario['id']);
$stmt->close();

$ja_cliente = false;
$cliente_id = 0;

$stmt_cli = $conexao->prepare("SELECT id FROM clientes WHERE usuario_id = ? AND agencia_id = ? LIMIT 1");
$stmt_cli->bind_param("ii", $cliente_usuario_id, $agencia_id);
$stmt_cli->execute();
$res_cli = $stmt_cli->get_result();
if ($res_cli->num_rows > 0) {
    $ja_cliente = true;
    $row = $res_cli->fetch_assoc();
    $cliente_id = $row['id'];
}
$stmt_cli->close();

$retorno["status"] = "ok";
$retorno["mensagem"] = "Cliente encontrado.";
$retorno["data"] = [
    "usuario_id" => $cliente_usuario_id,
    "nome" => $cliente_usuario['nome'],
    "email" => $cliente_usuario['email'],
    "empresa" => $cliente_usuario['nome_empresa'],
    "ja_cliente" => $ja_cliente,
    "cliente_id" => $cliente_id
];

$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
