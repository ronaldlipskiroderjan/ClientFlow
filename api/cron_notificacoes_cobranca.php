<?php

include_once("db_conexao.php");
require '../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;


$query = "
    SELECT c.id, c.titulo, c.link_hash, c.data_vencimento, c.frequencia_cobranca_dias, c.ultima_cobranca,
           COALESCE(u.nome, cl.nome) AS cliente_nome,
           cl.email AS cliente_email
    FROM checklists c
    JOIN clientes cl ON cl.id = c.cliente_id
    LEFT JOIN usuarios u ON u.id = cl.usuario_id
    WHERE (c.status IS NULL OR c.status = '' OR c.status = 'Aberto')
      AND c.data_vencimento IS NOT NULL
      AND c.frequencia_cobranca_dias > 0
      AND (c.ultima_cobranca IS NULL OR DATEDIFF(NOW(), c.ultima_cobranca) >= c.frequencia_cobranca_dias)
      AND EXISTS (SELECT 1 FROM itens_checklist ic WHERE ic.checklist_id = c.id AND ic.status IN ('pending', 'rejected', 'review'))
";

$result = $conexao->query($query);
$enviados = 0;
$erros = 0;

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $checklist_id = $row['id'];
        $cliente_email = $row['cliente_email'];
        $cliente_nome = $row['cliente_nome'];
        $titulo = $row['titulo'];
        $link_hash = $row['link_hash'];
        $vencimento = date("d/m/Y", strtotime($row['data_vencimento']));

        $link_acesso = "http://localhost/ClientFlow/public/pages/checklist.html?hash=" . $link_hash;

        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host = 'smtp.gmail.com';
            $mail->SMTPAuth = true;
            $mail->Username = 'clientflow.aviso@gmail.com';
            $mail->Password = 'nrpv mvby ebuq ifvh';
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = 587;

            $mail->CharSet = 'UTF-8';

            $mail->setFrom('clientflow.aviso@gmail.com', 'ClientFlow Lembretes');
            $mail->addAddress($cliente_email, $cliente_nome);

            $mail->isHTML(true);
            $mail->Subject = "Lembrete: Pendências no Projeto {$titulo}";

            $html = "
                <div style='font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;'>
                    <h2 style='color: #4f46e5;'>Olá, {$cliente_nome}!</h2>
                    <p>Este é um lembrete automático sobre o projeto <strong>{$titulo}</strong>.</p>
                    <p>Identificamos que você ainda possui documentos ou informações pendentes para envio.</p>
                    <p style='color: #b91c1c;'><strong>O prazo limite é: {$vencimento}</strong></p>
                    
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='{$link_acesso}' style='background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;'>
                            Acessar Painel do Projeto
                        </a>
                    </div>
                    
                    <p>Por favor, acesse o link acima para enviar os itens restantes o quanto antes.</p>
                    <br>
                    <p>Atenciosamente,<br>Equipe ClientFlow</p>
                </div>
            ";

            $mail->Body = $html;
            $mail->AltBody = "Olá, {$cliente_nome}!\n\nEste é um lembrete de que você possui pendências no projeto {$titulo}.\nO prazo é: {$vencimento}.\n\nAcesse o link para enviar os documentos: {$link_acesso}\n\nAtenciosamente,\nEquipe ClientFlow";

            $mail->send();

            $stmt_upd = $conexao->prepare("UPDATE checklists SET ultima_cobranca = NOW() WHERE id = ?");
            $stmt_upd->bind_param("i", $checklist_id);
            $stmt_upd->execute();
            $stmt_upd->close();

            $enviados++;
        } catch (Exception $e) {
            error_log("Erro ao enviar e-mail para {$cliente_email}: {$mail->ErrorInfo}");
            $erros++;
        }
    }
}

$conexao->close();

header('Content-Type: application/json');
echo json_encode([
    "status" => "ok",
    "mensagem" => "Processo concluído.",
    "detalhes" => [
        "enviados" => $enviados,
        "erros" => $erros
    ]
]);
?>
