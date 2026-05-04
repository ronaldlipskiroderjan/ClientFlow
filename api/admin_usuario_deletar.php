<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Usuario não autenticado"
];

$usuario_id = $_SESSION['usuario_id'] ?? null;
$usuario_tipo = $_SESSION['usuario_tipo'] ?? null;
$usuario_id_excluir = intval($_POST['usuario_id'] ?? 0);

if (empty($usuario_id)) {
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($usuario_tipo !== 'admin') {
    $retorno["mensagem"] = "Perfil sem permiss├úo para esta a├º├úo.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if (empty($usuario_id_excluir)) {
    $retorno["mensagem"] = "ID do usu├írio n├úo fornecido.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($usuario_id === $usuario_id_excluir) {
    $retorno["mensagem"] = "Voc├¬ n├úo pode deletar a sua pr├│pria conta.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$conexao->begin_transaction();

try {
    $stmt_usuario = $conexao->prepare("SELECT tipo FROM usuarios WHERE id = ?");
    $stmt_usuario->bind_param("i", $usuario_id_excluir);
    $stmt_usuario->execute();
    $resultado_usuario = $stmt_usuario->get_result();

    if ($resultado_usuario->num_rows === 0) {
        throw new Exception("Usuario não encontrado.");
    }

    $usuario = $resultado_usuario->fetch_assoc();
    $stmt_usuario->close();

    if ($usuario['tipo'] === 'admin') {
        throw new Exception("Não é possível deletar contas de administrador.");
    }

    $stmt_delete_clientes = $conexao->prepare(
        "DELETE FROM clientes WHERE usuario_id = ?"
    );
    $stmt_delete_clientes->bind_param("i", $usuario_id_excluir);
    if (!$stmt_delete_clientes->execute()) {
        throw new Exception("Erro ao deletar clientes associados");
    }
    $stmt_delete_clientes->close();

    $stmt_delete_ua = $conexao->prepare(
        "DELETE FROM usuarios_agencia WHERE usuario_id = ?"
    );
    $stmt_delete_ua->bind_param("i", $usuario_id_excluir);
    if (!$stmt_delete_ua->execute()) {
        throw new Exception("Erro ao deletar vinculos de agência");
    }
    $stmt_delete_ua->close();

    $stmt_delete = $conexao->prepare("DELETE FROM usuarios WHERE id = ?");
    $stmt_delete->bind_param("i", $usuario_id_excluir);
    if (!$stmt_delete->execute()) {
        throw new Exception("Erro ao deletar usu├írio");
    }
    $stmt_delete->close();

    $conexao->commit();

    $retorno["status"] = "ok";
    $retorno["mensagem"] = "Usuario deletado com sucesso.";

} catch (Exception $e) {
    $conexao->rollback();
    $retorno["mensagem"] = $e->getMessage();
}

$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
