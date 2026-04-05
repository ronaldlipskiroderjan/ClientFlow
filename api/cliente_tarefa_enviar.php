<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Usuário não autenticado",
    "data" => null
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
    $retorno["mensagem"] = "Perfil sem permissão para enviar tarefas.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$item_id = intval($_POST['item_id'] ?? 0);
$valor = trim($_POST['valor'] ?? '');
$tipo_envio = trim($_POST['tipo_envio'] ?? 'texto');

if ($item_id <= 0 || empty($valor)) {
    $retorno["mensagem"] = "Item e valor são obrigatórios.";
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
    $retorno["mensagem"] = "Cliente não encontrado.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    $stmt_cliente->close();
    $conexao->close();
    exit();
}

$cliente = $res_cliente->fetch_assoc();
$cliente_id = intval($cliente['id']);
$stmt_cliente->close();

$stmt_check_item = $conexao->prepare(
    "SELECT i.id
     FROM itens_checklist i
     INNER JOIN checklists c ON c.id = i.checklist_id
     WHERE i.id = ? AND c.cliente_id = ?"
);
$stmt_check_item->bind_param("ii", $item_id, $cliente_id);
$stmt_check_item->execute();
$res_check_item = $stmt_check_item->get_result();

if ($res_check_item->num_rows !== 1) {
    $retorno["mensagem"] = "Item não pertence ao cliente autenticado.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    $stmt_check_item->close();
    $conexao->close();
    exit();
}

$stmt_check_item->close();

$arquivo_path = null;
$resposta_texto = $valor;

if ($tipo_envio === 'arquivo') {
    $arquivo_path = $valor;
    $resposta_texto = null;
}

$stmt_update = $conexao->prepare(
    "UPDATE itens_checklist
     SET status = 'review', resposta_texto = ?, arquivo_path = ?, motivo_rejeicao = NULL
     WHERE id = ?"
);
$stmt_update->bind_param("ssi", $resposta_texto, $arquivo_path, $item_id);

if ($stmt_update->execute()) {
    $retorno["status"] = "ok";
    $retorno["mensagem"] = "Item enviado com sucesso.";
    $retorno["data"] = ["item_id" => $item_id, "status" => "review"];
} else {
    $retorno["mensagem"] = "Erro ao enviar item.";
}

$stmt_update->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
