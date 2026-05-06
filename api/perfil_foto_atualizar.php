<?php
include_once("db_conexao.php");
session_start();

$retorno = ["status" => "nok", "mensagem" => "Usuário não autenticado", "data" => null];

$usuario_id = $_SESSION['usuario_id'] ?? null;

if (empty($usuario_id)) {
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if (!isset($_FILES['foto']) || $_FILES['foto']['error'] !== UPLOAD_ERR_OK) {
    $retorno["mensagem"] = "Nenhuma foto enviada ou erro no upload.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$upload   = $_FILES['foto'];
$tmp_name = $upload['tmp_name'];
$size     = intval($upload['size']);
$ext      = strtolower(pathinfo($upload['name'], PATHINFO_EXTENSION));

$allowed_exts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
if (!in_array($ext, $allowed_exts, true)) {
    $retorno["mensagem"] = "Formato inválido. Use JPG, PNG, WEBP ou GIF.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

// Limite 5 MB
if ($size > 5 * 1024 * 1024) {
    $retorno["mensagem"] = "A foto deve ter no máximo 5 MB.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

// Valida que é realmente uma imagem
$image_info = @getimagesize($tmp_name);
if ($image_info === false) {
    $retorno["mensagem"] = "O arquivo enviado não é uma imagem válida.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$base_dir   = realpath(__DIR__ . '/../') . '/uploads/avatars';
if (!is_dir($base_dir)) {
    mkdir($base_dir, 0775, true);
}
chmod($base_dir, 0775);

// Remove foto antiga do disco, se existir
$stmt_old = $conexao->prepare("SELECT foto_path FROM usuarios WHERE id = ?");
$stmt_old->bind_param("i", $usuario_id);
$stmt_old->execute();
$res_old = $stmt_old->get_result();
if ($res_old->num_rows === 1) {
    $old = $res_old->fetch_assoc();
    if (!empty($old['foto_path'])) {
        $old_full = realpath(__DIR__ . '/../') . '/' . $old['foto_path'];
        if (is_file($old_full)) {
            @unlink($old_full);
        }
    }
}
$stmt_old->close();

$file_name  = 'avatar_' . $usuario_id . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
$final_path = $base_dir . '/' . $file_name;

if (!move_uploaded_file($tmp_name, $final_path)) {
    $retorno["mensagem"] = "Erro ao salvar a foto no servidor.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$db_path = 'uploads/avatars/' . $file_name;

$stmt = $conexao->prepare("UPDATE usuarios SET foto_path = ? WHERE id = ?");
$stmt->bind_param("si", $db_path, $usuario_id);

if ($stmt->execute()) {
    $retorno["status"]   = "ok";
    $retorno["mensagem"] = "Foto atualizada com sucesso!";
    $retorno["data"]     = ["foto_url" => "../../" . $db_path];
} else {
    // Remove arquivo salvo se o banco falhou
    @unlink($final_path);
    $retorno["mensagem"] = "Erro ao atualizar foto no banco de dados.";
}

$stmt->close();
$conexao->close();
header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
