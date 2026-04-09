<?php
include_once("db_conexao.php");
session_start();

if (!isset($_SESSION['usuario_id']) || $_SESSION['usuario_tipo'] !== 'agency') {
    echo json_encode(["status" => "nok", "mensagem" => "Acesso negado."]);
    exit;
}

$agencia_id = $_SESSION['usuario_id'];
$titulo = trim($_POST['titulo'] ?? '');
$itens = json_decode($_POST['itens'] ?? '[]', true);

$conexao->begin_transaction();

try {
    $stmt = $conexao->prepare("INSERT INTO templates (agencia_usuario_id, titulo) VALUES (?, ?)");
    $stmt->bind_param("is", $agencia_id, $titulo);
    $stmt->execute();
    $template_id = $conexao->insert_id;

    $stmt_item = $conexao->prepare("INSERT INTO template_itens (template_id, nome_item, formato_esperado, max_chars, allowed_extensions, finalidade_lgpd) VALUES (?, ?, ?, ?, ?, ?)");

    foreach ($itens as $item) {
        $stmt_item->bind_param("ississ", 
            $template_id, 
            $item['nome'], 
            $item['tipo'], 
            $item['max_chars'], 
            $item['extensions'], 
            $item['finalidade_lgpd']
        );
        $stmt_item->execute();
    }

    $conexao->commit();
    echo json_encode(["status" => "ok", "mensagem" => "Template salvo!"]);
} catch (Exception $e) {
    $conexao->rollback();
    echo json_encode(["status" => "nok", "mensagem" => $e->getMessage()]);
}