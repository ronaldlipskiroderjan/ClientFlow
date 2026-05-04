<?php
require 'api/db_conexao.php';
$_POST['email'] = 'admin@clientflow.com';
$_POST['senha'] = '12345678';
ob_start();
include 'api/usuario_login.php';
$output = ob_get_clean();
echo $output;
