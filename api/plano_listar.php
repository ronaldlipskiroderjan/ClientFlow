<?php
include_once("db_conexao.php");
include_once("plano_infra.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Erro ao buscar planos",
    "data" => null
];

$usuario_id = $_SESSION['usuario_id'] ?? null;
$agencia_id = $_SESSION['agencia_id'] ?? null;

if (empty($usuario_id) || empty($agencia_id)) {
    $retorno["mensagem"] = "Usuário não autenticado.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

try {
    cf_bootstrap_planos($conexao, (int) $agencia_id);

    $stmt_atual = $conexao->prepare(
        "SELECT tp.id, tp.nome, tp.descricao, tp.preco_mensal, tp.preco_anual, 
                tp.limite_colaboradores, tp.limite_projetos, tp.limite_armazenamento_gb,
                ap.data_renovacao, ap.tipo_renovacao
         FROM assinaturas_planos ap
         JOIN tipos_planos tp ON ap.tipo_plano_id = tp.id
         WHERE ap.agencia_id = ? AND ap.status = 'ativa'
         LIMIT 1"
    );
    
    if (!$stmt_atual) {
        throw new Exception("Erro ao preparar consulta de plano atual.");
    }
    
    $stmt_atual->bind_param("i", $agencia_id);
    $stmt_atual->execute();
    $res_atual = $stmt_atual->get_result();
    
    $plano_atual = null;
    if ($res_atual->num_rows > 0) {
        $plano_atual = $res_atual->fetch_assoc();
    }
    $stmt_atual->close();
    
    $stmt_planos = $conexao->prepare(
        "SELECT id, nome, descricao, preco_mensal, preco_anual, 
                limite_colaboradores, limite_projetos, limite_armazenamento_gb
         FROM tipos_planos 
         WHERE ativo = 1
         ORDER BY preco_mensal ASC"
    );
    
    if (!$stmt_planos) {
        throw new Exception("Erro ao preparar consulta de planos.");
    }
    
    $stmt_planos->execute();
    $res_planos = $stmt_planos->get_result();
    
    $planos = [];
    while ($plano = $res_planos->fetch_assoc()) {
        $planos[] = $plano;
    }
    $stmt_planos->close();
    
    $stmt_uso = $conexao->prepare(
        "SELECT total_colaboradores, total_projetos, armazenamento_usado_mb
         FROM uso_recursos_agencia
         WHERE agencia_id = ?
         LIMIT 1"
    );
    
    if ($stmt_uso) {
        $stmt_uso->bind_param("i", $agencia_id);
        $stmt_uso->execute();
        $res_uso = $stmt_uso->get_result();
        
        $uso_recursos = null;
        if ($res_uso->num_rows > 0) {
            $uso_recursos = $res_uso->fetch_assoc();
        }
        $stmt_uso->close();
    }
    
    $retorno["status"] = "ok";
    $retorno["mensagem"] = "Planos carregados com sucesso!";
    $retorno["data"] = [
        "plano_atual" => $plano_atual,
        "planos_disponiveis" => $planos,
        "uso_recursos" => $uso_recursos
    ];

} catch (Exception $e) {
    $retorno["mensagem"] = $e->getMessage();
}

$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
