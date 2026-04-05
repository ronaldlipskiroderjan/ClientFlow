<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Usuário não autenticado",
    "data" => [
        "finished" => 0,
        "pending" => 0,
        "review" => 0
    ]
];

$agencia_usuario_id = $_SESSION['usuario_id'] ?? null;
$usuario_tipo = $_SESSION['usuario_tipo'] ?? null;

if (empty($agencia_usuario_id)) {
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($usuario_tipo === "client") {
    $retorno["mensagem"] = "Perfil sem permissão para acessar esta área.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$stmt = $conexao->prepare(
    "SELECT i.status, COUNT(*) AS total
     FROM itens_checklist i
     INNER JOIN checklists c ON c.id = i.checklist_id
     WHERE c.agencia_usuario_id = ?
     GROUP BY i.status"
);
$stmt->bind_param("i", $agencia_usuario_id);
$stmt->execute();
$resultado = $stmt->get_result();

$finished = 0;
$pending = 0;
$review = 0;

while ($linha = $resultado->fetch_assoc()) {
    $status = $linha['status'];
    $total = intval($linha['total']);

    if ($status === 'approved') {
        $finished += $total;
    } else if ($status === 'pending' || $status === 'rejected') {
        $pending += $total;
    } else if ($status === 'review') {
        $review += $total;
    }
}

$retorno["status"] = "ok";
$retorno["mensagem"] = "Resumo carregado com sucesso.";
$retorno["data"] = [
    "finished" => $finished,
    "pending" => $pending,
    "review" => $review
];

$stmt->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
