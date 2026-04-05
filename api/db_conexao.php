<?php

$servidor = "localhost:3306";
$usuario  = "root";
$senha    = "";
$nome_banco = "clientflow";

$conexao = new mysqli($servidor, $usuario, $senha, $nome_banco);

if ($conexao->connect_error) {
    die("Falha na conexão: " . $conexao->connect_error);
}

$conexao->set_charset("utf8mb4");
?>
