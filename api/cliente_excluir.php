<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Usuário não autenticado",
    "data" => null
];

$agencia_usuario_id = $_SESSION['usuario_id'] ?? null;
$usuario_tipo = $_SESSION['usuario_tipo'] ?? null;
$cliente_id = intval($_POST['cliente_id'] ?? 0);

if (empty($agencia_usuario_id)) {
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($usuario_tipo === "client") {
    $retorno["mensagem"] = "Perfil sem permissão para excluir clientes.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($cliente_id <= 0) {
    $retorno["mensagem"] = "Cliente inválido.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$conexao->begin_transaction();

try {
    $stmt_busca = $conexao->prepare(
        "SELECT usuario_id FROM clientes WHERE id = ? AND agencia_usuario_id = ?"
    );
    $stmt_busca->bind_param("ii", $cliente_id, $agencia_usuario_id);
    $stmt_busca->execute();
    $res = $stmt_busca->get_result();

    if ($res->num_rows !== 1) {
        throw new Exception("Cliente não encontrado.");
    }

    $dados_cliente = $res->fetch_assoc();
    $usuario_id = intval($dados_cliente['usuario_id'] ?? 0);
    $stmt_busca->close();

    $stmt_delete_cliente = $conexao->prepare(
        "DELETE FROM clientes WHERE id = ? AND agencia_usuario_id = ?"
    );
    $stmt_delete_cliente->bind_param("ii", $cliente_id, $agencia_usuario_id);
    $stmt_delete_cliente->execute();
    $stmt_delete_cliente->close();

    if ($usuario_id > 0) {
        $stmt_delete_usuario = $conexao->prepare("DELETE FROM usuarios WHERE id = ? AND tipo = 'client'");
        $stmt_delete_usuario->bind_param("i", $usuario_id);
        $stmt_delete_usuario->execute();
        $stmt_delete_usuario->close();
    }

    $conexao->commit();

    $retorno["status"] = "ok";
    $retorno["mensagem"] = "Cliente excluído com sucesso.";
} catch (Exception $e) {
    $conexao->rollback();
    $retorno["mensagem"] = "Erro ao excluir cliente.";
}

$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
