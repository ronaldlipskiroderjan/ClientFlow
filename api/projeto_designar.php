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

if (empty($permissoes['perm_designar_projetos'])) {
    $retorno["mensagem"] = "Você não tem permissão para designar projetos.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$ua_id_alvo = intval($_POST['ua_id'] ?? 0);
$checklist_id = intval($_POST['checklist_id'] ?? 0);
$acao = trim($_POST['acao'] ?? 'vincular'); // 'vincular' ou 'remover'

if ($ua_id_alvo <= 0 || $checklist_id <= 0) {
    $retorno["mensagem"] = "Dados informados inválidos.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

// 1. Validar se o checklist alvo pertence a agência
$stmt_chk = $conexao->prepare("SELECT id FROM checklists WHERE id = ? AND agencia_id = ?");
$stmt_chk->bind_param("ii", $checklist_id, $agencia_id);
$stmt_chk->execute();
if ($stmt_chk->get_result()->num_rows !== 1) {
    $retorno["mensagem"] = "O projeto (checklist) informado não pertence a esta agência.";
    $stmt_chk->close();
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}
$stmt_chk->close();

// 2. Validar se o membro alvo pertence a agência
$stmt_mbr = $conexao->prepare("SELECT id FROM usuarios_agencia WHERE id = ? AND agencia_id = ?");
$stmt_mbr->bind_param("ii", $ua_id_alvo, $agencia_id);
$stmt_mbr->execute();
if ($stmt_mbr->get_result()->num_rows !== 1) {
    $retorno["mensagem"] = "Membro informado não pertence a esta agência.";
    $stmt_mbr->close();
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}
$stmt_mbr->close();

if ($acao === 'vincular') {
    $stmt = $conexao->prepare("INSERT IGNORE INTO projetos_membros (checklist_id, usuario_agencia_id) VALUES (?, ?)");
    $stmt->bind_param("ii", $checklist_id, $ua_id_alvo);
    if ($stmt->execute()) {
        $retorno["status"] = "ok";
        $retorno["mensagem"] = "Projeto designado com sucesso.";
    } else {
        $retorno["mensagem"] = "Erro ao designar projeto.";
    }
    $stmt->close();
} else if ($acao === 'remover') {
    $stmt = $conexao->prepare("DELETE FROM projetos_membros WHERE checklist_id = ? AND usuario_agencia_id = ?");
    $stmt->bind_param("ii", $checklist_id, $ua_id_alvo);
    if ($stmt->execute()) {
        $retorno["status"] = "ok";
        $retorno["mensagem"] = "Designação de projeto removida.";
    } else {
        $retorno["mensagem"] = "Erro ao remover designação de projeto.";
    }
    $stmt->close();
} else {
    $retorno["mensagem"] = "Ação inválida.";
}

$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
