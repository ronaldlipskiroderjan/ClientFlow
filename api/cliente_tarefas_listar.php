<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Usuário não autenticado",
    "data" => []
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
    $retorno["mensagem"] = "Perfil sem permissão para acessar tarefas do cliente.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$checklist_id = isset($_GET['checklist_id']) ? intval($_GET['checklist_id']) : 0;

$filtro_checklist = "";
if ($checklist_id > 0) {
    $filtro_checklist = " AND c.id = ? ";
}

$stmt_tarefas = $conexao->prepare(
    "SELECT
        i.id,
        i.checklist_id,
        i.nome_item,
        i.descricao_item,
        i.formato_esperado,
        i.min_chars,
        i.max_chars,
        i.allowed_extensions,
        i.max_file_size_kb,
        i.min_width,
        i.max_width,
        i.min_height,
        i.max_height,
        i.status,
        i.resposta_texto,
        i.arquivo_path,
        i.motivo_rejeicao,
        c.titulo AS checklist_nome
     FROM itens_checklist i
     INNER JOIN checklists c ON c.id = i.checklist_id
     INNER JOIN clientes cl ON cl.id = c.cliente_id
     WHERE (cl.usuario_id = ? OR cl.email = ?) $filtro_checklist
     ORDER BY i.id ASC"
);

if ($checklist_id > 0) {
    $stmt_tarefas->bind_param("isi", $usuario_id, $usuario_email, $checklist_id);
} else {
    $stmt_tarefas->bind_param("is", $usuario_id, $usuario_email);
}

$stmt_tarefas->execute();
$res_tarefas = $stmt_tarefas->get_result();

$tarefas = [];
while ($linha = $res_tarefas->fetch_assoc()) {
    $valor = $linha['resposta_texto'];
    if (empty($valor) && !empty($linha['arquivo_path'])) {
        $valor = $linha['arquivo_path'];
    }

    $tarefas[] = [
        "id" => intval($linha['id']),
        "checklist_id" => intval($linha['checklist_id']),
        "title" => $linha['nome_item'],
        "description" => $linha['descricao_item'],
        "type" => $linha['formato_esperado'] ?: "text",
        "min_chars" => $linha['min_chars'] !== null ? intval($linha['min_chars']) : null,
        "max_chars" => $linha['max_chars'] !== null ? intval($linha['max_chars']) : null,
        "allowed_extensions" => $linha['allowed_extensions'],
        "max_file_size_kb" => $linha['max_file_size_kb'] !== null ? intval($linha['max_file_size_kb']) : null,
        "min_width" => $linha['min_width'] !== null ? intval($linha['min_width']) : null,
        "max_width" => $linha['max_width'] !== null ? intval($linha['max_width']) : null,
        "min_height" => $linha['min_height'] !== null ? intval($linha['min_height']) : null,
        "max_height" => $linha['max_height'] !== null ? intval($linha['max_height']) : null,
        "status" => $linha['status'] ?: "pending",
        "value" => $valor,
        "feedback" => $linha['motivo_rejeicao'],
        "checklist_name" => $linha['checklist_nome']
    ];
}

$retorno["status"] = "ok";
$retorno["mensagem"] = "Tarefas carregadas com sucesso.";
$retorno["data"] = $tarefas;

$stmt_tarefas->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
