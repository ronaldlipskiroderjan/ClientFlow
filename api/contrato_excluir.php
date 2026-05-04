<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Requisição inválida.",
    "data" => null
];

$usuario_id = $_SESSION['usuario_id'] ?? null;
$agencia_id = $_SESSION['agencia_id'] ?? null;
$papel_agencia = $_SESSION['papel_agencia'] ?? null;

if (empty($usuario_id) || empty($agencia_id)) {
    $retorno["mensagem"] = "Usuário não autenticado ou não pertence a uma agência.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($papel_agencia !== 'admin_agencia') {
    $retorno["mensagem"] = "Apenas o administrador principal pode excluir contratos.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$id = intval($_POST['id'] ?? 0);

if (empty($id)) {
    $retorno["mensagem"] = "Contrato não informado.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$stmt_del = $conexao->prepare("DELETE FROM contratos WHERE id = ? AND agencia_id = ?");
$stmt_del->bind_param("ii", $id, $agencia_id);

if ($stmt_del->execute()) {
    if ($stmt_del->affected_rows > 0) {
        $retorno["status"] = "ok";
        $retorno["mensagem"] = "Contrato excluído com sucesso.";
    } else {
         $retorno["mensagem"] = "Contrato não encontrado.";
    }
} else {
    $retorno["mensagem"] = "Erro ao excluir contrato.";
}

$stmt_del->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
