<?php

$servidor = "127.0.0.1:3306";
$usuario  = "root";
$senha    = "";
$nome_banco = "clientflow";

$conexao = new mysqli($servidor, $usuario, $senha, $nome_banco);

if ($conexao->connect_error) {
    die("Falha na conexão: " . $conexao->connect_error);
}

$conexao->set_charset("utf8mb4");

function atualizar_status_checklist($conexao, $checklist_id) {
    if (!$checklist_id) return;
    
    $query = "SELECT status FROM itens_checklist WHERE checklist_id = ?";
    $stmt = $conexao->prepare($query);
    $stmt->bind_param("i", $checklist_id);
    $stmt->execute();
    $res = $stmt->get_result();
    
    if ($res->num_rows === 0) {
        $stmt->close();
        return;
    }
    
    $total = 0;
    $aprovados = 0;
    $em_revisao = 0;
    
    while ($row = $res->fetch_assoc()) {
        $total++;
        if ($row['status'] === 'approved') $aprovados++;
        if ($row['status'] === 'review') $em_revisao++;
    }
    $stmt->close();
    
    $novo_status = 'pending';
    if ($aprovados === $total && $total > 0) {
        $novo_status = 'approved';
    } elseif ($aprovados > 0 || $em_revisao > 0) {
        $novo_status = 'review';
    }
    
    $update = $conexao->prepare("UPDATE checklists SET status = ? WHERE id = ?");
    $update->bind_param("si", $novo_status, $checklist_id);
    $update->execute();
    $update->close();
}
?>
