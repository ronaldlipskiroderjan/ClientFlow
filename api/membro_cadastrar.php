<?php
include_once("db_conexao.php");
include_once("plano_infra.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Requisicao invalida.",
    "data" => null
];

$usuario_id = $_SESSION['usuario_id'] ?? null;
$agencia_id = $_SESSION['agencia_id'] ?? null;
$permissoes = $_SESSION['permissoes'] ?? [];

if (empty($usuario_id) || empty($agencia_id)) {
    $retorno["mensagem"] = "Usuário não autenticado ou não pertence a uma agência.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if (empty($permissoes['perm_gerenciar_membros'])) {
    $retorno["mensagem"] = "Você não tem permissão para gerenciar membros.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$nome = trim($_POST['nome'] ?? '');
$email = trim($_POST['email'] ?? '');
$telefone = trim($_POST['telefone'] ?? '');
$senha = $_POST['senha'] ?? '';
$papel = trim($_POST['papel'] ?? '');

$perm_ver_clientes = isset($_POST['perm_ver_clientes']) && $_POST['perm_ver_clientes'] === '1' ? 1 : 0;
$perm_criar_clientes = isset($_POST['perm_criar_clientes']) && $_POST['perm_criar_clientes'] === '1' ? 1 : 0;
$perm_ver_projetos = isset($_POST['perm_ver_projetos']) && $_POST['perm_ver_projetos'] === '1' ? 1 : 0;
$perm_criar_projetos = isset($_POST['perm_criar_projetos']) && $_POST['perm_criar_projetos'] === '1' ? 1 : 0;
$perm_designar_projetos = isset($_POST['perm_designar_projetos']) && $_POST['perm_designar_projetos'] === '1' ? 1 : 0;

$perm_gerenciar_membros = isset($_POST['perm_gerenciar_membros']) && $_POST['perm_gerenciar_membros'] === '1' ? 1 : 0;

$projetos_str = $_POST['projetos_designados'] ?? '';
$projetos_array = [];
if (!empty($projetos_str)) {
    $projetos_array = explode(',', $projetos_str);
}

if (empty($nome) || empty($email) || empty($senha) || empty($papel)) {
    $retorno["mensagem"] = "Preencha os campos obrigatórios (nome, email, senha, papel).";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $retorno["mensagem"] = "E-mail inválido.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$papeis_permitidos = ['admin_agencia', 'gerente', 'dev', 'gestor_cliente', 'financeiro'];
if (!in_array($papel, $papeis_permitidos)) {
    $retorno["mensagem"] = "Papel inválido.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$senha_hash = password_hash($senha, PASSWORD_DEFAULT);

try {
    cf_bootstrap_planos($conexao, (int) $agencia_id);
} catch (Exception $e) {
    $retorno["mensagem"] = "Nao foi possivel validar estrutura de planos: " . $e->getMessage();
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$stmt_limite = $conexao->prepare(
    "SELECT tp.limite_colaboradores,
            (SELECT COUNT(DISTINCT ua.usuario_id)
             FROM usuarios_agencia ua
             WHERE ua.agencia_id = ? AND ua.ativo = 1) AS total_colaboradores
     FROM assinaturas_planos ap
     JOIN tipos_planos tp ON tp.id = ap.tipo_plano_id
     WHERE ap.agencia_id = ? AND ap.status = 'ativa'
     LIMIT 1"
);

if (!$stmt_limite) {
    $retorno["mensagem"] = "Erro ao validar limite de colaboradores do plano.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$stmt_limite->bind_param("ii", $agencia_id, $agencia_id);
$stmt_limite->execute();
$res_limite = $stmt_limite->get_result();

if (!$res_limite || $res_limite->num_rows === 0) {
    $stmt_limite->close();
    $retorno["mensagem"] = "Nao foi possivel identificar o plano ativo da agencia.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$dados_limite = $res_limite->fetch_assoc();
$stmt_limite->close();

$limite_colaboradores = (int) ($dados_limite['limite_colaboradores'] ?? 0);
$total_colaboradores = (int) ($dados_limite['total_colaboradores'] ?? 0);

if ($limite_colaboradores > 0 && $total_colaboradores >= $limite_colaboradores) {
    $retorno["mensagem"] = "Limite de colaboradores do seu plano foi atingido ({$total_colaboradores}/{$limite_colaboradores}). Altere o plano para adicionar novos membros.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$conexao->begin_transaction();

try {
    $stmt = $conexao->prepare(
        "INSERT INTO usuarios (nome, email, senha_hash, tipo, telefone, status_conta)
         VALUES (?, ?, ?, 'agency_member', ?, 'aprovado')"
    );
    $stmt->bind_param("ssss", $nome, $email, $senha_hash, $telefone);

    if (!$stmt->execute()) {
        $err_no  = $stmt->errno;
        $stmt->close();
        if ($err_no === 1062) {
            throw new Exception("Este e-mail já está cadastrado no sistema. Utilize outro e-mail para este colaborador.");
        }
        throw new Exception("Erro interno ao cadastrar colaborador. Por favor, tente novamente.");
    }
    
    $novo_usuario_id = $conexao->insert_id;
    $stmt->close();

    $stmt_membro = $conexao->prepare(
        "INSERT INTO usuarios_agencia (
            agencia_id, usuario_id, papel, telefone,
            perm_ver_clientes, perm_criar_clientes,
            perm_ver_projetos, perm_criar_projetos, perm_designar_projetos,
            perm_gerenciar_membros
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    
    $stmt_membro->bind_param(
        "iissiiiiii", 
        $agencia_id, $novo_usuario_id, $papel, $telefone,
        $perm_ver_clientes, $perm_criar_clientes, 
        $perm_ver_projetos, $perm_criar_projetos, $perm_designar_projetos,
        $perm_gerenciar_membros
    );
    
    if (!$stmt_membro->execute()) {
        throw new Exception("Erro ao criar vínculo com agência: " . $stmt_membro->error);
    }
    
    $novo_ua_id = $conexao->insert_id;
    $stmt_membro->close();

    // Designa os projetos se fornecidos e se admin tiver permissao de designar
    if (!empty($projetos_array) && !empty($permissoes['perm_designar_projetos'])) {
        $stmt_proj = $conexao->prepare("INSERT IGNORE INTO projetos_membros (checklist_id, usuario_agencia_id) VALUES (?, ?)");
        foreach ($projetos_array as $chk_id) {
            $c_id = intval(trim($chk_id));
            if ($c_id > 0) {
                // Idealmente validar se o checklist_id pertence a agencia_id
                $stmt_chk = $conexao->prepare("SELECT id FROM checklists WHERE id = ? AND agencia_id = ?");
                $stmt_chk->bind_param("ii", $c_id, $agencia_id);
                $stmt_chk->execute();
                $res_chk = $stmt_chk->get_result();
                if ($res_chk->num_rows > 0) {
                    $stmt_proj->bind_param("ii", $c_id, $novo_ua_id);
                    $stmt_proj->execute();
                }
                $stmt_chk->close();
            }
        }
        $stmt_proj->close();
    }

    $stmt_sync_uso = $conexao->prepare(
        "UPDATE uso_recursos_agencia
         SET total_colaboradores = (
                SELECT COUNT(DISTINCT ua.usuario_id)
                FROM usuarios_agencia ua
                WHERE ua.agencia_id = ? AND ua.ativo = 1
            ),
            data_calculo = NOW()
         WHERE agencia_id = ?"
    );

    if ($stmt_sync_uso) {
        $stmt_sync_uso->bind_param("ii", $agencia_id, $agencia_id);
        $stmt_sync_uso->execute();
        $stmt_sync_uso->close();
    }

    $conexao->commit();

    $retorno["status"] = "ok";
    $retorno["mensagem"] = "Membro adicionado com sucesso!";
    $retorno["data"] = [
        "id" => $novo_ua_id,
        "usuario_id" => $novo_usuario_id,
        "nome" => $nome,
        "email" => $email,
        "papel" => $papel
    ];

} catch (Exception $e) {
    $conexao->rollback();
    $retorno["mensagem"] = $e->getMessage();
}

$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
