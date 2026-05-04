<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Usuario não autenticado",
    "data" => []
];

$usuario_id = $_SESSION['usuario_id'] ?? null;
$usuario_tipo = $_SESSION['usuario_tipo'] ?? null;

if (empty($usuario_id)) {
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($usuario_tipo !== 'admin') {
    $retorno["mensagem"] = "Perfil sem permissão para acessar esta área.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$stmt = $conexao->prepare(
    "SELECT id, nome, email, tipo, status_conta, criado_em 
     FROM usuarios 
     ORDER BY criado_em DESC"
);

if (!$stmt) {
    $retorno["mensagem"] = "Erro ao preparar consulta";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$stmt->execute();
$resultado = $stmt->get_result();

$usuarios = [];
while ($linha = $resultado->fetch_assoc()) {
    $usuarios[] = [
        "id" => intval($linha['id']),
        "nome" => $linha['nome'],
        "email" => $linha['email'],
        "tipo" => $linha['tipo'],
        "status_conta" => $linha['status_conta'],
        "criado_em" => $linha['criado_em']
    ];
}

$retorno["status"] = "ok";
$retorno["mensagem"] = "Usuários carregados com sucesso";
$retorno["data"] = $usuarios;

$stmt->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
