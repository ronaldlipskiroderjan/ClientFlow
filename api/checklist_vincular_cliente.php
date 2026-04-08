<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Usuário não autenticado",
    "data" => null
];

$usuario_id = $_SESSION['usuario_id'] ?? null;
$usuario_tipo = $_SESSION['usuario_tipo'] ?? null;
$email = $_SESSION['usuario_email'] ?? null;
$nome = $_SESSION['usuario_nome'] ?? null;
$token = trim($_POST['token'] ?? '');

if (empty($usuario_id)) {
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($usuario_tipo !== "client") {
    $retorno["mensagem"] = "Apenas cliente pode vincular formulário pelo link.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if (empty($token)) {
    $retorno["mensagem"] = "Token do formulário é obrigatório.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$conexao->begin_transaction();

try {
    $stmt_form = $conexao->prepare(
        "SELECT id, cliente_id, agencia_usuario_id
         FROM checklists
         WHERE link_hash = ?
         LIMIT 1"
    );
    $stmt_form->bind_param("s", $token);
    $stmt_form->execute();
    $res_form = $stmt_form->get_result();

    if ($res_form->num_rows !== 1) {
        throw new Exception("Link de formulário inválido.");
    }

    $formulario = $res_form->fetch_assoc();
    $checklist_id = intval($formulario['id']);
    $cliente_atual = intval($formulario['cliente_id'] ?? 0);
    $agencia_usuario_id = intval($formulario['agencia_usuario_id']);
    $stmt_form->close();

    $stmt_cliente = $conexao->prepare(
        "SELECT id FROM clientes WHERE usuario_id = ? LIMIT 1"
    );
    $stmt_cliente->bind_param("i", $usuario_id);
    $stmt_cliente->execute();
    $res_cliente = $stmt_cliente->get_result();

    if ($res_cliente->num_rows === 1) {
        $cliente = $res_cliente->fetch_assoc();
        $cliente_id = intval($cliente['id']);
    } else {
        $stmt_usuario = $conexao->prepare("SELECT senha_hash FROM usuarios WHERE id = ? LIMIT 1");
        $stmt_usuario->bind_param("i", $usuario_id);
        $stmt_usuario->execute();
        $res_usuario = $stmt_usuario->get_result();
        $senha_hash = "";
        if ($res_usuario->num_rows === 1) {
            $usuario = $res_usuario->fetch_assoc();
            $senha_hash = $usuario['senha_hash'] ?? "";
        }
        $stmt_usuario->close();

        $empresa = "";
        $stmt_insert_cliente = $conexao->prepare(
            "INSERT INTO clientes (agencia_usuario_id, usuario_id, nome, email, senha, empresa)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt_insert_cliente->bind_param(
            "iissss",
            $agencia_usuario_id,
            $usuario_id,
            $nome,
            $email,
            $senha_hash,
            $empresa
        );
        $stmt_insert_cliente->execute();
        $cliente_id = $conexao->insert_id;
        $stmt_insert_cliente->close();
    }

    $stmt_cliente->close();

    if ($cliente_atual > 0 && $cliente_atual !== $cliente_id) {
        throw new Exception("Este formulário já está vinculado a outro cliente.");
    }

    $stmt_vincular = $conexao->prepare(
        "UPDATE checklists SET cliente_id = ? WHERE id = ?"
    );
    $stmt_vincular->bind_param("ii", $cliente_id, $checklist_id);
    $stmt_vincular->execute();
    $stmt_vincular->close();

    $conexao->commit();

    $retorno["status"] = "ok";
    $retorno["mensagem"] = "Formulário vinculado ao cliente com sucesso.";
    $retorno["data"] = [
        "checklist_id" => $checklist_id,
        "cliente_id" => $cliente_id
    ];
} catch (Exception $e) {
    $conexao->rollback();
    $retorno["mensagem"] = $e->getMessage();
}

$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
