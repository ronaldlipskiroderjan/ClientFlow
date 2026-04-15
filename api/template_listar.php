<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Usuário não autenticado",
    "data" => []
];

function responder_json($payload) {
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($payload);
    exit();
}

$usuario_id = $_SESSION['usuario_id'] ?? null;
$usuario_tipo = $_SESSION['usuario_tipo'] ?? null;
$agencia_id = $_SESSION['agencia_id'] ?? null;
$papel_agencia = $_SESSION['papel_agencia'] ?? null;
$permissoes = $_SESSION['permissoes'] ?? [];

if (empty($usuario_id)) {
    responder_json($retorno);
}

if ($usuario_tipo !== 'agency' && $usuario_tipo !== 'agency_member') {
    $retorno["mensagem"] = "Templates estão disponíveis apenas para usuários da agência.";
    responder_json($retorno);
}

if (empty($agencia_id)) {
    $retorno["mensagem"] = "Agência não identificada para o usuário logado.";
    responder_json($retorno);
}

if ($papel_agencia !== 'admin_agencia' && empty($permissoes['perm_criar_projetos'])) {
    $retorno["mensagem"] = "Você não tem permissão para visualizar templates.";
    responder_json($retorno);
}

$stmt = $conexao->prepare(
    "SELECT
        id,
        nome,
        descricao,
        JSON_LENGTH(itens) AS quantidade_itens,
        criado_em,
        atualizado_em
     FROM templates_checklist
     WHERE agencia_id = ?
     ORDER BY atualizado_em DESC, nome ASC"
);
if (!$stmt) {
    $retorno["mensagem"] = "Erro ao carregar templates.";
    responder_json($retorno);
}

$stmt->bind_param("i", $agencia_id);
if (!$stmt->execute()) {
    $stmt->close();
    $retorno["mensagem"] = "Erro ao carregar templates.";
    responder_json($retorno);
}
$resultado = $stmt->get_result();

$templates = [];
while ($linha = $resultado->fetch_assoc()) {
    $templates[] = [
        "id" => intval($linha['id']),
        "nome" => $linha['nome'],
        "descricao" => $linha['descricao'],
        "quantidade_itens" => intval($linha['quantidade_itens'] ?? 0),
        "criado_em" => $linha['criado_em'],
        "atualizado_em" => $linha['atualizado_em']
    ];
}

$stmt->close();
$conexao->close();

$retorno["status"] = "ok";
$retorno["mensagem"] = "Templates carregados com sucesso.";
$retorno["data"] = $templates;

responder_json($retorno);
?>
