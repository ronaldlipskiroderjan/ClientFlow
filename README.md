# ClientFlow

Micro-SaaS B2B de coleta estruturada de materiais com autentica├º├úo completa e v├¡nculo seguro de conta. Ag├¬ncias e prestadores de servi├ºo criam checklists din├ómicos, geram links de acesso ├║nicos e acompanham o status de cada entrega em tempo real ÔÇö eliminando a depend├¬ncia de WhatsApp, e-mail e pastas compartilhadas.

---

## Tecnologias

![PHP](https://img.shields.io/badge/PHP-8%2B-777BB4?logo=php&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8%2B-4479A1?logo=mysql&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?logo=bootstrap&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=black)

| Camada | Tecnologia |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (Vanilla) |
| Estiliza├º├úo | Bootstrap 5.3.2, Font Awesome 6.4.2, Google Fonts (Inter) |
| Backend | PHP 8+ (API REST) |
| Banco de Dados | MySQL 8+ |

---

## Funcionalidades

### Prestador de Servi├ºo
- Cadastro com CPF (PF) ou CNPJ (PJ)
- Cria├º├úo de checklists com itens tipados (texto, URL, arquivo, imagem, cor)
- Gera├º├úo de link ├║nico de coleta vincul├ível a um cliente
- Templates reutiliz├íveis de checklist
- Monitoramento de status de envios em tempo real
- Aprova├º├úo e reprova├º├úo de entregas com justificativa
- Mensagens por checklist
- Gerenciamento de equipe com controle de permiss├Áes por papel
- Upgrade de plano de assinatura

### Cliente Final
- V├¡nculo de checklist via link ├║nico
- Upload de arquivos e respostas por item
- Acompanhamento de status de cada entrega
- Mensagens diretas com a ag├¬ncia

### Colaborador
- Acesso ao painel operacional conforme permiss├Áes configuradas
- Pap├®is dispon├¡veis: `admin_agencia`, `gerente`, `dev`, `gestor_cliente`, `financeiro`
- Cria├º├úo de checklists, gest├úo de templates e revis├úo de entregas

### Administrador do Sistema
- Listagem e filtragem de todos os usu├írios da plataforma
- Altera├º├úo de status de conta (aprovado, banido, desativado)
- Atualiza├º├úo de plano de qualquer ag├¬ncia

---

## Estrutura do Projeto

```
ClientFlow/
Ôö£ÔöÇÔöÇ api/              # Endpoints PHP (API REST)
Ôö£ÔöÇÔöÇ public/
Ôöé   Ôö£ÔöÇÔöÇ pages/        # P├íginas HTML
Ôöé   Ôö£ÔöÇÔöÇ js/           # Scripts JavaScript
Ôöé   ÔööÔöÇÔöÇ css/          # Estilos
Ôö£ÔöÇÔöÇ database/
Ôöé   ÔööÔöÇÔöÇ init.sql      # Script de cria├º├úo do banco
ÔööÔöÇÔöÇ index.html        # Landing page p├║blica
```

---

## Equipe

| Nome |
|---|
| Bernardo Roche Moreira |
| Christopher Paterno Alves de Souza |
| Gustavo Isdra Corr├¬a |
| Ronald Lipski Roderjan |
| Vantuil Plaster Junior |

---

**Disciplina:** Experi├¬ncia Criativa ÔÇô Projetando Solu├º├Áes Computacionais  
**Curso:** Bacharelado em Engenharia de Software ÔÇö PUCPR ÔÇö 2025  
**Orientadores:** Prof. Giulio Domenico Bordin
