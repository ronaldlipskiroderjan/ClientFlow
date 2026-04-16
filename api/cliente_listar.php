<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Usuário não autenticado",
    "data" => []
];

$usuario_id = $_SESSION['usuario_id'] ?? null;
$usuario_tipo = $_SESSION['usuario_tipo'] ?? null;
$agencia_id = $_SESSION['agencia_id'] ?? null;
$ua_id = $_SESSION['ua_id'] ?? null;
$papel_agencia = $_SESSION['papel_agencia'] ?? null;
$permissoes = $_SESSION['permissoes'] ?? [];

if (empty($usuario_id)) {
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($usuario_tipo === "client") {
    $retorno["mensagem"] = "Perfil sem permissão para listar clientes.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if (($usuario_tipo === 'agency' || $usuario_tipo === 'agency_member') && empty($permissoes['perm_ver_clientes'])) {
    $retorno["mensagem"] = "Você não tem permissão para visualizar clientes.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($usuario_tipo === 'freelancer') {
    $stmt = $conexao->prepare(
        "SELECT id, usuario_id, nome, email, empresa, criado_em
         FROM clientes
         WHERE usuario_id = ?
         ORDER BY criado_em DESC"
    );
    $stmt->bind_param("i", $usuario_id);
} else {
    // Agency member
    if ($papel_agencia === 'dev') {
        // Devs só podem ver clientes que têm ao menos 1 projeto designado a eles
        $stmt = $conexao->prepare(
            "SELECT DISTINCT cl.id, cl.usuario_id, cl.nome, cl.email, cl.empresa, cl.criado_em
             FROM clientes cl
             INNER JOIN checklists chk ON chk.cliente_id = cl.id
             INNER JOIN projetos_membros pm ON pm.checklist_id = chk.id
             WHERE cl.agencia_id = ? AND pm.usuario_agencia_id = ?
             ORDER BY cl.criado_em DESC"
        );
        $stmt->bind_param("ii", $agencia_id, $ua_id);
    } else {
        // Demais papeis com permissão veem todos os clientes da agencia
        $stmt = $conexao->prepare(
            "SELECT id, usuario_id, nome, email, empresa, criado_em
             FROM clientes
             WHERE agencia_id = ?
             ORDER BY criado_em DESC"
        );
        $stmt->bind_param("i", $agencia_id);
    }
}

$stmt->execute();
$resultado = $stmt->get_result();

$clientes = [];
while ($linha = $resultado->fetch_assoc()) {
    $clientes[] = $linha;
}

$retorno["status"] = "ok";
$retorno["mensagem"] = "Clientes carregados com sucesso.";
$retorno["data"] = $clientes;

$stmt->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
