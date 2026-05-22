<?php
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit('Acesso negado.');
}

include_once __DIR__ . "/db_conexao.php";

$stmt = $conexao->prepare(
    "DELETE FROM usuarios
     WHERE status_conta = 'desativado'
       AND desativacao_aceita_em IS NOT NULL
       AND desativacao_aceita_em <= NOW() - INTERVAL 180 DAY"
);

$stmt->execute();
$deletados = $stmt->affected_rows;
$stmt->close();
$conexao->close();

echo "[" . date('Y-m-d H:i:s') . "] Contas expiradas removidas: {$deletados}\n";
