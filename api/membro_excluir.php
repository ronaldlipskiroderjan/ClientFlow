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
    $retorno["mensagem"] = "Apenas o administrador da agência pode desativar membros.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$ua_id_alvo = intval($_POST['ua_id'] ?? 0);
if ($ua_id_alvo <= 0) {
    $retorno["mensagem"] = "ID do membro inválido.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($ua_id_alvo == $_SESSION['ua_id']) {
    $retorno["mensagem"] = "Você não pode desativar a si mesmo.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$stmt_check = $conexao->prepare("SELECT id, papel FROM usuarios_agencia WHERE id = ? AND agencia_id = ?");
$stmt_check->bind_param("ii", $ua_id_alvo, $agencia_id);
$stmt_check->execute();
$res_check = $stmt_check->get_result();

if ($res_check->num_rows !== 1) {
    $retorno["mensagem"] = "Membro não encontrado nesta agência.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$alvo = $res_check->fetch_assoc();
$stmt_check->close();

if ($alvo['papel'] === 'admin_agencia') {
    $retorno["mensagem"] = "Não é possível desativar o administrador principal da agência.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

// Em vez de deletar o usuario, apenas desativa o vinculo na agência (ativo = 0)
// e tambem limpa suas designações de projetos
$conexao->begin_transaction();

try {
    $stmt_update = $conexao->prepare("UPDATE usuarios_agencia SET ativo = 0 WHERE id = ? AND agencia_id = ?");
    $stmt_update->bind_param("ii", $ua_id_alvo, $agencia_id);
    if (!$stmt_update->execute()) {
        throw new Exception("Erro ao desativar membro.");
    }
    $stmt_update->close();
    
    $stmt_del_proj = $conexao->prepare("DELETE FROM projetos_membros WHERE usuario_agencia_id = ?");
    $stmt_del_proj->bind_param("i", $ua_id_alvo);
    $stmt_del_proj->execute();
    $stmt_del_proj->close();

    $conexao->commit();
    
    $retorno["status"] = "ok";
    $retorno["mensagem"] = "Membro desativado com sucesso.";

} catch (Exception $e) {
    $conexao->rollback();
    $retorno["mensagem"] = $e->getMessage();
}

$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
