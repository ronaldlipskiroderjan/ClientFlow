<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Requisição inválida.",
    "data" => [],
    "kpis" => []
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

if (empty($permissoes['perm_financeiro'])) {
    $retorno["mensagem"] = "Você não tem permissão para acessar o financeiro/contratos.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$stmt = $conexao->prepare(
    "SELECT c.id, c.titulo, c.valor_total, c.qtd_parcelas, c.status_pagamento, c.status_projeto,
            c.data_prazo, c.data_vencimento_pagamento,
            cl.nome AS cliente_nome
     FROM contratos c
     JOIN clientes cl ON cl.id = c.cliente_id
     WHERE c.agencia_id = ?
     ORDER BY c.criado_em DESC"
);
$stmt->bind_param("i", $agencia_id);
$stmt->execute();
$resultado = $stmt->get_result();

$contratos = [];
$kpi_ativos = 0;
$kpi_valor_aberto = 0;
$kpi_inadimplentes = 0;
$kpi_concluidos = 0;

while ($linha = $resultado->fetch_assoc()) {
    $contratos[] = $linha;
    
    if ($linha['status_projeto'] !== 'cancelado') {
        $kpi_ativos++;
    }
    
    if ($linha['status_pagamento'] === 'pendente' || $linha['status_pagamento'] === 'atrasado') {
        $kpi_valor_aberto += floatval($linha['valor_total']);
    }
    
    if ($linha['status_pagamento'] === 'atrasado') {
        $kpi_inadimplentes++;
    }
    
    if ($linha['status_projeto'] === 'concluido') {
        $kpi_concluidos++;
    }
}

$retorno["status"] = "ok";
$retorno["mensagem"] = "Contratos carregados com sucesso.";
$retorno["data"] = $contratos;
$retorno["kpis"] = [
    "ativos" => $kpi_ativos,
    "valor_aberto" => $kpi_valor_aberto,
    "inadimplentes" => $kpi_inadimplentes,
    "concluidos" => $kpi_concluidos
];

$stmt->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
