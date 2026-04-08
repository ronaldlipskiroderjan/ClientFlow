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
    $retorno["mensagem"] = "Perfil sem permissão para revisar itens.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$item_id = intval($_POST['item_id'] ?? 0);
$acao = trim($_POST['acao'] ?? '');
$motivo = trim($_POST['motivo'] ?? '');

if ($item_id <= 0 || !in_array($acao, ["aprovar", "reprovar"], true)) {
    $retorno["mensagem"] = "Parâmetros inválidos.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($acao === "reprovar" && $motivo === "") {
    $retorno["mensagem"] = "Informe o motivo da reprovação.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$stmt_check = $conexao->prepare(
    "SELECT i.id
     FROM itens_checklist i
     INNER JOIN checklists c ON c.id = i.checklist_id
     WHERE i.id = ? AND c.agencia_usuario_id = ?"
);
$stmt_check->bind_param("ii", $item_id, $agencia_usuario_id);
$stmt_check->execute();
$check_result = $stmt_check->get_result();

if ($check_result->num_rows !== 1) {
    $retorno["mensagem"] = "Item não encontrado para esta agência.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    $stmt_check->close();
    $conexao->close();
    exit();
}
$stmt_check->close();

$novo_status = $acao === "aprovar" ? "approved" : "rejected";
$novo_motivo = $acao === "aprovar" ? null : $motivo;

$stmt_update = $conexao->prepare(
    "UPDATE itens_checklist
     SET status = ?, motivo_rejeicao = ?
     WHERE id = ?"
);
$stmt_update->bind_param("ssi", $novo_status, $novo_motivo, $item_id);

if ($stmt_update->execute()) {
    $retorno["status"] = "ok";
    $retorno["mensagem"] = $acao === "aprovar" ? "Item aprovado." : "Item reprovado e devolvido ao cliente.";
    $retorno["data"] = [
        "item_id" => $item_id,
        "status" => $novo_status
    ];
} else {
    $retorno["mensagem"] = "Erro ao revisar item.";
}

$stmt_update->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>