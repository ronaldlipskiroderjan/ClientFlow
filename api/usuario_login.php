<?php
include_once("db_conexao.php");

$retorno = [
    "status" => "nok",
    "mensagem" => "Credenciais inválidas",
    "data" => null
];

function carregar_vinculo_agencia_ativo($conexao, $usuario_id) {
    $stmt_ua = $conexao->prepare(
        "SELECT id as ua_id, agencia_id, papel,
                perm_ver_clientes, perm_criar_clientes,
                perm_ver_projetos, perm_criar_projetos, perm_designar_projetos,
                perm_financeiro, perm_gerenciar_membros, ativo
         FROM usuarios_agencia
         WHERE usuario_id = ? AND ativo = 1
         LIMIT 1"
    );

    if (!$stmt_ua) {
        return null;
    }

    $stmt_ua->bind_param("i", $usuario_id);
    if (!$stmt_ua->execute()) {
        $stmt_ua->close();
        return null;
    }

    $res_ua = $stmt_ua->get_result();
    $ua = $res_ua->num_rows === 1 ? $res_ua->fetch_assoc() : null;
    $stmt_ua->close();

    return $ua;
}

function montar_permissoes_sessao($ua) {
    return [
        'perm_ver_clientes' => (bool)$ua['perm_ver_clientes'],
        'perm_criar_clientes' => (bool)$ua['perm_criar_clientes'],
        'perm_ver_projetos' => (bool)$ua['perm_ver_projetos'],
        'perm_criar_projetos' => (bool)$ua['perm_criar_projetos'],
        'perm_designar_projetos' => (bool)$ua['perm_designar_projetos'],
        'perm_financeiro' => (bool)$ua['perm_financeiro'],
        'perm_gerenciar_membros' => (bool)$ua['perm_gerenciar_membros']
    ];
}

$email_form = trim($_POST['email'] ?? '');
$senha_form = $_POST['senha'] ?? '';

if (empty($email_form) || empty($senha_form)) {
    $retorno["mensagem"] = "Preencha e-mail e senha.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($email_form == "admin@clientflow.com") {
    $stmt_check = $conexao->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt_check->bind_param("s", $email_form);
    $stmt_check->execute();
    $resultado_check = $stmt_check->get_result();

    if ($resultado_check->num_rows == 0) {
        $admin_pass = "12345678";
        $admin_nome = "Administrador";
        $senha_hash = password_hash($admin_pass, PASSWORD_DEFAULT);
        $tipo = "admin";
        $status = "aprovado";

        $stmt_create = $conexao->prepare(
            "INSERT INTO usuarios (nome, email, senha_hash, tipo, status_conta)
             VALUES (?, ?, ?, ?, ?)"
        );
        $stmt_create->bind_param(
            "sssss",
            $admin_nome,
            $email_form,
            $senha_hash,
            $tipo,
            $status
        );
        $stmt_create->execute();
        $stmt_create->close();
    }

    $stmt_check->close();
}

$stmt = $conexao->prepare("SELECT id, nome, email, senha_hash, tipo, telefone, documento, nome_empresa, nome_responsavel, status_conta FROM usuarios WHERE email = ?");
$stmt->bind_param("s", $email_form);
$stmt->execute();
$resultado = $stmt->get_result();

if ($resultado->num_rows === 1) {
    $usuario = $resultado->fetch_assoc();
    $hash_banco = $usuario['senha_hash'];

    if (password_verify($senha_form, $hash_banco)) {
        if ($usuario['status_conta'] == 'pendente') {
            $retorno["mensagem"] = "Sua conta ainda está pendente de aprovação.";
        } else if ($usuario['status_conta'] == 'banido') {
            $retorno["mensagem"] = "Esta conta foi banida da plataforma.";
        } else if ($usuario['status_conta'] == 'aprovado') {
            session_start();

            $_SESSION['usuario_id'] = $usuario['id'];
            $_SESSION['usuario_nome'] = $usuario['nome'];
            $_SESSION['usuario_email'] = $usuario['email'];
            $_SESSION['usuario_tipo'] = $usuario['tipo'];

            if (in_array($usuario['tipo'], ['agency_member', 'agency'], true)) {
                $ua = carregar_vinculo_agencia_ativo($conexao, $usuario['id']);

                if (!$ua) {
                    session_destroy();
                    $retorno["mensagem"] = "Sua conta não possui um vínculo de agência ativo.";
                    header("Content-type: application/json;charset:utf-8");
                    echo json_encode($retorno);
                    exit();
                }

                $_SESSION['agencia_id'] = $ua['agencia_id'];
                $_SESSION['papel_agencia'] = $ua['papel'];
                $_SESSION['ua_id'] = $ua['ua_id'];
                $_SESSION['permissoes'] = montar_permissoes_sessao($ua);
            }

            $retorno["status"] = "ok";
            $retorno["mensagem"] = "Login efetuado com sucesso!";
            $retorno["data"] = [
                "id" => $usuario['id'],
                "nome" => $usuario['nome'],
                "email" => $usuario['email'],
                "tipo" => $usuario['tipo']
            ];

            if (isset($_SESSION['permissoes'])) {
                $retorno["data"]["permissoes"] = $_SESSION['permissoes'];
                $retorno["data"]["papel_agencia"] = $_SESSION['papel_agencia'];
                $retorno["data"]["agencia_id"] = $_SESSION['agencia_id'];
            }
        }
    }
}

$stmt->close();
$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
