CREATE DATABASE IF NOT EXISTS clientflow COLLATE utf8mb4_general_ci;
USE clientflow;

CREATE TABLE IF NOT EXISTS administradores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_gestor VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    nome_empresa VARCHAR(100) NOT NULL,
    logo_path VARCHAR(255) NULL,
    plano ENUM('Gold', 'Platinum', 'Diamond') DEFAULT 'Gold',
    status_conta ENUM('Ativa', 'Inativa', 'Bloqueada') DEFAULT 'Ativa',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    empresa VARCHAR(100) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS checklists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agencia_id INT NOT NULL,
    cliente_id INT NULL,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT NULL,
    link_hash VARCHAR(64) UNIQUE NOT NULL, 
    status ENUM('Aberto', 'Encerrado') DEFAULT 'Aberto',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agencia_id) REFERENCES agencias(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS itens_checklist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    checklist_id INT NOT NULL,
    nome_item VARCHAR(150) NOT NULL,
    descricao_item TEXT NULL,
    formato_esperado VARCHAR(50) DEFAULT 'Qualquer',
    status ENUM('Pendente', 'Enviado', 'Aprovado', 'Rejeitado') DEFAULT 'Pendente',
    arquivo_path VARCHAR(255) NULL,
    motivo_rejeicao TEXT NULL,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (checklist_id) REFERENCES checklists(id) ON DELETE CASCADE
);