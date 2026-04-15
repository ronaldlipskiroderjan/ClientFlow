-- ============================================
-- ALTERAÇÕES DE SCHEMA - CLIENTFLOW
-- Data: 2026-04-15
-- Adição de campos faltantes: telefone e contato jurídico
-- ============================================

-- 1. Adicionar telefone em ADMINISTRADORES
ALTER TABLE administradores ADD COLUMN telefone VARCHAR(20) NULL AFTER email;

-- 2. Adicionar campos de contato jurídico em AGENCIAS
ALTER TABLE agencias ADD COLUMN nome_contato_juridico VARCHAR(150) NULL AFTER nome_empresa;
ALTER TABLE agencias ADD COLUMN email_contato_juridico VARCHAR(100) NULL AFTER nome_contato_juridico;
ALTER TABLE agencias ADD COLUMN telefone_contato_juridico VARCHAR(20) NULL AFTER email_contato_juridico;

-- 3. Adicionar telefone em CLIENTES
ALTER TABLE clientes ADD COLUMN telefone VARCHAR(20) NULL AFTER email;

-- 4. Adicionar telefone em USUARIOS_AGENCIA
ALTER TABLE usuarios_agencia ADD COLUMN telefone VARCHAR(20) NULL AFTER papel;

-- ============================================
-- Verificação - Estrutura das tabelas após alterações
-- ============================================

-- DESCRIBE administradores;
-- DESCRIBE agencias;
-- DESCRIBE clientes;
-- DESCRIBE usuarios_agencia;
