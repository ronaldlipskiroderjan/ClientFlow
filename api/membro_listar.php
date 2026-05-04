<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Usuário não autenticado",
    "data" => []
];

$usuario_id = $_SESSION['usuario_id'] ?? null;
$agencia_id = $_SESSION['agencia_id'] ?? null;

if (empty($usuario_id) || empty($agencia_id)) {
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$stmt = $conexao->prepare(
    "SELECT ua.id AS ua_id, ua.papel, ua.perm_ver_clientes, ua.perm_criar_clientes, 
            ua.perm_ver_projetos, ua.perm_criar_projetos, ua.perm_designar_projetos, 
            ua.perm_financeiro, ua.perm_gerenciar_membros, ua.ativo, ua.criado_em,
            u.id AS usuario_id, u.nome, u.email, u.telefone
     FROM usuarios_agencia ua
     INNER JOIN usuarios u ON u.id = ua.usuario_id
     WHERE ua.agencia_id = ?
     ORDER BY ua.criado_em DESC"
);
$stmt->bind_param("i", $agencia_id);
$stmt->execute();
$resultado = $stmt->get_result();

$membros = [];
while ($linha = $resultado->fetch_assoc()) {
    $ativo_bool = (bool)$linha['ativo'];
    
    $membro = [
        "id" => $linha['ua_id'],
        "usuario_id" => $linha['usuario_id'],
        "nome" => $linha['nome'],
        "email" => $linha['email'],
        "telefone" => $linha['telefone'],
        "papel" => $linha['papel'],
        "ativo" => $ativo_bool,
        "criado_em" => $linha['criado_em'],
        "projetos_qtd" => 0,
        "projetos" => [],
        "permissoes" => [
            "ver_clientes" => (bool)$linha['perm_ver_clientes'],
            "criar_clientes" => (bool)$linha['perm_criar_clientes'],
            "ver_projetos" => (bool)$linha['perm_ver_projetos'],
            "criar_projetos" => (bool)$linha['perm_criar_projetos'],
            "designar_projetos" => (bool)$linha['perm_designar_projetos'],
            "financeiro" => (bool)$linha['perm_financeiro'],
            "gerenciar_membros" => (bool)$linha['perm_gerenciar_membros']
        ]
    ];
    $membros[$linha['ua_id']] = $membro;
}
$stmt->close();

if (count($membros) > 0) {
    // Buscar membros atribuidos a projetos
    $stmt_proj = $conexao->prepare(
        "SELECT pm.usuario_agencia_id, c.id AS checklist_id, c.titulo 
         FROM projetos_membros pm 
         INNER JOIN checklists c ON c.id = pm.checklist_id 
         WHERE c.agencia_id = ?"
    );
    $stmt_proj->bind_param("i", $agencia_id);
    $stmt_proj->execute();
    $res_proj = $stmt_proj->get_result();
    while ($linha = $res_proj->fetch_assoc()) {
        $ua_id = $linha['usuario_agencia_id'];
        if (isset($membros[$ua_id])) {
            $membros[$ua_id]['projetos'][] = [
                "id" => $linha['checklist_id'],
                "titulo" => $linha['titulo']
            ];
            $membros[$ua_id]['projetos_qtd']++;
        }
    }
    $stmt_proj->close();
}

$retorno["status"] = "ok";
$retorno["mensagem"] = "Membros carregados com sucesso.";
$retorno["data"] = array_values($membros);

$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
