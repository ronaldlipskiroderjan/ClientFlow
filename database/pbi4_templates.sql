CREATE TABLE IF NOT EXISTS templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agencia_usuario_id INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descricao TEXT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agencia_usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS template_itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT NOT NULL,
    nome_item VARCHAR(150) NOT NULL,
    descricao_item TEXT NULL,
    formato_esperado VARCHAR(50) DEFAULT 'text', -- text, long_text, file, image, url
    min_chars INT NULL,
    max_chars INT NULL,
    allowed_extensions VARCHAR(255) NULL, -- Ex: "jpg,png,pdf"
    finalidade_lgpd TEXT NOT NULL, -- OBRIGATÓRIO PARA LGPD
    obrigatorio TINYINT(1) DEFAULT 1,
    ordem INT DEFAULT 0,
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;