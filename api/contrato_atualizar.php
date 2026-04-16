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
$permissoes = $_SESSION['permissoes'] ?? [];

if (empty($usuario_id) || empty($agencia_id)) {
    $retorno["mensagem"] = "Usuário não autenticado ou não pertence a uma agência.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if (empty($permissoes['perm_financeiro'])) {
    $retorno["mensagem"] = "Você não tem permissão para acessar o financeiro/contratos.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$id = intval($_POST['id'] ?? 0);
$status_pagamento = trim($_POST['status_pagamento'] ?? '');
$status_projeto = trim($_POST['status_projeto'] ?? '');

if (empty($id) || empty($status_pagamento) || empty($status_projeto)) {
    $retorno["mensagem"] = "Parâmetros incompletos.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$stmt_upd = $conexao->prepare("UPDATE contratos SET status_pagamento = ?, status_projeto = ? WHERE id = ? AND agencia_id = ?");
$stmt_upd->bind_param("ssii", $status_pagamento, $status_projeto, $id, $agencia_id);

if ($stmt_upd->execute()) {
    if ($stmt_upd->affected_rows > 0) {
        $retorno["status"] = "ok";
        $retorno["mensagem"] = "Contrato atualizado com sucesso.";
    } else {
         $retorno["mensagem"] = "Contrato não encontrado ou não houve alteração.";
    }
} else {
    $retorno["mensagem"] = "Erro ao atualizar contrato.";
}

$stmt_upd->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
