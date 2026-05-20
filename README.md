# ClientFlow

Micro-SaaS B2B de coleta estruturada de materiais com autenticação completa e vínculo seguro de conta. Agências e prestadores de serviço criam checklists dinâmicos, geram links de acesso únicos e acompanham o status de cada entrega em tempo real — eliminando a dependência de WhatsApp, e-mail e pastas compartilhadas.

---

## Tecnologias

![PHP](https://img.shields.io/badge/PHP-8%2B-777BB4?logo=php&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8%2B-4479A1?logo=mysql&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?logo=bootstrap&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=black)

| Camada | Tecnologia |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (Vanilla) |
| Estilização | Bootstrap 5.3.2, Font Awesome 6.4.2, Google Fonts (Inter) |
| Backend | PHP 8+ (API REST) |
| Banco de Dados | MySQL 8+ |

---

## Funcionalidades

### Prestador de Serviço
- Cadastro com CPF (PF) ou CNPJ (PJ)
- Criação de checklists com itens tipados (texto, URL, arquivo, imagem, cor)
- Geração de link único de coleta vinculável a um cliente
- Templates reutilizáveis de checklist
- Monitoramento de status de envios em tempo real
- Aprovação e reprovação de entregas com justificativa
- Mensagens por checklist
- Gerenciamento de equipe com controle de permissões por papel
- Upgrade de plano de assinatura

### Cliente Final
- Vínculo de checklist via link único
- Upload de arquivos e respostas por item
- Acompanhamento de status de cada entrega
- Mensagens diretas com a agência

### Colaborador
- Acesso ao painel operacional conforme permissões configuradas
- Papéis disponíveis: `admin_agencia`, `gerente`, `dev`, `gestor_cliente`, `financeiro`
- Criação de checklists, gestão de templates e revisão de entregas

### Administrador do Sistema
- Listagem e filtragem de todos os usuários da plataforma
- Alteração de status de conta (aprovado, banido, desativado)
- Atualização de plano de qualquer agência

---

## Estrutura do Projeto

```
ClientFlow/
├── api/              # Endpoints PHP (API REST)
├── public/
│   ├── pages/        # Páginas HTML
│   ├── js/           # Scripts JavaScript
│   └── css/          # Estilos
├── database/
│   └── init.sql      # Script de criação do banco
└── index.html        # Landing page pública
```

---

## Equipe

| Nome |
|---|
| Bernardo Roche Moreira |
| Christopher Paterno Alves de Souza |
| Gustavo Isdra Corrêa |
| Ronald Lipski Roderjan |
| Vantuil Plaster Junior |

---

**Disciplina:** Experiência Criativa – Projetando Soluções Computacionais  
**Curso:** Bacharelado em Engenharia de Software — PUCPR — 2025  
**Orientadores:** Prof. Giulio Domenico Bordin
