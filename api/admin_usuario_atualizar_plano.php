<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Não autorizado"
];

$usuario_tipo = $_SESSION['usuario_tipo'] ?? null;

if ($usuario_tipo !== 'admin') {
    $retorno["mensagem"] = "Perfil sem permissão para acessar esta área.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$usuario_id = isset($_POST['usuario_id']) ? (int)$_POST['usuario_id'] : (isset($input['usuario_id']) ? (int)$input['usuario_id'] : 0);
$plano_id = isset($_POST['plano_id']) ? (int)$_POST['plano_id'] : (isset($input['plano_id']) ? (int)$input['plano_id'] : 0);

if ($usuario_id <= 0 || $plano_id <= 0) {
    $retorno["mensagem"] = "Dados inválidos.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$stmt = $conexao->prepare("UPDATE usuarios SET plano_id = ? WHERE id = ?");
$stmt->bind_param("ii", $plano_id, $usuario_id);

if ($stmt->execute()) {
    $stmt_check = $conexao->prepare("SELECT tipo FROM usuarios WHERE id = ?");
    $stmt_check->bind_param("i", $usuario_id);
    $stmt_check->execute();
    $res_check = $stmt_check->get_result();
    $u_data = $res_check->fetch_assoc();
    $stmt_check->close();

    if ($u_data && in_array($u_data['tipo'], ['agency', 'agency_member'])) {
        $stmt_ag = $conexao->prepare("SELECT agencia_id FROM usuarios_agencia WHERE usuario_id = ? LIMIT 1");
        $stmt_ag->bind_param("i", $usuario_id);
        $stmt_ag->execute();
        $res_ag = $stmt_ag->get_result();
        $ag_data = $res_ag->fetch_assoc();
        $stmt_ag->close();

        if ($ag_data) {
            $agencia_id = $ag_data['agencia_id'];
            $tipo_plano_id = $plano_id;
            
            $stmt_ass = $conexao->prepare("
                INSERT INTO assinaturas_planos (agencia_id, tipo_plano_id, data_inicio, status, tipo_renovacao) 
                VALUES (?, ?, CURDATE(), 'ativa', 'mensal')
                ON DUPLICATE KEY UPDATE tipo_plano_id = ?, status = 'ativa'
            ");
            $stmt_ass->bind_param("iii", $agencia_id, $tipo_plano_id, $tipo_plano_id);
            $stmt_ass->execute();
            $stmt_ass->close();
        }
    }

    $retorno["status"] = "ok";
    $retorno["mensagem"] = "Plano atualizado com sucesso. Limites recalculados automaticamente.";
} else {
    $retorno["mensagem"] = "Erro ao atualizar plano: " . $conexao->error;
}

$stmt->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
