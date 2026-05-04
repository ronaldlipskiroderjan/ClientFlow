<?php
session_start();

session_unset();
session_destroy();

$retorno = [
    "status" => "ok",
    "mensagem" => "Logoff efetuado com sucesso",
    "data" => null
];

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
