<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Usuário não autenticado",
    "data" => []
];

$usuario_id = $_SESSION['usuario_id'] ?? null;
$usuario_email = $_SESSION['usuario_email'] ?? null;
$usuario_tipo = $_SESSION['usuario_tipo'] ?? null;

if (empty($usuario_id)) {
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($usuario_tipo !== "client") {
    $retorno["mensagem"] = "Perfil sem permissão para acessar tarefas do cliente.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$stmt_cliente = $conexao->prepare(
    "SELECT id FROM clientes WHERE usuario_id = ? OR email = ? LIMIT 1"
);
$stmt_cliente->bind_param("is", $usuario_id, $usuario_email);
$stmt_cliente->execute();
$res_cliente = $stmt_cliente->get_result();

if ($res_cliente->num_rows !== 1) {
    $retorno["status"] = "ok";
    $retorno["mensagem"] = "Nenhuma tarefa encontrada.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    $stmt_cliente->close();
    $conexao->close();
    exit();
}

$cliente = $res_cliente->fetch_assoc();
$cliente_id = intval($cliente['id']);
$stmt_cliente->close();

$stmt_tarefas = $conexao->prepare(
    "SELECT
        i.id,
        i.checklist_id,
        i.nome_item,
        i.formato_esperado,
        i.status,
        i.resposta_texto,
        i.arquivo_path,
        i.motivo_rejeicao,
        c.titulo AS checklist_nome
     FROM itens_checklist i
     INNER JOIN checklists c ON c.id = i.checklist_id
     WHERE c.cliente_id = ?
     ORDER BY i.id DESC"
);
$stmt_tarefas->bind_param("i", $cliente_id);
$stmt_tarefas->execute();
$res_tarefas = $stmt_tarefas->get_result();

$tarefas = [];
while ($linha = $res_tarefas->fetch_assoc()) {
    $valor = $linha['resposta_texto'];
    if (empty($valor) && !empty($linha['arquivo_path'])) {
        $valor = $linha['arquivo_path'];
    }

    $tarefas[] = [
        "id" => intval($linha['id']),
        "checklist_id" => intval($linha['checklist_id']),
        "title" => $linha['nome_item'],
        "type" => $linha['formato_esperado'] ?: "text",
        "status" => $linha['status'] ?: "pending",
        "value" => $valor,
        "feedback" => $linha['motivo_rejeicao'],
        "checklist_name" => $linha['checklist_nome']
    ];
}

$retorno["status"] = "ok";
$retorno["mensagem"] = "Tarefas carregadas com sucesso.";
$retorno["data"] = $tarefas;

$stmt_tarefas->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
