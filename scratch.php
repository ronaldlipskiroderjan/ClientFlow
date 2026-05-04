<?php
require 'api/db_conexao.php';
$res = $conexao->query("SELECT tipo FROM usuarios WHERE email='admin@clientflow.com'");
var_dump($res->fetch_assoc());
