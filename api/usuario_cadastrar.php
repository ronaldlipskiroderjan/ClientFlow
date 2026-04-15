<?php
include_once("db_conexao.php");

$retorno = [
    "status" => "nok",
    "mensagem" => "Houve um erro ao processar",
    "data" => null
];

$nome = trim($_POST['nome'] ?? '');
$email = trim($_POST['email'] ?? '');
$senha = $_POST['senha'] ?? '';
$tipo = trim($_POST['tipo'] ?? '');
$telefone = trim($_POST['telefone'] ?? '');
$documento = trim($_POST['documento'] ?? '');
$data_nascimento = trim($_POST['data_nascimento'] ?? '');
$nome_empresa = trim($_POST['nome_empresa'] ?? '');
$nome_responsavel = trim($_POST['nome_responsavel'] ?? '');
$contato_juridico_nome = trim($_POST['contato_juridico_nome'] ?? '');
$contato_juridico_email = trim($_POST['contato_juridico_email'] ?? '');
$contato_juridico_telefone = trim($_POST['contato_juridico_telefone'] ?? '');

function normalizar_data_para_iso($valor) {
    $valor = trim($valor);
    if ($valor === '') {
        return null;
    }

    if (preg_match('/^(\d{2})\/(\d{2})\/(\d{4})$/', $valor, $partes)) {
        $dia = (int)$partes[1];
        $mes = (int)$partes[2];
        $ano = (int)$partes[3];

        if (!checkdate($mes, $dia, $ano)) {
            return false;
        }

        return sprintf('%04d-%02d-%02d', $ano, $mes, $dia);
    }

    if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $valor, $partes)) {
        $ano = (int)$partes[1];
        $mes = (int)$partes[2];
        $dia = (int)$partes[3];

        if (!checkdate($mes, $dia, $ano)) {
            return false;
        }

        return sprintf('%04d-%02d-%02d', $ano, $mes, $dia);
    }

    return false;
}

$tipos_permitidos = ["client", "freelancer", "agency", "admin"];

if (empty($nome) || empty($email) || empty($senha) || empty($tipo)) {
    $retorno["mensagem"] = "Preencha os campos obrigatórios.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if (!in_array($tipo, $tipos_permitidos, true)) {
    $retorno["mensagem"] = "Tipo de usuário inválido.";
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

$senha_hash = password_hash($senha, PASSWORD_DEFAULT);

$data_nascimento = normalizar_data_para_iso($data_nascimento);
if ($data_nascimento === false) {
    $retorno["mensagem"] = "Data de nascimento inválida.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$conexao->begin_transaction();

try {
    // Se for agency, o tipo na tabela usuarios sera agency_member (para o proprio login)
    $tipo_db = ($tipo === 'agency') ? 'agency_member' : $tipo;

    $stmt = $conexao->prepare(
        "INSERT INTO usuarios (nome, email, senha_hash, tipo, telefone, documento, data_nascimento, nome_empresa, nome_responsavel, status_conta)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'aprovado')"
    );

    $stmt->bind_param(
        "sssssssss",
        $nome,
        $email,
        $senha_hash,
        $tipo_db,
        $telefone,
        $documento,
        $data_nascimento,
        $nome_empresa,
        $nome_responsavel
    );

    if (!$stmt->execute()) {
        if ($conexao->errno == 1062) {
            throw new Exception("Este e-mail já está cadastrado.");
        } else {
            throw new Exception("Erro ao cadastrar: " . $stmt->error);
        }
    }
    
    $usuario_id = $conexao->insert_id;
    $stmt->close();

    // Se o tipo original era 'agency', precisamos criar a agência em si e vinculá-lo como admin
    if ($tipo === 'agency') {
        if (empty($nome_empresa) || empty($documento)) {
            throw new Exception("Nome da empresa e CNPJ são obrigatórios para agências.");
        }
        if (empty($contato_juridico_nome)) {
            throw new Exception("Nome do contato jurídico é obrigatório para agências.");
        }

        $stmt_agencia = $conexao->prepare(
            "INSERT INTO agencias (nome_empresa, nome_contato_juridico, email_contato_juridico, telefone_contato_juridico, cnpj, telefone)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt_agencia->bind_param(
            "ssssss",
            $nome_empresa,
            $contato_juridico_nome,
            $contato_juridico_email,
            $contato_juridico_telefone,
            $documento,
            $telefone
        );
        if (!$stmt_agencia->execute()) {
            throw new Exception("Erro ao criar agência: " . $stmt_agencia->error);
        }
        $agencia_id = $conexao->insert_id;
        $stmt_agencia->close();

        // Vincula o usuário recém criado como dono (admin_agencia) e dá todas as permissões
        $stmt_membro = $conexao->prepare(
            "INSERT INTO usuarios_agencia (
                agencia_id, usuario_id, papel, telefone,
                perm_ver_clientes, perm_criar_clientes,
                perm_ver_projetos, perm_criar_projetos, perm_designar_projetos,
                perm_financeiro, perm_gerenciar_membros
            ) VALUES (?, ?, 'admin_agencia', ?, 1, 1, 1, 1, 1, 1, 1)"
        );
        $stmt_membro->bind_param("iis", $agencia_id, $usuario_id, $telefone);
        if (!$stmt_membro->execute()) {
            throw new Exception("Erro ao criar vínculo de admin da agência: " . $stmt_membro->error);
        }
        $stmt_membro->close();
    }

    $conexao->commit();

    $retorno["status"] = "ok";
    $retorno["mensagem"] = "Usuário cadastrado com sucesso!";
    $retorno["data"] = [
        "id" => $usuario_id,
        "nome" => $nome,
        "tipo" => $tipo // Retornamos o tipo original que o app solicitou para não quebrar o front
    ];

} catch (Exception $e) {
    $conexao->rollback();
    $retorno["mensagem"] = $e->getMessage();
}

$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
