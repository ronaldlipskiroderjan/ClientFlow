<?php
include_once("db_conexao.php");
session_start();
require '../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$retorno = [
    "status" => "nok",
    "mensagem" => "Usuário não autenticado",
    "data" => null
];

$usuario_id    = $_SESSION['usuario_id'] ?? null;
$usuario_tipo  = $_SESSION['usuario_tipo'] ?? null;
$agencia_id    = $_SESSION['agencia_id'] ?? null;
$permissoes    = $_SESSION['permissoes'] ?? [];

if (empty($usuario_id)) {
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if ($usuario_tipo === "client") {
    $retorno["mensagem"] = "Perfil sem permissão para criar formulário.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if (($usuario_tipo === 'agency' || $usuario_tipo === 'agency_member' || $usuario_tipo === 'freelancer') && empty($permissoes['perm_criar_projetos'])) {
    $retorno["mensagem"] = "Você não tem permissão para criar projetos.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if (empty($agencia_id)) {
    $retorno["mensagem"] = "Agência não identificada para criar formulário.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$titulo                   = trim($_POST['titulo'] ?? '');
$descricao                = trim($_POST['descricao'] ?? '');
$email_cliente            = trim($_POST['email_cliente'] ?? '');
$data_vencimento          = !empty($_POST['data_vencimento']) ? trim($_POST['data_vencimento']) : null;
$frequencia_cobranca_dias = !empty($_POST['frequencia_cobranca_dias']) ? intval($_POST['frequencia_cobranca_dias']) : null;
$itens_json               = $_POST['itens'] ?? '[]';
$itens                    = json_decode($itens_json, true);

if (empty($titulo)) {
    $retorno["mensagem"] = "Informe o título do projeto.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if (empty($email_cliente) || !filter_var($email_cliente, FILTER_VALIDATE_EMAIL)) {
    $retorno["mensagem"] = "Informe um e-mail válido para o cliente.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

if (!is_array($itens) || count($itens) === 0) {
    $retorno["mensagem"] = "Adicione pelo menos um item no formulário.";
    header("Content-type: application/json;charset:utf-8");
    echo json_encode($retorno);
    exit();
}

$link_hash = bin2hex(random_bytes(16));

function parse_int_or_null($value) {
    if ($value === null || $value === '') return null;
    if (!is_numeric($value)) return null;
    $parsed = intval($value);
    return $parsed > 0 ? $parsed : null;
}

function normalize_extensions($value) {
    if ($value === null || $value === '') return null;
    $parts = explode(',', strtolower($value));
    $normalized = [];
    foreach ($parts as $part) {
        $clean = preg_replace('/[^a-z0-9]/', '', trim($part));
        if ($clean !== '' && !in_array($clean, $normalized, true)) {
            $normalized[] = $clean;
        }
    }
    return count($normalized) ? implode(',', $normalized) : null;
}

$conexao->begin_transaction();

try {
    // ── 1. Criar o checklist ──────────────────────────────────────────────────
    $stmt_checklist = $conexao->prepare(
        "INSERT INTO checklists (agencia_id, titulo, descricao, link_hash, status, data_vencimento, frequencia_cobranca_dias)
         VALUES (?, ?, ?, ?, 'pending', ?, ?)"
    );
    $stmt_checklist->bind_param("issssi", $agencia_id, $titulo, $descricao, $link_hash, $data_vencimento, $frequencia_cobranca_dias);
    $stmt_checklist->execute();
    $checklist_id = $conexao->insert_id;
    $stmt_checklist->close();

    // ── 2. Inserir itens ──────────────────────────────────────────────────────
    $stmt_item = $conexao->prepare(
        "INSERT INTO itens_checklist (
            checklist_id, nome_item, descricao_item, formato_esperado,
            min_chars, max_chars, allowed_extensions, max_file_size_kb,
            min_width, max_width, min_height, max_height, status
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')"
    );

    foreach ($itens as $item) {
        $nome_item          = trim($item['nome'] ?? '');
        $descricao_item     = trim($item['descricao'] ?? '');
        $formato            = trim($item['tipo'] ?? 'text');
        $min_chars          = parse_int_or_null($item['min_chars'] ?? null);
        $max_chars          = parse_int_or_null($item['max_chars'] ?? null);
        $allowed_extensions = normalize_extensions($item['allowed_extensions'] ?? null);
        $max_file_size_kb   = parse_int_or_null($item['max_file_size_kb'] ?? null);
        $min_width          = parse_int_or_null($item['min_width'] ?? null);
        $max_width          = parse_int_or_null($item['max_width'] ?? null);
        $min_height         = parse_int_or_null($item['min_height'] ?? null);
        $max_height         = parse_int_or_null($item['max_height'] ?? null);

        if ($nome_item === '') continue;
        if ($min_chars !== null && $max_chars !== null && $min_chars > $max_chars) {
            [$min_chars, $max_chars] = [$max_chars, $min_chars];
        }

        $stmt_item->bind_param(
            "isssiisiiiii",
            $checklist_id, $nome_item, $descricao_item, $formato,
            $min_chars, $max_chars, $allowed_extensions, $max_file_size_kb,
            $min_width, $max_width, $min_height, $max_height
        );
        $stmt_item->execute();
    }
    $stmt_item->close();

    // ── 3. Buscar ou criar o cliente pelo e-mail ──────────────────────────────
    $cliente_nome  = $email_cliente; // Fallback; atualizado se o usuário existir
    $cliente_id    = null;
    $usuario_encontrado = null;

    // Verificar se já existe um usuário com este e-mail
    $stmt_usr = $conexao->prepare("SELECT id, nome FROM usuarios WHERE email = ? LIMIT 1");
    $stmt_usr->bind_param("s", $email_cliente);
    $stmt_usr->execute();
    $res_usr = $stmt_usr->get_result();
    if ($res_usr->num_rows === 1) {
        $usuario_encontrado = $res_usr->fetch_assoc();
        $cliente_nome = $usuario_encontrado['nome'];
    }
    $stmt_usr->close();

    // Verificar se já existe na tabela clientes para esta agência
    $stmt_cli = $conexao->prepare(
        "SELECT id FROM clientes WHERE email = ? AND agencia_id = ? LIMIT 1"
    );
    $stmt_cli->bind_param("si", $email_cliente, $agencia_id);
    $stmt_cli->execute();
    $res_cli = $stmt_cli->get_result();

    if ($res_cli->num_rows === 1) {
        $cliente_id = intval($res_cli->fetch_assoc()['id']);
    } else {
        // Criar entrada na tabela clientes (o usuário pode ainda não ter conta)
        $usuario_id_cliente = $usuario_encontrado ? intval($usuario_encontrado['id']) : null;
        $senha_placeholder  = '';
        $empresa_placeholder = '';

        $stmt_insert_cli = $conexao->prepare(
            "INSERT INTO clientes (agencia_id, usuario_id, nome, email, senha, empresa)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt_insert_cli->bind_param(
            "iissss",
            $agencia_id, $usuario_id_cliente,
            $cliente_nome, $email_cliente,
            $senha_placeholder, $empresa_placeholder
        );
        if (!$stmt_insert_cli->execute()) {
            throw new Exception("Erro ao registrar cliente: " . $stmt_insert_cli->error);
        }
        $cliente_id = $conexao->insert_id;
        $stmt_insert_cli->close();
    }
    $stmt_cli->close();

    // ── 4. Vincular cliente ao checklist ──────────────────────────────────────
    $stmt_vinc = $conexao->prepare("UPDATE checklists SET cliente_id = ? WHERE id = ?");
    $stmt_vinc->bind_param("ii", $cliente_id, $checklist_id);
    $stmt_vinc->execute();
    $stmt_vinc->close();

    $conexao->commit();

    // ── 5. Enviar e-mail de boas-vindas ───────────────────────────────────────
    $link_acesso  = "http://localhost/ClientFlow/public/pages/cadastro.html?token=" . $link_hash;
    $vencimento_fmt = $data_vencimento ? date("d/m/Y", strtotime($data_vencimento)) : null;
    $freq_txt = $frequencia_cobranca_dias ? "a cada {$frequencia_cobranca_dias} dia(s)" : null;

    // Montar lista de itens solicitados para o e-mail
    $itens_html = '';
    foreach ($itens as $item) {
        $nome_it = htmlspecialchars(trim($item['nome'] ?? ''), ENT_QUOTES);
        $desc_it = htmlspecialchars(trim($item['descricao'] ?? ''), ENT_QUOTES);
        if (!$nome_it) continue;
        $itens_html .= "<li style='margin-bottom:6px;'><strong>{$nome_it}</strong>";
        if ($desc_it) $itens_html .= " — <span style='color:#6b7280;'>{$desc_it}</span>";
        $itens_html .= "</li>";
    }

    $prazo_bloco = '';
    if ($vencimento_fmt) {
        $prazo_bloco = "
            <div style='background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:20px 0;'>
                <strong>⏳ Prazo de entrega:</strong> {$vencimento_fmt}" .
                ($freq_txt ? " &nbsp;|&nbsp; <strong>Lembretes:</strong> {$freq_txt}" : "") . "
            </div>";
    }

    $html_email = "
        <div style='font-family: Inter, Arial, sans-serif; color: #1f2937; max-width: 620px; margin: 0 auto; padding: 0; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;'>
            <!-- Header -->
            <div style='background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 36px 32px; text-align: center;'>
                <h1 style='margin:0; color: #fff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;'>ClientFlow</h1>
                <p style='margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;'>Plataforma de Gestão de Projetos</p>
            </div>

            <!-- Body -->
            <div style='padding: 36px 32px; background: #ffffff;'>
                <h2 style='margin:0 0 8px; font-size: 20px; color: #111827;'>Olá! Você foi convidado para um projeto. 🎉</h2>
                <p style='color:#6b7280; margin: 0 0 24px; font-size: 15px;'>Uma solicitação de documentos e materiais foi criada especialmente para você. Veja abaixo os detalhes do projeto:</p>

                <div style='background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:20px; margin-bottom:20px;'>
                    <p style='margin:0 0 4px; font-size:12px; text-transform:uppercase; color:#6b7280; font-weight:600; letter-spacing:.5px;'>Projeto</p>
                    <p style='margin:0; font-size:20px; font-weight:700; color:#111827;'>" . htmlspecialchars($titulo) . "</p>
                    " . ($descricao ? "<p style='margin:8px 0 0; color:#6b7280; font-size:14px;'>" . nl2br(htmlspecialchars($descricao)) . "</p>" : "") . "
                </div>

                {$prazo_bloco}

                <p style='font-weight: 600; color: #111827; margin: 24px 0 12px;'>📋 Itens solicitados:</p>
                <ul style='margin:0; padding-left:20px; color:#374151; font-size:14px; line-height:1.7;'>
                    {$itens_html}
                </ul>

                <div style='text-align:center; margin: 32px 0;'>
                    <a href='{$link_acesso}' style='display:inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; letter-spacing: 0.3px;'>
                        Acessar o Projeto →
                    </a>
                </div>

                <p style='font-size:13px; color:#9ca3af; text-align:center;'>Se você já possui conta no ClientFlow, basta fazer login para ver o projeto. Caso contrário, você será guiado para criar sua conta gratuitamente.</p>
            </div>

            <!-- Footer -->
            <div style='background:#f9fafb; padding:20px 32px; text-align:center; border-top:1px solid #e5e7eb;'>
                <p style='margin:0; font-size:12px; color:#9ca3af;'>Este e-mail foi enviado por <strong>ClientFlow</strong>. Não responda a este e-mail.</p>
            </div>
        </div>
    ";

    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'clientflow.aviso@gmail.com';
        $mail->Password   = 'nrpv mvby ebuq ifvh';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;
        $mail->CharSet    = 'UTF-8';

        $mail->setFrom('clientflow.aviso@gmail.com', 'ClientFlow');
        $mail->addAddress($email_cliente, $cliente_nome);

        $mail->isHTML(true);
        $mail->Subject = "Projeto \"{$titulo}\" — Documentos Solicitados | ClientFlow";
        $mail->Body    = $html_email;
        $mail->AltBody = "Olá! Você foi convidado para o projeto \"{$titulo}\". Acesse: {$link_acesso}";
        $mail->send();
    } catch (Exception $e) {
        // E-mail falhou, mas não cancela o checklist — apenas loga
        error_log("Falha ao enviar e-mail de boas-vindas para {$email_cliente}: " . $mail->ErrorInfo);
    }

    $retorno["status"]  = "ok";
    $retorno["mensagem"] = "Formulário criado e e-mail enviado ao cliente.";
    $retorno["data"] = [
        "checklist_id" => $checklist_id,
        "link_hash"    => $link_hash,
        "cliente_id"   => $cliente_id
    ];

} catch (Exception $e) {
    $conexao->rollback();
    $retorno["mensagem"] = "Erro ao criar formulário: " . $e->getMessage();
}

$conexao->close();

header("Content-type: application/json;charset:utf-8");
echo json_encode($retorno);
?>
