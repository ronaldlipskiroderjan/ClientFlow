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

function has_sequencia_obvia($valor)
{
    $valor = strtolower((string) $valor);
    preg_match_all('/[a-z0-9]+/', $valor, $matches);
    $segmentos = $matches[0] ?? [];

    foreach ($segmentos as $segmento) {
        $len = strlen($segmento);
        if ($len < 3) {
            continue;
        }

        for ($i = 0; $i <= $len - 3; $i++) {
            $a = ord($segmento[$i]);
            $b = ord($segmento[$i + 1]);
            $c = ord($segmento[$i + 2]);

            if (($b === $a + 1 && $c === $b + 1) || ($b === $a - 1 && $c === $b - 1)) {
                return true;
            }
        }
    }

    return false;
}

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

if (!preg_match('/[A-Z]/', $nova_senha)) {
    $retorno["mensagem"] = "A nova senha deve conter ao menos 1 letra maiúscula.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if (!preg_match('/[a-z]/', $nova_senha)) {
    $retorno["mensagem"] = "A nova senha deve conter ao menos 1 letra minúscula.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if (!preg_match('/\d/', $nova_senha)) {
    $retorno["mensagem"] = "A nova senha deve conter ao menos 1 número.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if (!preg_match('/[^A-Za-z0-9]/', $nova_senha)) {
    $retorno["mensagem"] = "A nova senha deve conter ao menos 1 caractere especial.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if (preg_match('/(.)\1{2,}/', $nova_senha)) {
    $retorno["mensagem"] = "A nova senha não pode repetir o mesmo caractere em sequência.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if (has_sequencia_obvia($nova_senha)) {
    $retorno["mensagem"] = "A nova senha não pode conter sequências óbvias como 123 ou abc.";
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

if (password_verify($nova_senha, $row['senha_hash'])) {
    $retorno["mensagem"] = "A nova senha precisa ser diferente da senha atual.";
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
