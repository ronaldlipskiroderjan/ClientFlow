-- ============================================================================
-- CONSOLIDAÇÃO: Simplificação ClientFlow - Migration Completa
-- ============================================================================
-- Este arquivo contém TODOS os scripts SQL necessários
-- Copie e cole TUDO de uma vez no phpMyAdmin ou MySQL client
-- ============================================================================

-- ===========================================================================
-- PARTE 1: Criar Novas Tabelas de Planos
-- ===========================================================================

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
);

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
);

CREATE TABLE IF NOT EXISTS uso_recursos_agencia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agencia_id INT NOT NULL UNIQUE,
    total_colaboradores INT DEFAULT 0,
    total_projetos INT DEFAULT 0,
    armazenamento_usado_mb INT DEFAULT 0,
    data_calculo TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agencia_id) REFERENCES agencias(id) ON DELETE CASCADE
);

-- Criar índices para melhorar performance
CREATE INDEX idx_assinaturas_agencia ON assinaturas_planos(agencia_id);
CREATE INDEX idx_assinaturas_tipo_plano ON assinaturas_planos(tipo_plano_id);
CREATE INDEX idx_assinaturas_status ON assinaturas_planos(status);

-- ===========================================================================
-- PARTE 2: Modificar Tabelas Existentes
-- ===========================================================================

-- Remover coluna 'plano' de agencias (será controlada por assinaturas_planos)
ALTER TABLE agencias DROP COLUMN IF EXISTS plano;

-- Converter usuários 'freelancer' para 'agency'
UPDATE usuarios SET tipo = 'agency' WHERE tipo = 'freelancer';

-- Modificar tipo de usuário para remover 'freelancer' do ENUM
ALTER TABLE usuarios MODIFY tipo ENUM('client', 'agency', 'agency_member', 'admin') NOT NULL;

-- ===========================================================================
-- PARTE 3: Inserir Tipos de Planos Padrão
-- ===========================================================================

INSERT INTO tipos_planos (nome, descricao, preco_mensal, preco_anual, limite_colaboradores, limite_projetos, limite_armazenamento_gb) VALUES
('individual', 'Plano individual - apenas um acesso', 0.00, 0.00, 1, 10, 5),
('basico', 'Plano básico para pequenos negócios', 49.00, 490.00, 3, 25, 20),
('profissional', 'Plano profissional para agências em crescimento', 99.00, 990.00, 10, 100, 100),
('enterprise', 'Plano enterprise - sem limites', 299.00, 2990.00, 999999, 999999, 1000);

-- ===========================================================================
-- PARTE 4: Migrar Dados Existentes
-- ===========================================================================

-- 4.1: Criar assinaturas de planos para todas as agências existentes
INSERT INTO assinaturas_planos (agencia_id, tipo_plano_id, data_inicio, tipo_renovacao)
SELECT 
    a.id,
    CASE 
        WHEN (SELECT COUNT(DISTINCT usuario_id) FROM usuarios_agencia WHERE agencia_id = a.id AND ativo = 1) <= 1 THEN 
            (SELECT id FROM tipos_planos WHERE nome = 'individual')
        WHEN (SELECT COUNT(DISTINCT usuario_id) FROM usuarios_agencia WHERE agencia_id = a.id AND ativo = 1) <= 10 THEN 
            (SELECT id FROM tipos_planos WHERE nome = 'profissional')
        ELSE 
            (SELECT id FROM tipos_planos WHERE nome = 'enterprise')
    END as tipo_plano_id,
    CURDATE(),
    'mensal'
FROM agencias a
LEFT JOIN assinaturas_planos ap ON a.id = ap.agencia_id
WHERE ap.id IS NULL;

-- 4.2: Inicializar registro de uso de recursos para cada agência
INSERT INTO uso_recursos_agencia (agencia_id, total_colaboradores, total_projetos)
SELECT 
    a.id,
    (SELECT COUNT(DISTINCT usuario_id) FROM usuarios_agencia WHERE agencia_id = a.id AND ativo = 1),
    (SELECT COUNT(*) FROM checklists WHERE agencia_id = a.id)
FROM agencias a
LEFT JOIN uso_recursos_agencia ura ON a.id = ura.agencia_id
WHERE ura.id IS NULL;

-- ===========================================================================
-- VALIDAÇÃO
-- ===========================================================================

-- Execute estas queries para validar a migração:

-- 1. Verificar tipos de planos
-- SELECT * FROM tipos_planos;

-- 2. Verificar assinaturas criadas
-- SELECT ap.id, ap.agencia_id, tp.nome, ap.status 
-- FROM assinaturas_planos ap
-- JOIN tipos_planos tp ON ap.tipo_plano_id = tp.id;

-- 3. Verificar que não há mais 'freelancer'
-- SELECT tipo, COUNT(*) as quantidade FROM usuarios GROUP BY tipo;

-- 4. Verificar uso de recursos
-- SELECT * FROM uso_recursos_agencia LIMIT 5;

-- ===========================================================================
-- FIM DA MIGRAÇÃO
-- ===========================================================================
