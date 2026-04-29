-- Data Migration: Unificar Freelancer e Agency
-- Este script deve ser executado APÓS migration_planos.sql

-- 1. Converter todos os usuários com tipo 'freelancer' para 'agency'
UPDATE usuarios SET tipo = 'agency' WHERE tipo = 'freelancer';

-- 2. Criar assinaturas de planos para todas as agências existentes
-- Atribuir plano 'individual' para agências com apenas 1 colaborador ativo
-- Atribuir plano 'profissional' para agências com 2-10 colaboradores
-- Atribuir plano 'enterprise' para agências com mais de 10 colaboradores

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

-- 3. Inicializar registro de uso de recursos para cada agência
INSERT INTO uso_recursos_agencia (agencia_id, total_colaboradores, total_projetos)
SELECT 
    a.id,
    (SELECT COUNT(DISTINCT usuario_id) FROM usuarios_agencia WHERE agencia_id = a.id AND ativo = 1),
    (SELECT COUNT(*) FROM checklists WHERE agencia_id = a.id)
FROM agencias a
LEFT JOIN uso_recursos_agencia ura ON a.id = ura.agencia_id
WHERE ura.id IS NULL;
