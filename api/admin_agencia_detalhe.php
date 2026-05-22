<?php
include_once("db_conexao.php");
session_start();

header("Content-type: application/json;charset:utf-8");

$retorno = ["status" => "nok", "mensagem" => "Não autorizado"];

$usuario_tipo = $_SESSION['usuario_tipo'] ?? null;
if ($usuario_tipo !== 'admin') {
    echo json_encode($retorno);
    exit();
}

$usuario_id = isset($_GET['usuario_id']) ? (int)$_GET['usuario_id'] : 0;
if ($usuario_id <= 0) {
    $retorno["mensagem"] = "Dados inválidos.";
    echo json_encode($retorno);
    exit();
}

$stmt = $conexao->prepare(
    "SELECT ua.agencia_id, a.nome_empresa
     FROM usuarios_agencia ua
     JOIN agencias a ON a.id = ua.agencia_id
     WHERE ua.usuario_id = ? AND ua.papel = 'admin_agencia'
     LIMIT 1"
);
$stmt->bind_param("i", $usuario_id);
$stmt->execute();
$agencia = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$agencia) {
    $retorno["mensagem"] = "Agência não encontrada para este usuário.";
    echo json_encode($retorno);
    exit();
}

$agencia_id = $agencia['agencia_id'];

$stmt_c = $conexao->prepare(
    "SELECT c.id, c.nome, c.email, c.empresa, c.usuario_id, c.criado_em,
            u.status_conta
     FROM clientes c
     LEFT JOIN usuarios u ON u.id = c.usuario_id
     WHERE c.agencia_id = ?
     ORDER BY c.nome ASC"
);
$stmt_c->bind_param("i", $agencia_id);
$stmt_c->execute();
$clientes = $stmt_c->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt_c->close();

$stmt_m = $conexao->prepare(
    "SELECT u.id AS usuario_id, u.nome, u.email, u.status_conta, ua.papel, ua.criado_em
     FROM usuarios_agencia ua
     INNER JOIN usuarios u ON u.id = ua.usuario_id
     WHERE ua.agencia_id = ? AND ua.papel != 'admin_agencia'
     ORDER BY u.nome ASC"
);
$stmt_m->bind_param("i", $agencia_id);
$stmt_m->execute();
$colaboradores = $stmt_m->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt_m->close();

$conexao->close();

echo json_encode([
    "status" => "ok",
    "data"   => [
        "agencia"      => $agencia,
        "clientes"     => $clientes,
        "colaboradores"=> $colaboradores
    ]
]);
