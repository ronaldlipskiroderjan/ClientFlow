<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Não autorizado",
    "data" => null
];

$usuario_id = $_SESSION['usuario_id'] ?? null;
$usuario_tipo = $_SESSION['usuario_tipo'] ?? null;
$usuario_email = $_SESSION['usuario_email'] ?? null;
$agencia_id = $_SESSION['agencia_id'] ?? null;
$ua_id = $_SESSION['ua_id'] ?? null;
$papel_agencia = $_SESSION['papel_agencia'] ?? null;
$permissoes = $_SESSION['permissoes'] ?? [];

if (empty($usuario_id)) {
    header("Content-type: application/json;charset=utf-8");
    echo json_encode($retorno);
    exit();
}

$checklist_id = $_POST['checklist_id'] ?? null;
$mensagem = trim($_POST['mensagem'] ?? '');

if (empty($checklist_id) || empty($mensagem)) {
    $retorno["mensagem"] = "checklist_id e mensagem são obrigatórios";
    header("Content-type: application/json;charset=utf-8");
    echo json_encode($retorno);
    exit();
}

// Check authorization
$pode_acessar = false;

if ($usuario_tipo === 'client') {
    $stmt = $conexao->prepare("
        SELECT c.id FROM checklists ch
        JOIN clientes c ON ch.cliente_id = c.id
        WHERE ch.id = ? AND (c.usuario_id = ? OR c.email = ?)
    ");
    $stmt->bind_param("iis", $checklist_id, $usuario_id, $usuario_email);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        $pode_acessar = true;
    }
    $stmt->close();
} else if ($usuario_tipo === 'agency' || $usuario_tipo === 'agency_member' || $usuario_tipo === 'freelancer') {
    if ($usuario_tipo === 'freelancer') {
        $stmt = $conexao->prepare("
            SELECT ch.id
            FROM checklists ch
            JOIN clientes c ON ch.cliente_id = c.id
            WHERE ch.id = ? AND ch.agencia_id IS NULL AND c.usuario_id = ?
        ");
        $stmt->bind_param("ii", $checklist_id, $usuario_id);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            $pode_acessar = true;
        }
        $stmt->close();
    } else {
        if (empty($permissoes['perm_ver_projetos'])) {
            $retorno["mensagem"] = "Você não tem permissão para enviar mensagens.";
            header("Content-type: application/json;charset:utf-8");
            echo json_encode($retorno);
            exit();
        }

        if ($papel_agencia === 'dev') {
            $stmt = $conexao->prepare("
                SELECT ch.id
                FROM checklists ch
                INNER JOIN projetos_membros pm ON pm.checklist_id = ch.id
                WHERE ch.id = ? AND ch.agencia_id = ? AND pm.usuario_agencia_id = ?
            ");
            $stmt->bind_param("iii", $checklist_id, $agencia_id, $ua_id);
        } else {
            $stmt = $conexao->prepare("SELECT id FROM checklists WHERE id = ? AND agencia_id = ?");
            $stmt->bind_param("ii", $checklist_id, $agencia_id);
        }

        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            $pode_acessar = true;
        }
        $stmt->close();
    }
} else if ($usuario_tipo === 'admin') {
    $pode_acessar = true;
}

if (!$pode_acessar) {
    header("Content-type: application/json;charset=utf-8");
    echo json_encode($retorno);
    exit();
}

// Insert message
$stmt = $conexao->prepare("
    INSERT INTO mensagens_checklist (checklist_id, remetente_usuario_id, mensagem)
    VALUES (?, ?, ?)
");
$stmt->bind_param("iis", $checklist_id, $usuario_id, $mensagem);
if ($stmt->execute()) {
    $mensagem_id = $conexao->insert_id;
    $retorno["status"] = "ok";
    $retorno["mensagem"] = "Mensagem enviada com sucesso.";
    $retorno["data"] = [
        "id" => $mensagem_id,
        "checklist_id" => $checklist_id,
        "remetente_usuario_id" => $usuario_id,
        "mensagem" => $mensagem
    ];
} else {
    $retorno["mensagem"] = "Erro ao enviar mensagem.";
}
$stmt->close();

$conexao->close();
header("Content-type: application/json;charset=utf-8");
echo json_encode($retorno);
?>
