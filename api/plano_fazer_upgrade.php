<?php
include_once("db_conexao.php");
include_once("plano_infra.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Erro ao processar upgrade",
    "data" => null
];

$usuario_id = $_SESSION['usuario_id'] ?? null;
$agencia_id = $_SESSION['agencia_id'] ?? null;
$papel_agencia = $_SESSION['papel_agencia'] ?? null;

if (empty($usuario_id) || empty($agencia_id)) {
    $retorno["mensagem"] = "Usuário não autenticado ou agência não identificada.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($papel_agencia !== 'admin_agencia') {
    $retorno["mensagem"] = "Você não tem permissão para fazer upgrade de plano.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$novo_plano_nome = trim($_POST['novo_plano'] ?? '');

if (empty($novo_plano_nome)) {
    $retorno["mensagem"] = "Informe qual plano deseja contratar.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

try {
    cf_bootstrap_planos($conexao, (int) $agencia_id);
} catch (Exception $e) {
    $retorno["mensagem"] = $e->getMessage();
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$conexao->begin_transaction();

try {
    $stmt_novo_plano = $conexao->prepare(
        "SELECT id, nome, limite_colaboradores, limite_projetos, limite_armazenamento_gb 
         FROM tipos_planos WHERE nome = ? AND ativo = 1"
    );
    
    if (!$stmt_novo_plano) {
        throw new Exception("Erro ao preparar consulta de plano.");
    }
    
    $stmt_novo_plano->bind_param("s", $novo_plano_nome);
    $stmt_novo_plano->execute();
    $res_novo_plano = $stmt_novo_plano->get_result();
    
    if ($res_novo_plano->num_rows !== 1) {
        throw new Exception("Plano solicitado não existe ou não está disponível.");
    }
    
    $novo_plano = $res_novo_plano->fetch_assoc();
    $stmt_novo_plano->close();
    
    $stmt_update = $conexao->prepare(
        "UPDATE assinaturas_planos 
         SET tipo_plano_id = ?, data_renovacao = DATE_ADD(CURDATE(), INTERVAL 1 MONTH), atualizado_em = NOW()
         WHERE agencia_id = ? AND status = 'ativa'"
    );
    
    if (!$stmt_update) {
        throw new Exception("Erro ao preparar atualização de plano.");
    }
    
    $stmt_update->bind_param("ii", $novo_plano['id'], $agencia_id);
    
    if (!$stmt_update->execute()) {
        throw new Exception("Erro ao fazer upgrade de plano: " . $stmt_update->error);
    }
    
    $stmt_update->close();
    
    $stmt_validate = $conexao->prepare(
        "SELECT 
            (SELECT COUNT(DISTINCT usuario_id) FROM usuarios_agencia WHERE agencia_id = ? AND ativo = 1) as total_colaboradores,
            (SELECT COUNT(*) FROM checklists WHERE agencia_id = ?) as total_projetos
         LIMIT 1"
    );
    
    if ($stmt_validate) {
        $stmt_validate->bind_param("ii", $agencia_id, $agencia_id);
        $stmt_validate->execute();
        $res_validate = $stmt_validate->get_result();
        
        if ($res_validate->num_rows > 0) {
            $uso = $res_validate->fetch_assoc();
            $avisos = [];
            
            if ($uso['total_colaboradores'] > $novo_plano['limite_colaboradores']) {
                $avisos[] = "Aviso: Você tem mais colaboradores do que o plano permite.";
            }
            
            if ($uso['total_projetos'] > $novo_plano['limite_projetos']) {
                $avisos[] = "Aviso: Você tem mais projetos do que o plano permite.";
            }
        }
        
        $stmt_validate->close();
    }
    
    $stmt_uso = $conexao->prepare(
        "UPDATE uso_recursos_agencia 
         SET data_calculo = NOW()
         WHERE agencia_id = ?"
    );
    
    if ($stmt_uso) {
        $stmt_uso->bind_param("i", $agencia_id);
        $stmt_uso->execute();
        $stmt_uso->close();
    }
    
    $conexao->commit();
    
    $retorno["status"] = "ok";
    $retorno["mensagem"] = "Plano atualizado com sucesso!";
    $retorno["data"] = [
        "novo_plano" => $novo_plano['nome'],
        "limite_colaboradores" => $novo_plano['limite_colaboradores'],
        "limite_projetos" => $novo_plano['limite_projetos'],
        "limite_armazenamento_gb" => $novo_plano['limite_armazenamento_gb'],
        "avisos" => $avisos ?? []
    ];

} catch (Exception $e) {
    $conexao->rollback();
    $retorno["mensagem"] = $e->getMessage();
}

$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
