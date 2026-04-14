<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Usuário não autenticado",
    "data" => []
];

$usuario_id = $_SESSION['usuario_id'] ?? null;
$usuario_tipo = $_SESSION['usuario_tipo'] ?? null;
$usuario_email = $_SESSION['usuario_email'] ?? null;

if (empty($usuario_id)) {
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($usuario_tipo !== "client") {
    $retorno["mensagem"] = "Perfil sem permissão para listar checklists do cliente.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

// Join clientes to match ALL client profiles tied to this user account
$stmt = $conexao->prepare(
    "SELECT
        c.id,
        c.titulo,
        c.descricao,
        c.status,
        c.criado_em,
        ag.nome AS agencia_nome_contato,
        ag.nome_empresa AS agencia_empresa,
        COUNT(i.id) AS total_itens,
        SUM(CASE WHEN i.status IN ('review', 'approved') THEN 1 ELSE 0 END) AS itens_concluidos
     FROM checklists c
     INNER JOIN clientes cl ON cl.id = c.cliente_id
     LEFT JOIN usuarios ag ON ag.id = c.agencia_usuario_id
     LEFT JOIN itens_checklist i ON i.checklist_id = c.id
     WHERE (cl.usuario_id = ? OR cl.email = ?)
     GROUP BY c.id
     ORDER BY c.criado_em DESC"
);
$stmt->bind_param("is", $usuario_id, $usuario_email);
$stmt->execute();
$resultado = $stmt->get_result();

$dados = [];
while ($linha = $resultado->fetch_assoc()) {
    $dados[] = $linha;
}

$retorno["status"] = "ok";
$retorno["mensagem"] = "Checklists carregados com sucesso.";
$retorno["data"] = $dados;

$stmt->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
