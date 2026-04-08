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

$stmt = $conexao->prepare(
    "INSERT INTO usuarios (nome, email, senha_hash, tipo, telefone, documento, data_nascimento, nome_empresa, nome_responsavel, status_conta)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'aprovado')"
);

$stmt->bind_param(
    "sssssssss",
    $nome,
    $email,
    $senha_hash,
    $tipo,
    $telefone,
    $documento,
    $data_nascimento,
    $nome_empresa,
    $nome_responsavel
);

if ($stmt->execute()) {
    $retorno["status"] = "ok";
    $retorno["mensagem"] = "Usuário cadastrado com sucesso!";
    $retorno["data"] = [
        "id" => $conexao->insert_id,
        "nome" => $nome,
        "tipo" => $tipo
    ];
} else {
    if ($conexao->errno == 1062) {
        $retorno["mensagem"] = "Este e-mail já está cadastrado.";
    } else {
        $retorno["mensagem"] = "Erro ao cadastrar: " . $stmt->error;
    }
}

$stmt->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
