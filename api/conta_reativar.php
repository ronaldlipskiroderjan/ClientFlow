<?php
include_once __DIR__ . "/db_conexao.php";

$retorno = ["status" => "nok", "mensagem" => "Dados inválidos.", "data" => null];

$email = trim($_POST['email'] ?? '');
$senha = $_POST['senha'] ?? '';

if (empty($email) || empty($senha)) {
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$stmt = $conexao->prepare(
    "SELECT id, nome, email, senha_hash, tipo, status_conta, desativacao_aceita_em
     FROM usuarios WHERE email = ?"
);
$stmt->bind_param("s", $email);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows !== 1) {
    $retorno["mensagem"] = "Credenciais inválidas.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$usuario = $res->fetch_assoc();
$stmt->close();

if (!password_verify($senha, $usuario['senha_hash'])) {
    $retorno["mensagem"] = "Credenciais inválidas.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($usuario['status_conta'] !== 'desativado') {
    $retorno["mensagem"] = "Esta conta não está desativada.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$aceita_em = $usuario['desativacao_aceita_em'] ?? null;
$expira_em = $aceita_em ? strtotime($aceita_em) + 180 * 86400 : null;

if ($expira_em && $expira_em < time()) {
    $retorno["mensagem"] = "O prazo de reativação expirou. A conta foi desativada permanentemente.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$stmt_upd = $conexao->prepare(
    "UPDATE usuarios
     SET status_conta = 'aprovado', desativacao_aceita_em = NULL, desativacao_solicitada_em = NULL
     WHERE id = ?"
);
$stmt_upd->bind_param("i", $usuario['id']);

if (!$stmt_upd->execute()) {
    $retorno["mensagem"] = "Erro ao reativar a conta.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}
$stmt_upd->close();

session_start();
$_SESSION['usuario_id']    = $usuario['id'];
$_SESSION['usuario_nome']  = $usuario['nome'];
$_SESSION['usuario_email'] = $usuario['email'];
$_SESSION['usuario_tipo']  = $usuario['tipo'];

$retorno["status"]   = "ok";
$retorno["mensagem"] = "Conta reativada com sucesso!";
$retorno["data"]     = ["tipo" => $usuario['tipo']];

$conexao->close();
header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
