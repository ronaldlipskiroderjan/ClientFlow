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
$checklist_id = intval($_GET['checklist_id'] ?? 0);

if (empty($usuario_id)) {
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($usuario_tipo === "client") {
    $retorno["mensagem"] = "Perfil sem permissão para revisar itens.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if (($usuario_tipo === 'agency' || $usuario_tipo === 'agency_member') && empty($permissoes['perm_ver_projetos'])) {
    $retorno["mensagem"] = "Você não tem permissão para visualizar itens.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($checklist_id <= 0) {
    $retorno["mensagem"] = "Checklist inválido.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$sql_base = "SELECT
        i.id,
        i.nome_item,
        i.descricao_item,
        i.formato_esperado,
        i.min_chars,
        i.max_chars,
        i.allowed_extensions,
        i.max_file_size_kb,
        i.min_width,
        i.max_width,
        i.min_height,
        i.max_height,
        i.status,
        i.resposta_texto,
        i.arquivo_path,
        i.motivo_rejeicao,
        c.id AS checklist_id,
        c.titulo AS checklist_titulo,
        cl.nome AS cliente_nome,
        cl.email AS cliente_email
     FROM itens_checklist i
     INNER JOIN checklists c ON c.id = i.checklist_id
     LEFT JOIN clientes cl ON cl.id = c.cliente_id";

if ($usuario_tipo === 'agency_member' && $papel_agencia === 'dev') {
    $sql_base .= " INNER JOIN projetos_membros pm ON pm.checklist_id = c.id
    WHERE i.checklist_id = ? AND c.agencia_id = ? AND pm.usuario_agencia_id = ?
    ORDER BY i.id ASC";
    $stmt = $conexao->prepare($sql_base);
    $stmt->bind_param("iii", $checklist_id, $agencia_id, $ua_id);
} else {
    $sql_base .= " WHERE i.checklist_id = ? AND c.agencia_id = ?
    ORDER BY i.id ASC";
    $stmt = $conexao->prepare($sql_base);
    $stmt->bind_param("ii", $checklist_id, $agencia_id);
}
$stmt->execute();
$resultado = $stmt->get_result();

$itens = [];
while ($linha = $resultado->fetch_assoc()) {
    $itens[] = [
        "id" => intval($linha['id']),
        "checklist_id" => intval($linha['checklist_id']),
        "checklist_titulo" => $linha['checklist_titulo'],
        "cliente_nome" => $linha['cliente_nome'],
        "cliente_email" => $linha['cliente_email'],
        "nome_item" => $linha['nome_item'],
        "descricao_item" => $linha['descricao_item'],
        "formato_esperado" => $linha['formato_esperado'],
        "min_chars" => $linha['min_chars'] !== null ? intval($linha['min_chars']) : null,
        "max_chars" => $linha['max_chars'] !== null ? intval($linha['max_chars']) : null,
        "allowed_extensions" => $linha['allowed_extensions'],
        "max_file_size_kb" => $linha['max_file_size_kb'] !== null ? intval($linha['max_file_size_kb']) : null,
        "min_width" => $linha['min_width'] !== null ? intval($linha['min_width']) : null,
        "max_width" => $linha['max_width'] !== null ? intval($linha['max_width']) : null,
        "min_height" => $linha['min_height'] !== null ? intval($linha['min_height']) : null,
        "max_height" => $linha['max_height'] !== null ? intval($linha['max_height']) : null,
        "status" => $linha['status'],
        "resposta_texto" => $linha['resposta_texto'],
        "arquivo_path" => $linha['arquivo_path'],
        "motivo_rejeicao" => $linha['motivo_rejeicao']
    ];
}

$retorno["status"] = "ok";
$retorno["mensagem"] = "Itens carregados com sucesso.";
$retorno["data"] = $itens;

$stmt->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
