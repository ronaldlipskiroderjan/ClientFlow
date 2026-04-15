CREATE DATABASE IF NOT EXISTS clientflow COLLATE utf8mb4_general_ci;
USE clientflow;

CREATE TABLE IF NOT EXISTS administradores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefone VARCHAR(20) NULL,
    senha VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_empresa VARCHAR(150) NOT NULL,
    nome_contato_juridico VARCHAR(150) NULL,
    email_contato_juridico VARCHAR(100) NULL,
    telefone_contato_juridico VARCHAR(20) NULL,
    cnpj VARCHAR(18) UNIQUE NULL,
    telefone VARCHAR(20) NULL,
    site VARCHAR(255) NULL,
    descricao TEXT NULL,
    logo_path VARCHAR(255) NULL,
    plano ENUM('Gold', 'Platinum', 'Diamond') DEFAULT 'Gold',
    status_conta ENUM('Ativa', 'Inativa', 'Bloqueada') DEFAULT 'Ativa',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    tipo ENUM('client', 'freelancer', 'agency', 'agency_member', 'admin') NOT NULL,
    telefone VARCHAR(20) NULL,
    documento VARCHAR(20) NULL,
    data_nascimento DATE NULL,
    nome_empresa VARCHAR(150) NULL,
    nome_responsavel VARCHAR(150) NULL,
    status_conta ENUM('aprovado', 'pendente', 'banido') DEFAULT 'aprovado',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios_agencia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agencia_id INT NOT NULL,
    usuario_id INT NOT NULL,
    papel ENUM('admin_agencia', 'gerente', 'dev', 'gestor_cliente', 'financeiro') NOT NULL DEFAULT 'dev',
    telefone VARCHAR(20) NULL,
    perm_ver_clientes TINYINT(1) NOT NULL DEFAULT 0,
    perm_criar_clientes TINYINT(1) NOT NULL DEFAULT 0,
    perm_ver_projetos TINYINT(1) NOT NULL DEFAULT 1,
    perm_criar_projetos TINYINT(1) NOT NULL DEFAULT 0,
    perm_designar_projetos TINYINT(1) NOT NULL DEFAULT 0,
    perm_financeiro TINYINT(1) NOT NULL DEFAULT 0,
    perm_gerenciar_membros TINYINT(1) NOT NULL DEFAULT 0,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_usuario_agencia (agencia_id, usuario_id),
    FOREIGN KEY (agencia_id) REFERENCES agencias(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agencia_id INT NOT NULL,
    usuario_id INT UNIQUE NULL,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefone VARCHAR(20) NULL,
    senha VARCHAR(255) NOT NULL,
    empresa VARCHAR(100) NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agencia_id) REFERENCES agencias(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS checklists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agencia_id INT NULL,
    cliente_id INT NULL,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT NULL,
    link_hash VARCHAR(64) UNIQUE NOT NULL, 
    status ENUM('Aberto', 'Encerrado') DEFAULT 'Aberto',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agencia_id) REFERENCES agencias(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS projetos_membros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    checklist_id INT NOT NULL,
    usuario_agencia_id INT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_designacao (checklist_id, usuario_agencia_id),
    FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_agencia_id) REFERENCES usuarios_agencia(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS itens_checklist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    checklist_id INT NOT NULL,
    nome_item VARCHAR(150) NOT NULL,
    descricao_item TEXT NULL,
    formato_esperado VARCHAR(50) DEFAULT 'text',
    min_chars INT NULL,
    max_chars INT NULL,
    allowed_extensions VARCHAR(255) NULL,
    max_file_size_kb INT NULL,
    min_width INT NULL,
    max_width INT NULL,
    min_height INT NULL,
    max_height INT NULL,
    status ENUM('pending', 'review', 'approved', 'rejected') DEFAULT 'pending',
    resposta_texto TEXT NULL,
    arquivo_path VARCHAR(255) NULL,
    motivo_rejeicao TEXT NULL,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mensagens_checklist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    checklist_id INT NOT NULL,
    remetente_usuario_id INT NOT NULL,
    mensagem TEXT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE,
    FOREIGN KEY (remetente_usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contratos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agencia_id INT NOT NULL,
    cliente_id INT NOT NULL,
    checklist_id INT NULL,
    titulo VARCHAR(200) NOT NULL,
    descricao_servico TEXT NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    qtd_parcelas INT NOT NULL DEFAULT 1,
    data_inicio DATE NOT NULL,
    data_prazo DATE NOT NULL,
    data_vencimento_pagamento DATE NOT NULL,
    forma_pagamento VARCHAR(100) NULL,
    status_pagamento ENUM('pendente', 'pago', 'atrasado', 'cancelado') DEFAULT 'pendente',
    status_projeto ENUM('em_andamento', 'concluido', 'pausado', 'cancelado') DEFAULT 'em_andamento',
    observacoes TEXT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (agencia_id) REFERENCES agencias(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS templates_checklist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agencia_id INT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT NULL,
    itens JSON NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_template_agencia_nome (agencia_id, nome),
    FOREIGN KEY (agencia_id) REFERENCES agencias(id) ON DELETE CASCADE
);
