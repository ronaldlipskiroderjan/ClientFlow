<?php

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->nome) && !empty($data->email) && !empty($data->senha) && !empty($data->empresa)) {
    
    $check_query = "SELECT id FROM clientes WHERE email = :email";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(":email", $data->email);
    $check_stmt->execute();

    if ($check_stmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Este e-mail já está cadastrado."]);
        exit;
    }

    $query = "INSERT INTO clientes (nome, email, senha, empresa) VALUES (:nome, :email, :senha, :empresa)";
    $stmt = $db->prepare($query);

    // Hash da senha
    $senha_hash = password_hash($data->senha, PASSWORD_BCRYPT);

    $stmt->bindParam(":nome", $data->nome);
    $stmt->bindParam(":email", $data->email);
    $stmt->bindParam(":senha", $senha_hash);
    $stmt->bindParam(":empresa", $data->empresa);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(["status" => "success", "message" => "Conta de cliente criada com sucesso!"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Erro interno no servidor ao registrar cliente."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Preenchimento obrigatório de todos os campos."]);
}
?>