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

$usuario_id = $_SESSION['usuario_id'] ?? null;
$usuario_tipo = $_SESSION['usuario_tipo'] ?? null;
$agencia_id = $_SESSION['agencia_id'] ?? null;
$ua_id = $_SESSION['ua_id'] ?? null;
$papel_agencia = $_SESSION['papel_agencia'] ?? null;

if (empty($usuario_id)) {
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

$sql_base = "SELECT i.status, COUNT(*) AS total
             FROM itens_checklist i
             INNER JOIN checklists c ON c.id = i.checklist_id ";

if ($usuario_tipo === "freelancer") {
    $sql_base .= " WHERE c.agencia_id IS NULL AND c.cliente_id IN (SELECT id FROM clientes WHERE usuario_id = ?) GROUP BY i.status";
    $stmt = $conexao->prepare($sql_base);
    $stmt->bind_param("i", $usuario_id);
} else {
    if ($papel_agencia === 'dev') {
        $sql_base .= " INNER JOIN projetos_membros pm ON pm.checklist_id = c.id
                       WHERE c.agencia_id = ? AND pm.usuario_agencia_id = ? GROUP BY i.status";
        $stmt = $conexao->prepare($sql_base);
        $stmt->bind_param("ii", $agencia_id, $ua_id);
    } else {
        $sql_base .= " WHERE c.agencia_id = ? GROUP BY i.status";
        $stmt = $conexao->prepare($sql_base);
        $stmt->bind_param("i", $agencia_id);
    }
}

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
