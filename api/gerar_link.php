<?php
include_once("db_conexao.php");
session_start();

header('Content-Type: application/json');

$retorno = [
    "status" => "nok",
    "mensagem" => "Erro ao gerar link"
];


$input = json_decode(file_get_contents("php://input"), true);
$id = $input["id"] ?? null;

if (empty($id)) {
    $retorno["mensagem"] = "ID não informado";
    echo json_encode($retorno);
    exit();
}

$token = bin2hex(random_bytes(16));


$stmt = $conexao->prepare("UPDATE checklists SET link_hash = ? WHERE id = ?");
$stmt->bind_param("si", $token, $id);

if ($stmt->execute()) {
    $retorno["status"] = "ok";
    $retorno["mensagem"] = "Link gerado com sucesso";
    $retorno["link_hash"] = $token;
}

$stmt->close();
$conexao->close();

echo json_encode($retorno);
?>