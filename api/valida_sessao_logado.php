<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Sessão inválida",
    "data" => null
];

$usuario_id = $_SESSION['usuario_id'] ?? null;

if (!empty($usuario_id)) {
    $stmt = $conexao->prepare(
        "SELECT id, nome, email, tipo, telefone, documento, data_nascimento, nome_empresa, nome_responsavel, foto_path, status_conta, desativacao_solicitada_em, desativacao_aceita_em, criado_em
         FROM usuarios
         WHERE id = ?"
    );
    $stmt->bind_param("i", $usuario_id);
    $stmt->execute();
    $resultado = $stmt->get_result();

    if ($resultado->num_rows === 1) {
        $usuario = $resultado->fetch_assoc();

        if ($usuario['status_conta'] === 'desativado') {
            $aceita_em = $usuario['desativacao_aceita_em'];
            $permanente = $aceita_em && (strtotime($aceita_em) + 180 * 86400) < time();
            $retorno["mensagem"] = $permanente
                ? "Sua conta foi desativada permanentemente."
                : "Sua conta está desativada. Entre em contato com o suporte para reativá-la.";
            header("Content-type: application/json;charset:utf-8");
            echo json_encode($retorno);
            exit();
        }

        if (isset($_SESSION['permissoes'])) {
            $usuario['permissoes'] = $_SESSION['permissoes'];
            $usuario['papel_agencia'] = $_SESSION['papel_agencia'] ?? null;
            $usuario['agencia_id'] = $_SESSION['agencia_id'] ?? null;
        }

        $retorno["status"] = "ok";
        $retorno["mensagem"] = "Sessão válida";
        $retorno["data"] = $usuario;
    }

    $stmt->close();
}

if (isset($conexao)) {
    $conexao->close();
}

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
