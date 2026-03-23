<?php

session_start();

$page = isset($_GET['page']) ? $_GET['page'] : 'login';

switch ($page) {
    case 'login':
        $arquivo = 'pages/login.php';
        break;

    case 'dashboard':
        $arquivo = 'pages/dashboard.php';
        break;

    case 'novo_checklist':
        $arquivo = 'pages/novo_checklist.php';
        break;

    case 'area_cliente':
        $arquivo = 'pages/area_cliente.php';
        break;

    case 'avaliar_checklist':
        $arquivo = 'pages/avaliar_checklist.php';
        break;

    default:
        $arquivo = 'pages/404.php';
}

if (file_exists($arquivo)){
    require_once $arquivo;
} else {
    require_once 'pages/404.php';
}
?>