-- Migration: Unificar Freelancer + Agência em um único modelo "Prestador"
-- Adicionar sistema de Planos com limites de colaboradores, projetos e armazenamento

-- Criar tabela de tipos de planos disponíveis
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

-- Inserir tipos de planos padrão
INSERT INTO tipos_planos (nome, descricao, preco_mensal, preco_anual, limite_colaboradores, limite_projetos, limite_armazenamento_gb) VALUES
('individual', 'Plano individual - apenas um acesso', 0.00, 0.00, 1, 10, 5),
('basico', 'Plano básico para pequenos negócios', 49.00, 490.00, 3, 25, 20),
('profissional', 'Plano profissional para agências em crescimento', 99.00, 990.00, 10, 100, 100),
('enterprise', 'Plano enterprise - sem limites', 299.00, 2990.00, 999999, 999999, 1000);

-- Criar tabela de assinaturas dos planos
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

-- Alterar tabela agências para remover campo 'plano' individual
-- (será controlado através de assinaturas_planos)
ALTER TABLE agencias DROP COLUMN IF EXISTS plano;

-- Alterar tabela usuários para remover 'freelancer' do ENUM
-- Nota: se tiver dados com 'freelancer', executar UPDATE antes desta ALTER
UPDATE usuarios SET tipo = 'agency' WHERE tipo = 'freelancer';
ALTER TABLE usuarios MODIFY tipo ENUM('client', 'agency', 'agency_member', 'admin') NOT NULL;

-- Criar tabela para rastrear uso de recursos (para controle de limites)
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
