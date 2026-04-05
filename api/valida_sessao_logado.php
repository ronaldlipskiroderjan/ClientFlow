<?php
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Sessão inválida",
    "data" => null
];

if (isset($_SESSION['usuario_id'])) {
    $retorno["status"] = "ok";
    $retorno["mensagem"] = "Sessão válida";
    $retorno["data"] = [
        "id" => $_SESSION['usuario_id'],
        "nome" => $_SESSION['usuario_nome'] ?? null,
        "email" => $_SESSION['usuario_email'] ?? null,
        "tipo" => $_SESSION['usuario_tipo'] ?? null
    ];
}

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
