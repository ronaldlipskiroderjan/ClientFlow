<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Usuário não autenticado",
    "data" => null
];

$agencia_usuario_id = $_SESSION['usuario_id'] ?? null;
$usuario_tipo = $_SESSION['usuario_tipo'] ?? null;

if (empty($agencia_usuario_id)) {
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($usuario_tipo === "client") {
    $retorno["mensagem"] = "Perfil sem permissão para criar formulário.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$titulo = trim($_POST['titulo'] ?? '');
$descricao = trim($_POST['descricao'] ?? '');
$itens_json = $_POST['itens'] ?? '[]';
$itens = json_decode($itens_json, true);

if (empty($titulo)) {
    $retorno["mensagem"] = "Informe o título do projeto.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if (!is_array($itens) || count($itens) === 0) {
    $retorno["mensagem"] = "Adicione pelo menos um item no formulário.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$link_hash = bin2hex(random_bytes(16));

$conexao->begin_transaction();

try {
    $stmt_checklist = $conexao->prepare(
        "INSERT INTO checklists (agencia_usuario_id, titulo, descricao, link_hash, status)
         VALUES (?, ?, ?, ?, 'Aberto')"
    );
    $stmt_checklist->bind_param("isss", $agencia_usuario_id, $titulo, $descricao, $link_hash);
    $stmt_checklist->execute();
    $checklist_id = $conexao->insert_id;
    $stmt_checklist->close();

    $stmt_item = $conexao->prepare(
        "INSERT INTO itens_checklist (checklist_id, nome_item, descricao_item, formato_esperado, status)
         VALUES (?, ?, ?, ?, 'pending')"
    );

    foreach ($itens as $item) {
        $nome_item = trim($item['nome'] ?? '');
        $descricao_item = trim($item['descricao'] ?? '');
        $formato = trim($item['tipo'] ?? 'text');

        if ($nome_item === '') {
            continue;
        }

        $stmt_item->bind_param("isss", $checklist_id, $nome_item, $descricao_item, $formato);
        $stmt_item->execute();
    }

    $stmt_item->close();
    $conexao->commit();

    $retorno["status"] = "ok";
    $retorno["mensagem"] = "Formulário criado com sucesso.";
    $retorno["data"] = [
        "checklist_id" => $checklist_id,
        "link_hash" => $link_hash
    ];
} catch (Exception $e) {
    $conexao->rollback();
    $retorno["mensagem"] = "Erro ao criar formulário.";
}

$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
