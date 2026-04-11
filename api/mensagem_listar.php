<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Não autorizado",
    "data" => []
];

$usuario_id = $_SESSION['usuario_id'] ?? null;
$usuario_tipo = $_SESSION['usuario_tipo'] ?? null;

if (empty($usuario_id)) {
    header("Content-type: application/json;charset=utf-8");
    echo json_encode($retorno);
    exit();
}

$checklist_id = $_GET['checklist_id'] ?? null;

if (empty($checklist_id)) {
    $retorno["mensagem"] = "checklist_id não fornecido";
    header("Content-type: application/json;charset=utf-8");
    echo json_encode($retorno);
    exit();
}

// Check authorization
$pode_acessar = false;

if ($usuario_tipo === 'client') {
    // client must be linked to the checklist via cliente_id -> client table -> usuario_id
    $stmt = $conexao->prepare("
        SELECT c.id FROM checklists ch
        JOIN clientes c ON ch.cliente_id = c.id
        WHERE ch.id = ? AND c.usuario_id = ?
    ");
    $stmt->bind_param("ii", $checklist_id, $usuario_id);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        $pode_acessar = true;
    }
    $stmt->close();
} else if ($usuario_tipo === 'agency' || $usuario_tipo === 'freelancer') {
    $stmt = $conexao->prepare("SELECT id FROM checklists WHERE id = ? AND agencia_usuario_id = ?");
    $stmt->bind_param("ii", $checklist_id, $usuario_id);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        $pode_acessar = true;
    }
    $stmt->close();
} else if ($usuario_tipo === 'admin') {
    $pode_acessar = true;
}

if (!$pode_acessar) {
    header("Content-type: application/json;charset=utf-8");
    echo json_encode($retorno);
    exit();
}

// Fetch messages
$stmt = $conexao->prepare("
    SELECT m.id, m.mensagem, m.criado_em, m.remetente_usuario_id, u.nome as remetente_nome, u.tipo as remetente_tipo
    FROM mensagens_checklist m
    JOIN usuarios u ON m.remetente_usuario_id = u.id
    WHERE m.checklist_id = ?
    ORDER BY m.criado_em ASC
");
$stmt->bind_param("i", $checklist_id);
$stmt->execute();
$resultado = $stmt->get_result();

$mensagens = [];
while ($linha = $resultado->fetch_assoc()) {
    $mensagens[] = $linha;
}
$stmt->close();

$retorno["status"] = "ok";
$retorno["mensagem"] = "Mensagens carregadas com sucesso.";
$retorno["data"] = $mensagens;

$conexao->close();
header("Content-type: application/json;charset=utf-8");
echo json_encode($retorno);
?>
