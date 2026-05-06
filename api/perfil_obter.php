<?php
include_once("db_conexao.php");
session_start();

$retorno = ["status" => "nok", "mensagem" => "Usuário não autenticado", "data" => null];

$usuario_id = $_SESSION['usuario_id'] ?? null;
$tipo       = $_SESSION['usuario_tipo'] ?? null;
$agencia_id = $_SESSION['agencia_id'] ?? null;

if (empty($usuario_id)) {
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$stmt = $conexao->prepare(
    "SELECT id, nome, email, tipo, telefone, documento, data_nascimento, nome_empresa, nome_responsavel, foto_path, criado_em
     FROM usuarios WHERE id = ?"
);
$stmt->bind_param("i", $usuario_id);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows !== 1) {
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$usuario = $res->fetch_assoc();
$stmt->close();

$data = ["usuario" => $usuario, "agencia" => null, "papel" => null];

if (in_array($tipo, ['agency', 'agency_member'], true) && !empty($agencia_id)) {
    $stmt_ag = $conexao->prepare(
        "SELECT id, nome_empresa, cnpj, telefone, site, descricao,
                nome_contato_juridico, email_contato_juridico, telefone_contato_juridico
         FROM agencias WHERE id = ?"
    );
    $stmt_ag->bind_param("i", $agencia_id);
    $stmt_ag->execute();
    $res_ag = $stmt_ag->get_result();
    if ($res_ag->num_rows === 1) {
        $data["agencia"] = $res_ag->fetch_assoc();
    }
    $stmt_ag->close();
    $data["papel"] = $_SESSION['papel_agencia'] ?? null;
}

$retorno["status"]   = "ok";
$retorno["mensagem"] = "Perfil obtido com sucesso.";
$retorno["data"]     = $data;

$conexao->close();
header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
