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
    $retorno["mensagem"] = "Perfil sem permissão para listar formulários.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if (($usuario_tipo === 'agency' || $usuario_tipo === 'agency_member') && empty($permissoes['perm_ver_projetos'])) {
    $retorno["mensagem"] = "Você não tem permissão para visualizar projetos.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$sql_base = "SELECT
                c.id, c.titulo, c.descricao, c.link_hash, c.status, c.criado_em,
                cl.nome AS cliente_nome, cl.email AS cliente_email,
                COUNT(i.id) AS total_itens
             FROM checklists c
             LEFT JOIN clientes cl ON cl.id = c.cliente_id
             LEFT JOIN itens_checklist i ON i.checklist_id = c.id
             ";

if ($usuario_tipo === 'freelancer') {
    // Para freelancer que ainda pode usar uma estrutura levemente diferente, assumimos que criam com cliente sem agencia
    // Ou que no modelo novo o FK pode aceitar null (se tratado assim), mas como a fk foi migrada, é preciso revisar
    // Mas no momento vamos buscar os checklists do freelancer
    $sql_base .= " WHERE c.agencia_id IS NULL AND c.cliente_id IN (SELECT id FROM clientes WHERE usuario_id = ?) ";
    $sql_base .= " GROUP BY c.id ORDER BY c.criado_em DESC";
    $stmt = $conexao->prepare($sql_base);
    $stmt->bind_param("i", $usuario_id);
} else {
    // Agency member
    if ($papel_agencia === 'dev') {
        $sql_base .= " INNER JOIN projetos_membros pm ON pm.checklist_id = c.id
                       WHERE c.agencia_id = ? AND pm.usuario_agencia_id = ? ";
        $sql_base .= " GROUP BY c.id ORDER BY c.criado_em DESC";
        $stmt = $conexao->prepare($sql_base);
        $stmt->bind_param("ii", $agencia_id, $ua_id);
    } else {
        $sql_base .= " WHERE c.agencia_id = ? ";
        $sql_base .= " GROUP BY c.id ORDER BY c.criado_em DESC";
        $stmt = $conexao->prepare($sql_base);
        $stmt->bind_param("i", $agencia_id);
    }
}

$stmt->execute();
$resultado = $stmt->get_result();

$dados = [];
while ($linha = $resultado->fetch_assoc()) {
    $dados[] = $linha;
}

$retorno["status"] = "ok";
$retorno["mensagem"] = "Formulários carregados com sucesso.";
$retorno["data"] = $dados;

$stmt->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
