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

if (empty($permissoes['perm_gerenciar_membros'])) {
    $retorno["mensagem"] = "Você não tem permissão para gerenciar membros.";
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
    $retorno["mensagem"] = "Você não pode alterar suas próprias permissões.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

// Verifica se o alvo pertence a mesma agencia
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
    $retorno["mensagem"] = "Não é possível alterar as permissões do administrador principal da agência.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$papel = trim($_POST['papel'] ?? '');
$perm_ver_clientes = isset($_POST['perm_ver_clientes']) && $_POST['perm_ver_clientes'] === '1' ? 1 : 0;
$perm_criar_clientes = isset($_POST['perm_criar_clientes']) && $_POST['perm_criar_clientes'] === '1' ? 1 : 0;
$perm_ver_projetos = isset($_POST['perm_ver_projetos']) && $_POST['perm_ver_projetos'] === '1' ? 1 : 0;
$perm_criar_projetos = isset($_POST['perm_criar_projetos']) && $_POST['perm_criar_projetos'] === '1' ? 1 : 0;
$perm_designar_projetos = isset($_POST['perm_designar_projetos']) && $_POST['perm_designar_projetos'] === '1' ? 1 : 0;
$perm_financeiro = isset($_POST['perm_financeiro']) && $_POST['perm_financeiro'] === '1' ? 1 : 0;
$perm_gerenciar_membros = isset($_POST['perm_gerenciar_membros']) && $_POST['perm_gerenciar_membros'] === '1' ? 1 : 0;

$papeis_permitidos = ['gerente', 'dev', 'gestor_cliente', 'financeiro'];
if (!in_array($papel, $papeis_permitidos)) {
    $retorno["mensagem"] = "Papel inválido.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$stmt_update = $conexao->prepare(
    "UPDATE usuarios_agencia SET 
        papel = ?, 
        perm_ver_clientes = ?, 
        perm_criar_clientes = ?,
        perm_ver_projetos = ?, 
        perm_criar_projetos = ?, 
        perm_designar_projetos = ?,
        perm_financeiro = ?, 
        perm_gerenciar_membros = ?
    WHERE id = ? AND agencia_id = ?"
);

$stmt_update->bind_param(
    "siiiiiiiii",
    $papel,
    $perm_ver_clientes, $perm_criar_clientes,
    $perm_ver_projetos, $perm_criar_projetos, $perm_designar_projetos,
    $perm_financeiro, $perm_gerenciar_membros,
    $ua_id_alvo, $agencia_id
);

if ($stmt_update->execute()) {
    $retorno["status"] = "ok";
    $retorno["mensagem"] = "Permissões atualizadas com sucesso.";
} else {
    $retorno["mensagem"] = "Erro ao atualizar permissões.";
}

$stmt_update->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
