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
        "SELECT u.id, u.nome, u.email, u.tipo, u.telefone, u.documento, u.data_nascimento, u.nome_empresa, u.nome_responsavel, u.foto_path, u.status_conta, u.desativacao_solicitada_em, u.desativacao_aceita_em, u.criado_em, u.plano_id, p.nome_plano
         FROM usuarios u
         LEFT JOIN planos p ON u.plano_id = p.id
         WHERE u.id = ?"
    );
    $stmt->bind_param("i", $usuario_id);
    $stmt->execute();
    $resultado = $stmt->get_result();

    if ($resultado->num_rows === 1) {
        $usuario = $resultado->fetch_assoc();

        if ($usuario['status_conta'] === 'banido') {
            session_destroy();
            $retorno["mensagem"] = "Sua conta foi banida da plataforma. Acesso revogado.";
            header("Content-type: application/json;charset:utf-8");
            echo json_encode($retorno);
            exit();
        }

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
