<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Usuário não autenticado",
    "data" => []
];

$agencia_usuario_id = $_SESSION['usuario_id'] ?? null;
$usuario_tipo = $_SESSION['usuario_tipo'] ?? null;

if (empty($agencia_usuario_id)) {
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($usuario_tipo === "client") {
    $retorno["mensagem"] = "Perfil sem permissão para listar formulários.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$stmt = $conexao->prepare(
    "SELECT
        c.id,
        c.titulo,
        c.descricao,
        c.link_hash,
        c.status,
        c.criado_em,
        cl.nome AS cliente_nome,
        cl.email AS cliente_email,
        COUNT(i.id) AS total_itens
     FROM checklists c
     LEFT JOIN clientes cl ON cl.id = c.cliente_id
     LEFT JOIN itens_checklist i ON i.checklist_id = c.id
     WHERE c.agencia_usuario_id = ?
     GROUP BY c.id
     ORDER BY c.criado_em DESC"
);
$stmt->bind_param("i", $agencia_usuario_id);
$stmt->execute();
$resultado = $stmt->get_result();

$dados = [];
while ($linha = $resultado->fetch_assoc()) {
    $dados[] = $linha;
}

$retorno["status"] = "ok";
$retorno["mensagem"] = "Formulários carregados com sucesso.";
$retorno["data"] = $dados;

$stmt->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
