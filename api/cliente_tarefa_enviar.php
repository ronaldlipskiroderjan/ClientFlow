<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Usuário não autenticado",
    "data" => null
];

$usuario_id = $_SESSION['usuario_id'] ?? null;
$usuario_email = $_SESSION['usuario_email'] ?? null;
$usuario_tipo = $_SESSION['usuario_tipo'] ?? null;

if (empty($usuario_id)) {
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($usuario_tipo !== "client") {
    $retorno["mensagem"] = "Perfil sem permissão para enviar tarefas.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$item_id = intval($_POST['item_id'] ?? 0);
$valor = trim($_POST['valor'] ?? '');

if ($item_id <= 0) {
    $retorno["mensagem"] = "Item é obrigatório.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

function fail_json($mensagem) {
    echo json_encode([
        "status" => "nok",
        "mensagem" => $mensagem,
        "data" => null
    ]);
    exit();
}

function normalize_extensions($value) {
    $parts = explode(',', strtolower((string)$value));
    $normalized = [];

    foreach ($parts as $part) {
        $clean = preg_replace('/[^a-z0-9]/', '', trim($part));
        if ($clean !== '' && !in_array($clean, $normalized, true)) {
            $normalized[] = $clean;
        }
    }

    return $normalized;
}

function default_extensions_for_type($tipo) {
    if ($tipo === 'image') {
        return [
            'png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tif', 'tiff', 'svg', 'avif', 'heic', 'heif'
        ];
    }

    return [
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'zip', 'rar', '7z',
        'png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'
    ];
}

function ensure_dir($path) {
    if (!is_dir($path)) {
        mkdir($path, 0775, true);
    }
}

$stmt_cliente = $conexao->prepare(
    "SELECT id FROM clientes WHERE usuario_id = ? OR email = ? LIMIT 1"
);
$stmt_cliente->bind_param("is", $usuario_id, $usuario_email);
$stmt_cliente->execute();
$res_cliente = $stmt_cliente->get_result();

if ($res_cliente->num_rows !== 1) {
    $retorno["mensagem"] = "Cliente não encontrado.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    $stmt_cliente->close();
    $conexao->close();
    exit();
}

$cliente = $res_cliente->fetch_assoc();
$cliente_id = intval($cliente['id']);
$stmt_cliente->close();

$stmt_check_item = $conexao->prepare(
    "SELECT
        i.id,
        i.checklist_id,
        i.formato_esperado,
        i.status,
        i.min_chars,
        i.max_chars,
        i.allowed_extensions,
        i.max_file_size_kb,
        i.min_width,
        i.max_width,
        i.min_height,
        i.max_height
     FROM itens_checklist i
     INNER JOIN checklists c ON c.id = i.checklist_id
     WHERE i.id = ? AND c.cliente_id = ?"
);
$stmt_check_item->bind_param("ii", $item_id, $cliente_id);
$stmt_check_item->execute();
$res_check_item = $stmt_check_item->get_result();

if ($res_check_item->num_rows !== 1) {
    $retorno["mensagem"] = "Item não pertence ao cliente autenticado.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    $stmt_check_item->close();
    $conexao->close();
    exit();
}

$item = $res_check_item->fetch_assoc();

if ($item['status'] === 'approved' || $item['status'] === 'review') {
    $stmt_check_item->close();
    $conexao->close();
    header("Content-type: application/json;charset:utf-8");
    fail_json("Este item está bloqueado no momento.");
}

$stmt_check_item->close();

$tipo_item = $item['formato_esperado'] ?: 'text';
$checklist_id = intval($item['checklist_id']);
$min_chars = $item['min_chars'] !== null ? intval($item['min_chars']) : null;
$max_chars = $item['max_chars'] !== null ? intval($item['max_chars']) : null;
$max_file_size_kb = $item['max_file_size_kb'] !== null ? intval($item['max_file_size_kb']) : null;
$min_width = $item['min_width'] !== null ? intval($item['min_width']) : null;
$max_width = $item['max_width'] !== null ? intval($item['max_width']) : null;
$min_height = $item['min_height'] !== null ? intval($item['min_height']) : null;
$max_height = $item['max_height'] !== null ? intval($item['max_height']) : null;

$allowed_extensions = normalize_extensions($item['allowed_extensions'] ?? '');
if (!count($allowed_extensions)) {
    $allowed_extensions = default_extensions_for_type($tipo_item);
}

$base_dir = realpath(__DIR__ . '/../');
$client_dir = $base_dir . '/uploads/clientes/cliente_' . $cliente_id . '/checklist_' . $checklist_id . '/item_' . $item_id;
ensure_dir($client_dir);

$arquivo_path = null;
$resposta_texto = null;

if ($tipo_item === 'file' || $tipo_item === 'image') {
    if (!isset($_FILES['arquivo']) || !is_array($_FILES['arquivo']) || $_FILES['arquivo']['error'] !== UPLOAD_ERR_OK) {
        $conexao->close();
        header("Content-type: application/json;charset:utf-8");
        fail_json("Envie um arquivo válido para este item.");
    }

    $upload = $_FILES['arquivo'];
    $nome_original = $upload['name'] ?? '';
    $tmp_name = $upload['tmp_name'] ?? '';
    $size = intval($upload['size'] ?? 0);
    $ext = strtolower(pathinfo($nome_original, PATHINFO_EXTENSION));

    if ($ext === '' || !in_array($ext, $allowed_extensions, true)) {
        $conexao->close();
        header("Content-type: application/json;charset:utf-8");
        fail_json("Formato de arquivo não permitido para este item.");
    }

    if ($max_file_size_kb !== null && $size > ($max_file_size_kb * 1024)) {
        $conexao->close();
        header("Content-type: application/json;charset:utf-8");
        fail_json("Arquivo excede o limite de tamanho definido pela agência.");
    }

    if ($tipo_item === 'image') {
        $image_size = @getimagesize($tmp_name);
        if ($image_size === false) {
            $conexao->close();
            header("Content-type: application/json;charset:utf-8");
            fail_json("Arquivo enviado não é uma imagem válida.");
        }

        $width = intval($image_size[0]);
        $height = intval($image_size[1]);

        if ($min_width !== null && $width < $min_width) {
            $conexao->close();
            header("Content-type: application/json;charset:utf-8");
            fail_json("A largura da imagem é menor que o mínimo permitido.");
        }

        if ($max_width !== null && $width > $max_width) {
            $conexao->close();
            header("Content-type: application/json;charset:utf-8");
            fail_json("A largura da imagem é maior que o máximo permitido.");
        }

        if ($min_height !== null && $height < $min_height) {
            $conexao->close();
            header("Content-type: application/json;charset:utf-8");
            fail_json("A altura da imagem é menor que o mínimo permitido.");
        }

        if ($max_height !== null && $height > $max_height) {
            $conexao->close();
            header("Content-type: application/json;charset:utf-8");
            fail_json("A altura da imagem é maior que o máximo permitido.");
        }
    }

    $safe_name = preg_replace('/[^a-zA-Z0-9_\.-]/', '_', basename($nome_original));
    $final_name = date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '_' . $safe_name;
    $final_path = $client_dir . '/' . $final_name;

    if (!move_uploaded_file($tmp_name, $final_path)) {
        $conexao->close();
        header("Content-type: application/json;charset:utf-8");
        fail_json("Não foi possível salvar o arquivo no servidor.");
    }

    $arquivo_path = 'uploads/clientes/cliente_' . $cliente_id . '/checklist_' . $checklist_id . '/item_' . $item_id . '/' . $final_name;
    $resposta_texto = null;
} else {
    if ($valor === '') {
        $conexao->close();
        header("Content-type: application/json;charset:utf-8");
        fail_json("Preencha o valor deste item antes de enviar.");
    }

    $length = mb_strlen($valor);
    if ($min_chars !== null && $length < $min_chars) {
        $conexao->close();
        header("Content-type: application/json;charset:utf-8");
        fail_json("Texto menor que o mínimo de caracteres permitido.");
    }

    if ($max_chars !== null && $length > $max_chars) {
        $conexao->close();
        header("Content-type: application/json;charset:utf-8");
        fail_json("Texto maior que o máximo de caracteres permitido.");
    }

    if ($tipo_item === 'url' && !filter_var($valor, FILTER_VALIDATE_URL)) {
        $conexao->close();
        header("Content-type: application/json;charset:utf-8");
        fail_json("URL inválida para este item.");
    }

    $resposta_texto = $valor;

    // Gera um histórico em arquivo por cliente/checklist/item mesmo para respostas textuais.
    $text_file = $client_dir . '/resposta_' . date('Ymd_His') . '.txt';
    file_put_contents($text_file, $valor);
}

$stmt_update = $conexao->prepare(
    "UPDATE itens_checklist
     SET status = 'review', resposta_texto = ?, arquivo_path = ?, motivo_rejeicao = NULL
     WHERE id = ?"
);
$stmt_update->bind_param("ssi", $resposta_texto, $arquivo_path, $item_id);

if ($stmt_update->execute()) {
    atualizar_status_checklist($conexao, $checklist_id);
    $retorno["status"] = "ok";
    $retorno["mensagem"] = "Item enviado com sucesso.";
    $retorno["data"] = ["item_id" => $item_id, "status" => "review"];
} else {
    $retorno["mensagem"] = "Erro ao enviar item.";
}

$stmt_update->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
