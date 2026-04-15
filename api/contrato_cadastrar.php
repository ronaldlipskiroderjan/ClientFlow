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

if (empty($permissoes['perm_financeiro'])) {
    $retorno["mensagem"] = "Você não tem permissão para acessar o financeiro/contratos.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$cliente_id = intval($_POST['cliente_id'] ?? 0);
$checklist_id = intval($_POST['checklist_id'] ?? 0); // Opcional
$titulo = trim($_POST['titulo'] ?? '');
$descricao_servico = trim($_POST['descricao_servico'] ?? '');
$valor_total = floatval(str_replace(['.', ','], ['', '.'], $_POST['valor_total'] ?? '0'));
$qtd_parcelas = intval($_POST['qtd_parcelas'] ?? 1);
$data_inicio = trim($_POST['data_inicio'] ?? '');
$data_prazo = trim($_POST['data_prazo'] ?? '');
$data_vencimento_pagamento = trim($_POST['data_vencimento_pagamento'] ?? '');
$forma_pagamento = trim($_POST['forma_pagamento'] ?? '');
$status_pagamento = trim($_POST['status_pagamento'] ?? 'pendente');
$status_projeto = trim($_POST['status_projeto'] ?? 'em_andamento');
$observacoes = trim($_POST['observacoes'] ?? '');

if (empty($cliente_id) || empty($titulo) || empty($valor_total) || empty($data_inicio) || empty($data_prazo) || empty($data_vencimento_pagamento)) {
    $retorno["mensagem"] = "Preencha todos os campos obrigatórios.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

// Em vez de normalizar manualmente as datas que vêm do HTML5 (YYYY-MM-DD), apenas validamos o formato.
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data_inicio) ||
    !preg_match('/^\d{4}-\d{2}-\d{2}$/', $data_prazo) ||
    !preg_match('/^\d{4}-\d{2}-\d{2}$/', $data_vencimento_pagamento)) {
    $retorno["mensagem"] = "Formato de data inválido.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

// Validar se o cliente pertence à agencia
$stmt_cli = $conexao->prepare("SELECT id FROM clientes WHERE id = ? AND agencia_id = ?");
$stmt_cli->bind_param("ii", $cliente_id, $agencia_id);
$stmt_cli->execute();
if ($stmt_cli->get_result()->num_rows !== 1) {
    $retorno["mensagem"] = "Cliente inválido ou não pertence a esta agência.";
    $stmt_cli->close();
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}
$stmt_cli->close();

if ($checklist_id > 0) {
    // Validar se o checklist pertence à agencia
    $stmt_chk = $conexao->prepare("SELECT id FROM checklists WHERE id = ? AND agencia_id = ?");
    $stmt_chk->bind_param("ii", $checklist_id, $agencia_id);
    $stmt_chk->execute();
    if ($stmt_chk->get_result()->num_rows !== 1) {
        $retorno["mensagem"] = "Projeto (checklist) inválido.";
        $stmt_chk->close();
        header("Content-type: application/json;charset:utf-8");
        echo json_encode($retorno);
        exit();
    }
    $stmt_chk->close();
} else {
    $checklist_id = null;
}

$stmt = $conexao->prepare(
    "INSERT INTO contratos (
        agencia_id, cliente_id, checklist_id, titulo, descricao_servico,
        valor_total, qtd_parcelas, data_inicio, data_prazo, data_vencimento_pagamento,
        forma_pagamento, status_pagamento, status_projeto, observacoes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
);

$stmt->bind_param(
    "iiissdisssssss",
    $agencia_id, $cliente_id, $checklist_id, $titulo, $descricao_servico,
    $valor_total, $qtd_parcelas, $data_inicio, $data_prazo, $data_vencimento_pagamento,
    $forma_pagamento, $status_pagamento, $status_projeto, $observacoes
);

if ($stmt->execute()) {
    $retorno["status"] = "ok";
    $retorno["mensagem"] = "Contrato cadastrado com sucesso.";
    $retorno["data"] = ["id" => $conexao->insert_id];
} else {
    $retorno["mensagem"] = "Erro ao cadastrar contrato: " . $stmt->error;
}

$stmt->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
