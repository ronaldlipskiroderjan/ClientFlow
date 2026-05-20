// ═══════════════════════════════════════════════════════════
//  CATEGORIAS — Base profissional de itens de checklist
// ═══════════════════════════════════════════════════════════
const CATEGORIAS = [
    {
        id: 'identidade_visual',
        nome: 'Identidade Visual e Branding',
        icon: 'fa-palette',
        cor: '#4f46e5',
        itens: [
            { nome: 'Logotipo (Alta Resolução)', descricao: 'Arquivos em vetor (.ai, .eps, .svg) ou .png com fundo transparente. Versões principal, monocromática e responsiva.', tipo: 'image', allowed_extensions: 'png' },
            { nome: 'Manual da Marca (Brandbook)', descricao: 'Documento com diretrizes de aplicação da marca: uso de cores, fontes e elementos gráficos.', tipo: 'file', allowed_extensions: 'pdf' },
            { nome: 'Paleta de Cores Oficial', descricao: 'Selecione as cores da paleta oficial da sua marca.', tipo: 'color_palette' },
            { nome: 'Tipografia (Fontes)', descricao: 'Arquivos das fontes originais (.ttf, .otf) ou links para fontes web (ex: Google Fonts).', tipo: 'file', allowed_extensions: 'zip' },
            { nome: 'Elementos Gráficos Adicionais', descricao: 'Ícones, texturas, grafismos, padrões ou mascotes da marca.', tipo: 'image', allowed_extensions: 'png' },
        ]
    },
    {
        id: 'copywriting',
        nome: 'Conteúdo em Texto (Copywriting)',
        icon: 'fa-file-lines',
        cor: '#0891b2',
        itens: [
            { nome: 'Textos Institucionais', descricao: '"Quem Somos", "Nossa História", "Missão, Visão e Valores" da empresa.', tipo: 'long_text' },
            { nome: 'Produtos e Serviços', descricao: 'Descrição detalhada do que a empresa vende, especificações técnicas, preços e diferenciais.', tipo: 'long_text' },
            { nome: 'Informações de Contato', descricao: 'Endereços físicos, telefones, WhatsApp, e-mail de atendimento e horários de funcionamento.', tipo: 'long_text' },
            { nome: 'Provas Sociais (Depoimentos)', descricao: 'Depoimentos de clientes, cases de sucesso e prêmios recebidos.', tipo: 'file', allowed_extensions: 'pdf' },
            { nome: 'FAQ (Perguntas Frequentes)', descricao: 'Dúvidas mais comuns dos clientes para alimentar sites e chatbots.', tipo: 'long_text' },
            { nome: 'Artigos e Blog Posts', descricao: 'Textos finalizados para migração de blog existente.', tipo: 'file', allowed_extensions: 'pdf' },
        ]
    },
    {
        id: 'midias',
        nome: 'Mídias (Imagens, Vídeos e Áudios)',
        icon: 'fa-photo-film',
        cor: '#7c3aed',
        itens: [
            { nome: 'Fotografias Institucionais', descricao: 'Fotos do escritório, fachada, equipe trabalhando e líderes. Alta resolução.', tipo: 'image', allowed_extensions: 'jpg,jpeg' },
            { nome: 'Fotografias de Produtos', descricao: 'Imagens em alta resolução com fundo neutro (e-commerce) ou ambientadas.', tipo: 'image', allowed_extensions: 'jpg,jpeg' },
            { nome: 'Vídeos', descricao: 'Institucionais, explicativos, demonstrações de produto ou depoimentos em vídeo.', tipo: 'file', allowed_extensions: 'mp4' },
            { nome: 'Áudios e Jingles', descricao: 'Músicas de marca, vinhetas ou áudios específicos para o projeto.', tipo: 'file', allowed_extensions: 'mp3' },
        ]
    },
    {
        id: 'documentacao_legal',
        nome: 'Documentação Legal e Administrativa',
        icon: 'fa-scale-balanced',
        cor: '#b45309',
        itens: [
            { nome: 'Termos de Uso e Política de Privacidade', descricao: 'Documentos jurídicos adequados à LGPD/GDPR, elaborados por advogado.', tipo: 'file', allowed_extensions: 'pdf' },
            { nome: 'Informações Fiscais / Contratuais', descricao: 'Razão Social, CNPJ, Inscrição Estadual — necessários para domínio e notas fiscais.', tipo: 'text' },
            { nome: 'Licenças de Uso de Mídia', descricao: 'Comprovantes de direitos autorais para imagens ou músicas adquiridas pelo cliente.', tipo: 'file', allowed_extensions: 'pdf' },
        ]
    },
    {
        id: 'acessos',
        nome: 'Acessos e Credenciais',
        icon: 'fa-key',
        cor: '#dc2626',
        itens: [
            { nome: 'Registro de Domínio', descricao: 'Acesso ao painel do domínio (Registro.br, GoDaddy, Cloudflare, etc.).', tipo: 'text' },
            { nome: 'Hospedagem Atual', descricao: 'Credenciais do servidor/hospedagem (cPanel, AWS, HostGator, etc.).', tipo: 'text' },
            { nome: 'Meta Business Manager', descricao: 'Acesso ao gerenciador de negócios do Facebook/Instagram.', tipo: 'text' },
            { nome: 'Redes Sociais', descricao: 'Acessos de LinkedIn, TikTok, X (Twitter), Pinterest, YouTube, etc.', tipo: 'text' },
            { nome: 'Google (Ads / Analytics / Tag Manager / Search Console)', descricao: 'Adicionar o e-mail da agência como administrador nas ferramentas Google.', tipo: 'text' },
            { nome: 'Google Meu Negócio', descricao: 'Acesso ao Perfil de Empresa no Google Maps.', tipo: 'text' },
            { nome: 'Lojas de Aplicativos (App Store / Play Store)', descricao: 'Apple Developer Program e/ou Google Play Console.', tipo: 'text' },
            { nome: 'Gateway de Pagamento', descricao: 'Pagar.me, Mercado Pago, Stripe, PayPal ou similar.', tipo: 'text' },
            { nome: 'E-mail Marketing / CRM', descricao: 'RD Station, Mailchimp, ActiveCampaign ou similar.', tipo: 'text' },
        ]
    },
    {
        id: 'estrategia',
        nome: 'Estratégia e Dados de Negócio',
        icon: 'fa-chart-line',
        cor: '#059669',
        itens: [
            { nome: 'Persona / Público-Alvo', descricao: 'Documento mapeando quem é o cliente ideal: perfil demográfico, dores e comportamentos.', tipo: 'file', allowed_extensions: 'pdf' },
            { nome: 'Lista de Concorrentes', descricao: 'Principais concorrentes diretos e indiretos para análise de mercado.', tipo: 'long_text' },
            { nome: 'Relatórios e Métricas Anteriores', descricao: 'Dados de campanhas passadas, acessos ao site ou taxas de conversão.', tipo: 'file', allowed_extensions: 'pdf' },
            { nome: 'Lista de Leads / Clientes (Mailing)', descricao: 'Base de dados em CSV/Excel para disparo de e-mail marketing para a base existente.', tipo: 'file', allowed_extensions: 'csv' },
        ]
    },
    {
        id: 'requisitos_tecnicos',
        nome: 'Requisitos Técnicos e Integrações',
        icon: 'fa-code',
        cor: '#475569',
        itens: [
            { nome: 'Documentação de APIs e Integrações', descricao: 'Manuais de integração com ERPs (Bling, Tiny, SAP), logística (Correios, Melhor Envio) ou CRMs existentes.', tipo: 'file', allowed_extensions: 'pdf' },
            { nome: 'Exportação de Banco de Dados', descricao: 'Necessário em projetos de migração (ex: Wix → WordPress), mantendo usuários e conteúdo existentes.', tipo: 'file', allowed_extensions: 'zip' },
        ]
    },
];


// ═══════════════════════════════════════════════════════════
//  ESTADO — itens selecionados
// ═══════════════════════════════════════════════════════════
let selectedItems = []; // { catId, catNome, catCor, nome, descricao, tipo, allowed_extensions }

// ═══════════════════════════════════════════════════════════
//  RENDERIZAÇÃO DO ACCORDION
// ═══════════════════════════════════════════════════════════
function renderAccordion() {
    const container = document.getElementById('categoriesAccordion');
    if (!container) return;
    container.innerHTML = '';

    CATEGORIAS.forEach((cat) => {
        const header = document.createElement('div');
        header.className = 'cat-header';
        header.dataset.catId = cat.id;
        header.innerHTML = `
            <div class="cat-icon" style="background:${cat.cor}">
                <i class="fa-solid ${cat.icon}"></i>
            </div>
            <span class="cat-title">${cat.nome}</span>
            <span class="cat-badge" id="badge-${cat.id}">0</span>
            <i class="fa-solid fa-chevron-right cat-chevron"></i>
        `;
        header.addEventListener('click', () => toggleCategory(cat.id));

        const body = document.createElement('div');
        body.className = 'cat-body';
        body.id = `body-${cat.id}`;

        cat.itens.forEach((item, idx) => {
            const checkId = `chk-${cat.id}-${idx}`;
            const configId = `cfg-${cat.id}-${idx}`;

            // ─ Row (label) ─
            const row = document.createElement('label');
            row.className = 'item-row d-flex';
            row.htmlFor = checkId;
            row.innerHTML = `
                <input type="checkbox" id="${checkId}" data-cat="${cat.id}" data-idx="${idx}">
                <div class="item-label">
                    <div class="item-name">${item.nome}</div>
                    <div class="item-desc">${item.descricao}</div>
                </div>
            `;
            row.querySelector('input').addEventListener('change', (e) => {
                onCheckboxChange(e.target, cat, item, configId);
            });
            body.appendChild(row);

            // ─ Config panel (hidden by default) ─
            const configDiv = document.createElement('div');
            configDiv.className = 'item-config';
            configDiv.id = configId;
            configDiv.innerHTML = buildConfigPanel(item);
            configDiv.querySelectorAll('input, select').forEach(el => {
                const eventName = el.tagName === 'SELECT' ? 'change' : 'input';
                el.addEventListener(eventName, () => syncConfigToState(cat.id, item.nome, configId));
            });
            body.appendChild(configDiv);
        });

        container.appendChild(header);
        container.appendChild(body);
    });
}

function toggleCategory(catId) {
    const header = document.querySelector(`.cat-header[data-cat-id="${catId}"]`);
    const body = document.getElementById(`body-${catId}`);
    if (!header || !body) return;
    const isOpen = body.classList.contains('open');
    // fechar todos
    document.querySelectorAll('.cat-body.open').forEach(b => b.classList.remove('open'));
    document.querySelectorAll('.cat-header.open').forEach(h => h.classList.remove('open'));
    if (!isOpen) {
        body.classList.add('open');
        header.classList.add('open');
    }
}

// ═══════════════════════════════════════════════════════════
//  GERENCIAMENTO DE SELEÇÃO
// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
//  CONFIG PANEL — expande abaixo do item ao marcar checkbox
// ═══════════════════════════════════════════════════════════
function buildConfigPanel(item) {
    const tipo = item.tipo || 'text';
    const TIPO_LABELS = {
        file: 'Arquivo', image: 'Imagem',
        text: 'Texto curto', long_text: 'Texto longo', url: 'Link / URL',
        color_palette: 'Paleta de Cores'
    };
    const TIPO_ICONS = {
        file: 'fa-file', image: 'fa-image',
        text: 'fa-font', long_text: 'fa-align-left', url: 'fa-link',
        color_palette: 'fa-palette'
    };

    // Controles adicionais configuráveis pelo gestor
    let controls = '';

    if (tipo === 'color_palette') {
        controls = `<p class="cfg-info-note">O cliente informará uma paleta com 4 cores (Primária, Secundária, Destaque e Apoio/Fundo) de forma interativa e com códigos hexadecimais.</p>`;
    } else if (tipo === 'url') {
        controls = `<p class="cfg-info-note">O cliente informará um link. Nenhuma configuração adicional necessária.</p>`;
    } else if (tipo === 'text' || tipo === 'long_text') {
        controls = `
            <div class="cfg-controls">
                <div class="cfg-ctrl-group">
                    <label class="cfg-ctrl-label">Mín. chars</label>
                    <input type="number" class="cfg-ctrl-input" data-field="min_chars" min="0" placeholder="—">
                </div>
                <div class="cfg-ctrl-sep">até</div>
                <div class="cfg-ctrl-group">
                    <label class="cfg-ctrl-label">Máx. chars</label>
                    <input type="number" class="cfg-ctrl-input" data-field="max_chars" min="1" placeholder="∞">
                </div>
            </div>`;
    } else if (tipo === 'file' || tipo === 'image') {
        const extOptions = tipo === 'image' ? [
            { label: 'PNG (.png)', value: 'png' },
            { label: 'JPEG / JPG (.jpg, .jpeg)', value: 'jpg,jpeg' },
            { label: 'SVG (.svg)', value: 'svg' },
            { label: 'WEBP (.webp)', value: 'webp' },
            { label: 'Adobe Illustrator (.ai)', value: 'ai' },
            { label: 'EPS (.eps)', value: 'eps' },
            { label: 'Arquivo ZIP (.zip)', value: 'zip' }
        ] : [
            { label: 'PDF (.pdf)', value: 'pdf' },
            { label: 'Word (.docx)', value: 'docx' },
            { label: 'Excel (.xlsx)', value: 'xlsx' },
            { label: 'CSV (.csv)', value: 'csv' },
            { label: 'Arquivo ZIP (.zip)', value: 'zip' },
            { label: 'Banco de Dados (.sql)', value: 'sql' },
            { label: 'Fonte TTF (.ttf)', value: 'ttf' },
            { label: 'Fonte OTF (.otf)', value: 'otf' },
            { label: 'Vídeo MP4 (.mp4)', value: 'mp4' },
            { label: 'Áudio MP3 (.mp3)', value: 'mp3' }
        ];

        let defaultVal = item.allowed_extensions || '';
        let hasMatch = false;
        extOptions.forEach(opt => {
            if (opt.value === defaultVal) hasMatch = true;
        });

        if (!hasMatch && defaultVal) {
            // Se for uma lista de formatos, normaliza para o primeiro individual
            const firstExt = defaultVal.split(',')[0].trim().toLowerCase();
            let hasFirstExtMatch = false;
            extOptions.forEach(opt => {
                if (opt.value === firstExt) hasFirstExtMatch = true;
            });
            if (hasFirstExtMatch) {
                defaultVal = firstExt;
                item.allowed_extensions = firstExt;
            } else {
                extOptions.unshift({ label: `.${firstExt.toUpperCase()}`, value: firstExt });
                defaultVal = firstExt;
                item.allowed_extensions = firstExt;
            }
        }

        controls = `
            <div class="cfg-controls">
                <div class="cfg-ctrl-group">
                    <label class="cfg-ctrl-label">Formato Aceito</label>
                    <select class="cfg-ctrl-select" data-field="allowed_extensions">
                        ${extOptions.map(opt => `<option value="${opt.value}" ${opt.value === defaultVal ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </div>
                <div class="cfg-ctrl-group ms-2">
                    <label class="cfg-ctrl-label">Tamanho máx.</label>
                    <div class="cfg-ctrl-unit-wrap">
                        <input type="number" class="cfg-ctrl-input" data-field="max_file_size_kb" min="0" placeholder="∞">
                        <span class="cfg-ctrl-unit">KB</span>
                    </div>
                </div>
            </div>`;

        if (tipo === 'image') {
            controls += `
            <div class="cfg-controls mt-2">
                <div class="cfg-ctrl-group">
                    <label class="cfg-ctrl-label">Larg. mín.</label>
                    <div class="cfg-ctrl-unit-wrap">
                        <input type="number" class="cfg-ctrl-input" data-field="min_width" min="0" placeholder="0">
                        <span class="cfg-ctrl-unit">px</span>
                    </div>
                </div>
                <div class="cfg-ctrl-sep">×</div>
                <div class="cfg-ctrl-group">
                    <label class="cfg-ctrl-label">Alt. mín.</label>
                    <div class="cfg-ctrl-unit-wrap">
                        <input type="number" class="cfg-ctrl-input" data-field="min_height" min="0" placeholder="0">
                        <span class="cfg-ctrl-unit">px</span>
                    </div>
                </div>
            </div>`;
        }
    }

    return `
        <div class="cfg-panel">
            <div class="cfg-panel-head">
                <i class="fa-solid ${TIPO_ICONS[tipo]}"></i>
                <span class="cfg-panel-type">${TIPO_LABELS[tipo]}</span>
            </div>
            ${controls ? `<div class="cfg-panel-body">${controls}</div>` : ''}
        </div>`;
}

function syncConfigToState(catId, itemNome, configId) {
    const configEl = document.getElementById(configId);
    if (!configEl) return;
    const entry = selectedItems.find(s => s.catId === catId && s.nome === itemNome);
    if (!entry) return;
    configEl.querySelectorAll('[data-field]').forEach(inp => {
        entry[inp.dataset.field] = inp.value;
    });
}

function onCheckboxChange(checkbox, cat, item, configId) {
    const configEl = configId ? document.getElementById(configId) : null;
    if (checkbox.checked) {
        selectedItems.push({
            catId: cat.id, catNome: cat.nome, catCor: cat.cor,
            nome: item.nome, descricao: item.descricao,
            tipo: item.tipo || 'text',
            allowed_extensions: item.allowed_extensions || '',
            min_chars: '', max_chars: '',
            max_file_size_kb: '', min_width: '', max_width: '', min_height: '', max_height: ''
        });
        if (configEl) configEl.classList.add('item-config-open');
    } else {
        selectedItems = selectedItems.filter(s => !(s.catId === cat.id && s.nome === item.nome));
        if (configEl) configEl.classList.remove('item-config-open');
    }
    renderSelectedPanel();
    updateCatBadge(cat.id);
}

function removeSelectedItem(catId, nome) {
    selectedItems = selectedItems.filter(s => !(s.catId === catId && s.nome === nome));
    const cat = CATEGORIAS.find(c => c.id === catId);
    if (cat) {
        const idx = cat.itens.findIndex(i => i.nome === nome);
        if (idx !== -1) {
            const chk = document.getElementById(`chk-${catId}-${idx}`);
            if (chk) chk.checked = false;
            const cfg = document.getElementById(`cfg-${catId}-${idx}`);
            if (cfg) cfg.classList.remove('item-config-open');
        }
    }
    renderSelectedPanel();
    updateCatBadge(catId);
}

function clearAll() {
    selectedItems = [];
    document.querySelectorAll('#categoriesAccordion input[type=checkbox]').forEach(c => c.checked = false);
    CATEGORIAS.forEach(cat => updateCatBadge(cat.id));
    renderSelectedPanel();
}

function updateCatBadge(catId) {
    const badge = document.getElementById(`badge-${catId}`);
    if (!badge) return;
    const count = selectedItems.filter(s => s.catId === catId).length;
    badge.textContent = count;
    badge.classList.toggle('visible', count > 0);
}

function renderSelectedPanel() {
    const list = document.getElementById('selectedItemsList');
    const empty = document.getElementById('emptySelectedState');
    const countEl = document.getElementById('selectedCount');
    const clearBtn = document.getElementById('clearAllBtn');

    countEl.textContent = selectedItems.length;
    clearBtn.classList.toggle('d-none', selectedItems.length === 0);

    // remover cards existentes (manter empty state no DOM)
    list.querySelectorAll('.selected-card').forEach(el => el.remove());

    if (selectedItems.length === 0) {
        empty.style.display = '';
        return;
    }
    empty.style.display = 'none';

    selectedItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'selected-card';
        card.innerHTML = `
            <div class="selected-dot" style="background:${item.catCor}"></div>
            <div class="flex-grow-1 overflow-hidden">
                <div class="selected-card-title text-truncate" title="${item.nome}">${item.nome}</div>
                <span class="selected-cat-badge">${item.catNome.split('(')[0].trim()}</span>
            </div>
            <button type="button" class="btn-remove-item" title="Remover">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        card.querySelector('.btn-remove-item').addEventListener('click', () => {
            removeSelectedItem(item.catId, item.nome);
        });
        list.appendChild(card);
    });
}

// ═══════════════════════════════════════════════════════════
//  COLETA DE ITENS PARA A API (compatível com o backend)
// ═══════════════════════════════════════════════════════════
function coletarItensFormulario() {
    // Sincronizar todos os config panels com o state antes de coletar
    CATEGORIAS.forEach(cat => {
        cat.itens.forEach((item, idx) => {
            syncConfigToState(cat.id, item.nome, `cfg-${cat.id}-${idx}`);
        });
    });
    return selectedItems.map(item => ({
        nome: item.nome,
        tipo: item.tipo,
        descricao: item.descricao,
        min_chars: item.min_chars || '',
        max_chars: item.max_chars || '',
        allowed_extensions: item.allowed_extensions || '',
        max_file_size_kb: item.max_file_size_kb || '',
        min_width: item.min_width || '',
        max_width: item.max_width || '',
        min_height: item.min_height || '',
        max_height: item.max_height || ''
    }));
}

// ═══════════════════════════════════════════════════════════
//  UTILITÁRIOS
// ═══════════════════════════════════════════════════════════
function getAppBasePath() {
    const marker = "/public/";
    const idx = window.location.pathname.toLowerCase().indexOf(marker);
    return idx === -1 ? "" : window.location.pathname.slice(0, idx);
}

function montarLinkCliente(token) {
    const linkInput = document.getElementById("projectLinkInput");
    const linkCard = document.getElementById("linkResultCard");
    const basePath = getAppBasePath();
    linkInput.value = `${window.location.origin}${basePath}/public/pages/cadastro.html?token=${encodeURIComponent(token)}`;
    linkCard.classList.remove("d-none");
    linkCard.scrollIntoView({ behavior: 'smooth' });
}

function atualizarHintTemplate(mensagem = "", tipo = "info") {
    const templateHint = document.getElementById("templateHint");
    if (!templateHint) return;
    templateHint.classList.remove("d-none", "alert-info", "alert-warning", "alert-success");
    if (!mensagem) { templateHint.classList.add("d-none"); return; }
    const classes = { info: "alert-info", warning: "alert-warning", success: "alert-success" };
    templateHint.classList.add(classes[tipo] || "alert-info");
    templateHint.textContent = mensagem;
}

// ═══════════════════════════════════════════════════════════
//  TEMPLATES
// ═══════════════════════════════════════════════════════════
async function listarTemplates() {
    const templateSelect = document.getElementById("templateSelect");
    const loadTemplateBtn = document.getElementById("loadTemplateBtn");
    if (!templateSelect) return;

    templateSelect.innerHTML = '<option value="">Carregando...</option>';
    const retorno = await API.get("template_listar.php");
    if (!retorno || retorno.status !== "ok") {
        templateSelect.innerHTML = '<option value="">Nenhum template</option>';
        if (loadTemplateBtn) loadTemplateBtn.disabled = true;
        return;
    }
    const templates = Array.isArray(retorno.data) ? retorno.data : [];
    templateSelect.innerHTML = '<option value="">Selecione um template...</option>';
    templates.forEach(t => {
        const opt = document.createElement("option");
        opt.value = String(t.id);
        opt.textContent = `${t.nome} (${t.quantidade_itens || 0} itens)`;
        templateSelect.appendChild(opt);
    });
    if (loadTemplateBtn) loadTemplateBtn.disabled = templates.length === 0;
    if (!templates.length) atualizarHintTemplate("Você ainda não possui templates salvos.", "info");
    else atualizarHintTemplate("");
}

async function salvarComoTemplate() {
    const saveTemplateBtn = document.getElementById("saveTemplateBtn");
    const nomeTemplate = document.getElementById("templateNameInput")?.value.trim() || "";
    const descricaoTemplate = document.getElementById("templateDescriptionInput")?.value.trim() || "";
    if (!nomeTemplate) { Toast.warning("Informe um nome para o template."); return; }
    const itens = coletarItensFormulario();
    if (!itens.length) { Toast.warning("Selecione pelo menos um item para salvar o template."); return; }
    if (saveTemplateBtn) {
        saveTemplateBtn.disabled = true;
        saveTemplateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i>Salvando...';
    }
    try {
        const retorno = await API.post("template_salvar.php", { nome: nomeTemplate, descricao: descricaoTemplate, itens: JSON.stringify(itens) });
        if (!retorno || retorno.status !== "ok") { Toast.error((retorno && retorno.mensagem) || "Erro ao salvar template."); return; }
        document.getElementById("templateNameInput").value = "";
        document.getElementById("templateDescriptionInput").value = "";
        atualizarHintTemplate(`Template "${retorno.data?.nome || nomeTemplate}" salvo!`, "success");
        await listarTemplates();
    } catch (e) { Toast.error("Erro ao salvar template."); }
    finally {
        if (saveTemplateBtn) {
            saveTemplateBtn.disabled = false;
            saveTemplateBtn.innerHTML = '<i class="fa-solid fa-floppy-disk me-1"></i>Salvar Template';
        }
    }
}

async function criarChecklistPorTemplate() {
    const loadTemplateBtn = document.getElementById("loadTemplateBtn");
    const templateSelect = document.getElementById("templateSelect");
    const templateId = templateSelect?.value || "";
    if (!templateId) { Toast.warning("Selecione um template."); return; }
    const titulo = document.getElementById("projectTitle").value.trim();
    if (!titulo) { Toast.warning("Informe o título do projeto antes de carregar o template."); return; }
    if (loadTemplateBtn) {
        loadTemplateBtn.disabled = true;
        loadTemplateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i>Criando...';
    }
    try {
        const retorno = await API.post("template_carregar.php", { template_id: templateId, titulo, descricao: document.getElementById("projectDescription").value.trim() });
        if (!retorno || retorno.status !== "ok") { Toast.error((retorno && retorno.mensagem) || "Erro ao criar checklist."); return; }
        const token = retorno.data?.link_hash || "";
        montarLinkCliente(token);
        atualizarHintTemplate("Checklist criado a partir do template!", "success");
    } catch (e) { Toast.error("Erro ao criar checklist a partir do template."); }
    finally {
        if (loadTemplateBtn) {
            loadTemplateBtn.disabled = false;
            loadTemplateBtn.innerHTML = '<i class="fa-solid fa-clone me-1"></i>Carregar';
        }
    }
}

// ═══════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", async () => {
    await SidebarManager.init();
    const sessao = await Auth.validateSession();
    if (!sessao) { window.location.href = "login.html"; return; }
    if (!Auth.hasAccess('perm_criar_projetos')) {
        Toast.error('Você não tem permissão para criar formulários.');
        window.location.href = 'checklists.html';
        return;
    }

    // Montar accordion
    renderAccordion();
    renderSelectedPanel();

    // Abrir primeira categoria por padrão
    toggleCategory(CATEGORIAS[0].id);

    // Limpar tudo
    document.getElementById("clearAllBtn")?.addEventListener("click", clearAll);

    // Templates
    const canUseTemplates = sessao.tipo !== "client" && Auth.hasAccess("perm_criar_projetos");
    if (!canUseTemplates) {
        document.getElementById("templateManagerCard")?.classList.add("d-none");
    } else {
        const templateSelect = document.getElementById("templateSelect");
        const loadTemplateBtn = document.getElementById("loadTemplateBtn");
        const saveTemplateBtn = document.getElementById("saveTemplateBtn");

        templateSelect?.addEventListener("change", () => {
            if (loadTemplateBtn) loadTemplateBtn.disabled = !templateSelect.value;
        });
        saveTemplateBtn?.addEventListener("click", salvarComoTemplate);
        loadTemplateBtn?.addEventListener("click", criarChecklistPorTemplate);
        if (loadTemplateBtn) loadTemplateBtn.disabled = true;
        await listarTemplates();
    }

    // Submit
    const form = document.getElementById("formBuilderForm");
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const titulo = document.getElementById("projectTitle").value.trim();
        const descricao = document.getElementById("projectDescription").value.trim();
        const emailCliente = document.getElementById("clientEmail").value.trim();
        const dataVencimento = document.getElementById("projectDueDate").value;
        const frequenciaLembretes = document.getElementById("projectReminderFrequency").value;
        const itens = coletarItensFormulario();

        if (!emailCliente) { Toast.warning("Informe o e-mail do cliente."); return; }
        if (!itens.length) { Toast.warning("Selecione pelo menos um item do projeto."); return; }

        const submitBtn = form.querySelector('button[type=submit]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Gerando...';

        const retorno = await API.post("checklist_criar.php", {
            titulo,
            descricao,
            email_cliente: emailCliente,
            data_vencimento: dataVencimento,
            frequencia_cobranca_dias: frequenciaLembretes,
            itens: JSON.stringify(itens)
        });

        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane me-2"></i>Gerar Link para Cliente';

        if (retorno.status !== "ok") { Toast.error(retorno.mensagem || "Erro ao criar formulário."); return; }
        const token = retorno.data?.link_hash || "";
        montarLinkCliente(token);
    });

    // Copiar link
    const copyLinkBtn = document.getElementById("copyLinkBtn");
    const linkInput = document.getElementById("projectLinkInput");
    copyLinkBtn?.addEventListener("click", async () => {
        if (!linkInput.value) return;
        await navigator.clipboard.writeText(linkInput.value);
        copyLinkBtn.innerHTML = '<i class="fas fa-check me-1"></i>Copiado!';
        setTimeout(() => { copyLinkBtn.innerHTML = '<i class="fa-solid fa-copy me-1"></i>Copiar'; }, 1500);
    });
});
