<?php
include_once("db_conexao.php");
session_start();

$retorno = [
    "status" => "nok",
    "mensagem" => "Requisição inválida.",
    "data" => null
];

$usuario_id = $_SESSION['usuario_id'] ?? null;
$tipo = $_SESSION['usuario_tipo'] ?? null;
$agencia_id = $_SESSION['agencia_id'] ?? null;
$permissoes = $_SESSION['permissoes'] ?? [];

if (empty($usuario_id)) {
    $retorno["mensagem"] = "Usuário não autenticado.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if (($tipo === 'agency' || $tipo === 'agency_member') && empty($permissoes['perm_designar_projetos'])) {
    $retorno["mensagem"] = "Você não tem permissão para vincular clientes a projetos.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

// Aceita CPF, CNPJ ou documento
$cpf_cnpj = preg_replace('/[^0-9]/', '', $_POST['cpf'] ?? ($_POST['cnpj'] ?? ($_POST['documento'] ?? '')));
$checklist_id = intval($_POST['checklist_id'] ?? 0);

if (empty($cpf_cnpj) || $checklist_id <= 0) {
    $retorno["mensagem"] = "Parâmetros inválidos. Informe um CPF, CNPJ ou documento válido.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

// Validar formato: CPF (11) ou CNPJ (14)
if (strlen($cpf_cnpj) !== 11 && strlen($cpf_cnpj) !== 14) {
    $retorno["mensagem"] = "CPF ou CNPJ inválido. Deve ter 11 ou 14 dígitos.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

// 1. Validar checklist
if ($tipo === 'freelancer') {
    // Para freelancer, validar de outra forma se necessário
} else {
    $stmt_chk = $conexao->prepare("SELECT id FROM checklists WHERE id = ? AND agencia_id = ?");
    $stmt_chk->bind_param("ii", $checklist_id, $agencia_id);
    $stmt_chk->execute();
    if ($stmt_chk->get_result()->num_rows !== 1) {
        $retorno["mensagem"] = "Projeto (checklist) inválido ou não pertence a esta agência.";
        $stmt_chk->close();
        header("Content-type: application/json;charset:utf-8");
        echo json_encode($retorno);
        exit();
    }
    $stmt_chk->close();
}

$conexao->begin_transaction();

try {
    // 2. Achar o usuario pelo CPF/CNPJ/documento
    $stmt_usr = $conexao->prepare("SELECT id, nome, email, senha_hash, nome_empresa, documento FROM usuarios WHERE documento = ? AND tipo = 'client' LIMIT 1");
    $stmt_usr->bind_param("s", $cpf_cnpj);
    $stmt_usr->execute();
    $res_usr = $stmt_usr->get_result();

    if ($res_usr->num_rows === 0) {
        // Tenta procurar pelo nome da empresa ou outro critério se for CNPJ
        $msg = strlen($cpf_cnpj) === 14 ? "Cliente (CNPJ) não encontrado no sistema." : "Cliente (CPF) não encontrado no sistema.";
        throw new Exception($msg);
    }
    $usu = $res_usr->fetch_assoc();
    $cliente_usuario_id = $usu['id'];
    $stmt_usr->close();

    $cliente_id_final = 0;

    // 3. Verifica ou Cria registro na tabela Clientes
    if ($tipo === 'agency' || $tipo === 'agency_member') {
        $stmt_cli = $conexao->prepare("SELECT id FROM clientes WHERE usuario_id = ? AND agencia_id = ? LIMIT 1");
        $stmt_cli->bind_param("ii", $cliente_usuario_id, $agencia_id);
        $stmt_cli->execute();
        $res_cli = $stmt_cli->get_result();

        if ($res_cli->num_rows === 1) {
            $cliente_id_final = $res_cli->fetch_assoc()['id'];
        } else {
            $stmt_ins = $conexao->prepare("INSERT INTO clientes (agencia_id, usuario_id, nome, email, senha, empresa) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt_ins->bind_param("iissss", $agencia_id, $cliente_usuario_id, $usu['nome'], $usu['email'], $usu['senha_hash'], $usu['nome_empresa']);
            if (!$stmt_ins->execute()) {
                throw new Exception("Erro ao registrar cliente na agência.");
            }
            $cliente_id_final = $conexao->insert_id;
            $stmt_ins->close();
        }
        $stmt_cli->close();
    } else {
        // Freelancer context
         $stmt_cli = $conexao->prepare("SELECT id FROM clientes WHERE usuario_id = ? LIMIT 1");
         $stmt_cli->bind_param("i", $cliente_usuario_id);
         $stmt_cli->execute();
         $res_cli = $stmt_cli->get_result();
         if ($res_cli->num_rows === 1) {
             $cliente_id_final = $res_cli->fetch_assoc()['id'];
         } else {
             throw new Exception("Freelancer não tem vínculo com este cliente.");
         }
         $stmt_cli->close();
    }

    // 4. Update Checklist
    $stmt_upd = $conexao->prepare("UPDATE checklists SET cliente_id = ? WHERE id = ?");
    $stmt_upd->bind_param("ii", $cliente_id_final, $checklist_id);
    if (!$stmt_upd->execute()) {
        throw new Exception("Erro ao vincular projeto ao cliente.");
    }
    $stmt_upd->close();

    $conexao->commit();

    $doc_tipo = strlen($cpf_cnpj) === 14 ? "CNPJ" : "CPF";
    $retorno["status"] = "ok";
    $retorno["mensagem"] = "Cliente vinculado ao projeto com sucesso via " . $doc_tipo . "!";
    $retorno["data"] = [
        "cliente_id" => $cliente_id_final,
        "checklist_id" => $checklist_id,
        "nome" => $usu['nome'],
        "documento" => $cpf_cnpj,
        "tipo_documento" => $doc_tipo
    ];

} catch (Exception $e) {
    $conexao->rollback();
    $retorno["mensagem"] = $e->getMessage();
}

$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
