<?php
include_once("db_conexao.php");
session_start();

header("Content-Type: application/json; charset=utf-8");

$retorno = ["status" => "nok", "mensagem" => "Não autenticado."];

$usuario_id  = $_SESSION['usuario_id']  ?? null;
$agencia_id  = $_SESSION['agencia_id']  ?? null;
$permissoes  = $_SESSION['permissoes']  ?? [];

if (!$usuario_id || !$agencia_id) {
    echo json_encode($retorno);
    exit();
}

if (empty($permissoes['perm_criar_projetos'])) {
    $retorno["mensagem"] = "Sem permissão para excluir projetos.";
    echo json_encode($retorno);
    exit();
}

$checklist_id = intval($_POST['checklist_id'] ?? 0);

if ($checklist_id <= 0) {
    $retorno["mensagem"] = "ID de projeto inválido.";
    echo json_encode($retorno);
    exit();
}

// Verifica que o checklist pertence à agência logada
$stmt = $conexao->prepare("SELECT id, titulo FROM checklists WHERE id = ? AND agencia_id = ? LIMIT 1");
$stmt->bind_param("ii", $checklist_id, $agencia_id);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    $stmt->close();
    $retorno["mensagem"] = "Projeto não encontrado ou sem permissão.";
    echo json_encode($retorno);
    exit();
}

$checklist = $res->fetch_assoc();
$stmt->close();

// Deleta (ON DELETE CASCADE cuida dos itens e vínculos)
$del = $conexao->prepare("DELETE FROM checklists WHERE id = ? AND agencia_id = ?");
$del->bind_param("ii", $checklist_id, $agencia_id);

if ($del->execute() && $del->affected_rows > 0) {
    $retorno = [
        "status"   => "ok",
        "mensagem" => "Projeto \"{$checklist['titulo']}\" excluído com sucesso."
    ];
} else {
    $retorno["mensagem"] = "Erro ao excluir o projeto. Tente novamente.";
}

$del->close();
$conexao->close();
echo json_encode($retorno);
?>
