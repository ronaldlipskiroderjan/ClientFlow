<?php

function cf_bootstrap_planos(mysqli $conexao, int $agencia_id): void {
    $sql_tipos = "
        CREATE TABLE IF NOT EXISTS tipos_planos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nome VARCHAR(50) UNIQUE NOT NULL,
            descricao TEXT NULL,
            preco_mensal DECIMAL(8, 2) NOT NULL,
            preco_anual DECIMAL(8, 2) NULL,
            limite_colaboradores INT NOT NULL,
            limite_projetos INT NOT NULL,
            limite_armazenamento_gb INT NOT NULL,
            ativo TINYINT(1) DEFAULT 1,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ";

    $sql_assinaturas = "
        CREATE TABLE IF NOT EXISTS assinaturas_planos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            agencia_id INT NOT NULL UNIQUE,
            tipo_plano_id INT NOT NULL,
            data_inicio DATE NOT NULL,
            data_renovacao DATE NULL,
            data_cancelamento DATE NULL,
            status ENUM('ativa', 'cancelada', 'suspensa') DEFAULT 'ativa',
            tipo_renovacao ENUM('mensal', 'anual') DEFAULT 'mensal',
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (agencia_id) REFERENCES agencias(id) ON DELETE CASCADE,
            FOREIGN KEY (tipo_plano_id) REFERENCES tipos_planos(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ";

    $sql_uso = "
        CREATE TABLE IF NOT EXISTS uso_recursos_agencia (
            id INT AUTO_INCREMENT PRIMARY KEY,
            agencia_id INT NOT NULL UNIQUE,
            total_colaboradores INT DEFAULT 0,
            total_projetos INT DEFAULT 0,
            armazenamento_usado_mb INT DEFAULT 0,
            data_calculo TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (agencia_id) REFERENCES agencias(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ";

    if (!$conexao->query($sql_tipos)) {
        throw new Exception("Falha ao preparar estrutura de planos (tipos_planos).");
    }

    if (!$conexao->query($sql_assinaturas)) {
        throw new Exception("Falha ao preparar estrutura de planos (assinaturas_planos).");
    }

    if (!$conexao->query($sql_uso)) {
        throw new Exception("Falha ao preparar estrutura de planos (uso_recursos_agencia).");
    }

    $planos_default = [
        ["individual", "Plano individual - apenas um acesso", 0.00, 0.00, 1, 10, 5],
        ["basico", "Plano basico para pequenos negocios", 49.00, 490.00, 3, 25, 20],
        ["profissional", "Plano profissional para agencias em crescimento", 99.00, 990.00, 10, 100, 100],
        ["enterprise", "Plano enterprise - sem limites", 299.00, 2990.00, 999999, 999999, 1000],
    ];

    $sql_upsert_plano = "
        INSERT INTO tipos_planos
            (nome, descricao, preco_mensal, preco_anual, limite_colaboradores, limite_projetos, limite_armazenamento_gb, ativo)
        VALUES
            (?, ?, ?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE
            descricao = VALUES(descricao),
            preco_mensal = VALUES(preco_mensal),
            preco_anual = VALUES(preco_anual),
            limite_colaboradores = VALUES(limite_colaboradores),
            limite_projetos = VALUES(limite_projetos),
            limite_armazenamento_gb = VALUES(limite_armazenamento_gb),
            ativo = 1
    ";

    $stmt_plano = $conexao->prepare($sql_upsert_plano);
    if (!$stmt_plano) {
        throw new Exception("Falha ao preparar planos padrao.");
    }

    foreach ($planos_default as $plano) {
        [$nome, $descricao, $preco_mensal, $preco_anual, $limite_colaboradores, $limite_projetos, $limite_armazenamento_gb] = $plano;
        $stmt_plano->bind_param(
            "ssddiii",
            $nome,
            $descricao,
            $preco_mensal,
            $preco_anual,
            $limite_colaboradores,
            $limite_projetos,
            $limite_armazenamento_gb
        );

        if (!$stmt_plano->execute()) {
            $stmt_plano->close();
            throw new Exception("Falha ao registrar planos padrao.");
        }
    }
    $stmt_plano->close();

    $sql_plano_individual = "SELECT id FROM tipos_planos WHERE nome = 'individual' LIMIT 1";
    $res_plano_individual = $conexao->query($sql_plano_individual);
    if (!$res_plano_individual || $res_plano_individual->num_rows === 0) {
        throw new Exception("Plano individual nao encontrado.");
    }
    $plano_individual_id = (int) $res_plano_individual->fetch_assoc()["id"];

    $stmt_assinatura = $conexao->prepare("SELECT id FROM assinaturas_planos WHERE agencia_id = ? LIMIT 1");
    if (!$stmt_assinatura) {
        throw new Exception("Falha ao validar assinatura da agencia.");
    }
    $stmt_assinatura->bind_param("i", $agencia_id);
    $stmt_assinatura->execute();
    $res_assinatura = $stmt_assinatura->get_result();
    $tem_assinatura = $res_assinatura && $res_assinatura->num_rows > 0;
    $stmt_assinatura->close();

    if (!$tem_assinatura) {
        $stmt_insert_assinatura = $conexao->prepare(
            "INSERT INTO assinaturas_planos (agencia_id, tipo_plano_id, data_inicio, data_renovacao, status, tipo_renovacao)
             VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 MONTH), 'ativa', 'mensal')"
        );

        if (!$stmt_insert_assinatura) {
            throw new Exception("Falha ao criar assinatura inicial da agencia.");
        }

        $stmt_insert_assinatura->bind_param("ii", $agencia_id, $plano_individual_id);
        if (!$stmt_insert_assinatura->execute()) {
            $stmt_insert_assinatura->close();
            throw new Exception("Falha ao persistir assinatura inicial da agencia.");
        }
        $stmt_insert_assinatura->close();
    }

    $total_colaboradores = 0;
    $total_projetos = 0;

    $stmt_colaboradores = $conexao->prepare("SELECT COUNT(DISTINCT usuario_id) AS total FROM usuarios_agencia WHERE agencia_id = ? AND ativo = 1");
    if ($stmt_colaboradores) {
        $stmt_colaboradores->bind_param("i", $agencia_id);
        $stmt_colaboradores->execute();
        $res_colaboradores = $stmt_colaboradores->get_result();
        if ($res_colaboradores && $res_colaboradores->num_rows > 0) {
            $total_colaboradores = (int) ($res_colaboradores->fetch_assoc()["total"] ?? 0);
        }
        $stmt_colaboradores->close();
    }

    $stmt_projetos = $conexao->prepare("SELECT COUNT(*) AS total FROM checklists WHERE agencia_id = ?");
    if ($stmt_projetos) {
        $stmt_projetos->bind_param("i", $agencia_id);
        $stmt_projetos->execute();
        $res_projetos = $stmt_projetos->get_result();
        if ($res_projetos && $res_projetos->num_rows > 0) {
            $total_projetos = (int) ($res_projetos->fetch_assoc()["total"] ?? 0);
        }
        $stmt_projetos->close();
    }

    $stmt_uso = $conexao->prepare(
        "INSERT INTO uso_recursos_agencia (agencia_id, total_colaboradores, total_projetos, armazenamento_usado_mb)
         VALUES (?, ?, ?, 0)
         ON DUPLICATE KEY UPDATE
            total_colaboradores = VALUES(total_colaboradores),
            total_projetos = VALUES(total_projetos),
            data_calculo = CURRENT_TIMESTAMP"
    );

    if (!$stmt_uso) {
        throw new Exception("Falha ao atualizar uso de recursos da agencia.");
    }

    $stmt_uso->bind_param("iii", $agencia_id, $total_colaboradores, $total_projetos);
    if (!$stmt_uso->execute()) {
        $stmt_uso->close();
        throw new Exception("Falha ao registrar uso de recursos da agencia.");
    }
    $stmt_uso->close();
}
