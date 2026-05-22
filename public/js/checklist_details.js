document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const checklistId = params.get("id");

    if (!checklistId) { window.location.href = "dashboard_client.html"; return; }

    if (window.SidebarManager) {
        await SidebarManager.init();
    }

    const itemsContainer = document.getElementById("items-container");
    const emptyState     = document.getElementById("empty-state");
    const navTitle       = document.getElementById("nav-project-title");

    const statusMap = {
        pending:  { badge: "bg-warning text-dark", icon: "fa-clock",                label: "Pendente" },
        review:   { badge: "bg-primary",            icon: "fa-eye",                  label: "Em Revisão" },
        approved: { badge: "bg-success",            icon: "fa-check",                label: "Aprovado" },
        rejected: { badge: "bg-danger",             icon: "fa-triangle-exclamation", label: "Reprovado – Reenviar" },
    };

    const typeIcons = {
        file: 'fa-file-arrow-up', image: 'fa-image',
        text: 'fa-font', long_text: 'fa-align-left', url: 'fa-link',
        color_palette: 'fa-palette'
    };
    const typeLabels = {
        file: 'Arquivo', image: 'Imagem',
        text: 'Texto', long_text: 'Texto longo', url: 'Link',
        color_palette: 'Paleta de Cores'
    };

    function buildAccept(t) {
        if (!t.allowed_extensions) return '';
        return t.allowed_extensions.split(',')
            .map(ext => '.' + ext.trim().toLowerCase())
            .join(',');
    }

    function buildConstraintPills(t) {

        const pills = [];
        if (t.allowed_extensions) pills.push(`<span class="constraint-pill"><i class="fa-solid fa-file me-1"></i>${t.allowed_extensions.toUpperCase()}</span>`);
        if (t.max_file_size_kb)   pills.push(`<span class="constraint-pill"><i class="fa-solid fa-weight-hanging me-1"></i>Máx ${(t.max_file_size_kb/1024).toFixed(1)} MB</span>`);
        if (t.min_chars || t.max_chars) pills.push(`<span class="constraint-pill"><i class="fa-solid fa-text-width me-1"></i>${t.min_chars||0}–${t.max_chars||'∞'} chars</span>`);
        if (t.type === 'image' && (t.min_width || t.max_width)) pills.push(`<span class="constraint-pill"><i class="fa-solid fa-expand me-1"></i>${t.min_width||0}–${t.max_width||'∞'} × ${t.min_height||0}–${t.max_height||'∞'} px</span>`);
        return pills.join('');
    }

    function criarCardItem(tarefa) {
        const s      = statusMap[tarefa.status] || statusMap.pending;
        const accept = buildAccept(tarefa);
        const locked = tarefa.status === 'approved' || tarefa.status === 'review';
        const pills  = buildConstraintPills(tarefa);
        const icon   = typeIcons[tarefa.type] || 'fa-circle-dot';
        const label  = typeLabels[tarefa.type] || tarefa.type;

        let inputArea = '';
        if (locked) {
            const value = tarefa.value || '';
            let valorExibicao = value;
            if (tarefa.type === 'color_palette' && value) {
                const cores = value.split(',').map(c => c.trim());
                const nomes = ['Primária', 'Secundária', 'Destaque', 'Fundo'];
                valorExibicao = `
                    <div style="display:flex; flex-direction:column; gap:.3rem; margin-top:.4rem;">
                        <div style="font-weight:600; font-size:.72rem; color:var(--text-secondary,#64748b); text-transform:uppercase; letter-spacing:.05em;">Cores Enviadas:</div>
                        <div style="display:flex; flex-wrap:wrap; gap:.6rem;">
                            ${cores.map((c, i) => `
                                <div style="display:flex; align-items:center; gap:.35rem; background:rgba(0,0,0,.03); padding:.2rem .4rem; border-radius:.35rem; border:1px solid rgba(0,0,0,.05);">
                                    <div style="width:14px; height:14px; border-radius:50%; background-color:${c}; border:1px solid rgba(0,0,0,.1);"></div>
                                    <span style="font-size:.7rem; font-weight:600; color:#475569;">${nomes[i]||'Apoio'}:</span>
                                    <code style="font-size:.7rem; font-weight:700; color:#0f172a;">${c.toUpperCase()}</code>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            inputArea = `
                <div class="task-submitted-state">
                    <div class="task-submitted-icon">
                        <i class="fa-solid ${tarefa.type === 'image' || tarefa.type === 'file' ? 'fa-file-circle-check' : 'fa-circle-check'}"></i>
                    </div>
                    <div class="task-submitted-text">
                        ${tarefa.type === 'image' || tarefa.type === 'file'
                            ? 'Arquivo enviado — aguardando revisão da equipe'
                            : valorExibicao}
                    </div>
                </div>`;
        } else if (tarefa.type === 'image' || tarefa.type === 'file') {
            inputArea = `
                <form class="task-form" data-id="${tarefa.id}" data-type="${tarefa.type}">
                    <div class="upload-zone" id="uz-${tarefa.id}" data-extensions="${tarefa.allowed_extensions || ''}">
                        <input type="file" class="upload-zone-input" ${accept ? `accept="${accept}"` : ''} required>
                        <div class="upload-zone-body">
                            <div class="upload-zone-icon"><i class="fa-solid ${icon}"></i></div>
                            <div class="upload-zone-text">Arraste o arquivo ou <span class="upload-zone-link">clique para selecionar</span></div>
                            ${accept ? `<div class="upload-zone-hint">${accept.replace(/\./g,'').toUpperCase()}</div>` : ''}
                        </div>
                        <div class="upload-zone-preview d-none">
                            <i class="fa-solid fa-file-circle-check upload-preview-icon"></i>
                            <span class="upload-preview-name"></span>
                            <button type="button" class="upload-preview-remove"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>
                    <div class="text-end mt-2">
                        <button class="btn-task-submit d-none" type="submit">
                            <i class="fa-solid fa-paper-plane me-1"></i>Enviar Arquivo
                        </button>
                    </div>
                </form>`;
        } else if (tarefa.type === 'long_text') {
            inputArea = `
                <form class="task-form" data-id="${tarefa.id}" data-type="${tarefa.type}">
                    <div class="textarea-wrap">
                        <textarea class="task-textarea js-char-input"
                            ${tarefa.min_chars ? `data-min="${tarefa.min_chars}"` : ''}
                            ${tarefa.max_chars ? `maxlength="${tarefa.max_chars}" data-max="${tarefa.max_chars}"` : ''}
                            placeholder="Digite sua resposta aqui..." required rows="4"></textarea>
                        <div class="char-counter">
                            <span class="char-now">0</span>${tarefa.max_chars ? `<span class="char-sep"> / ${tarefa.max_chars}</span>` : ''}
                            ${tarefa.min_chars ? `<span class="char-min-hint"> (mín. ${tarefa.min_chars})</span>` : ''}
                        </div>
                    </div>
                    <div class="text-end mt-2">
                        <button class="btn-task-submit" type="submit"><i class="fa-solid fa-paper-plane me-1"></i>Enviar Resposta</button>
                    </div>
                </form>`;
        } else if (tarefa.type === 'color_palette') {
            const defaultColors = ['#4f46e5', '#0891b2', '#f59e0b', '#1e293b'];
            let currentColors = defaultColors;
            if (tarefa.value) {
                const parts = tarefa.value.split(',').map(s => s.trim().toLowerCase());
                if (parts.length > 0) currentColors = parts;
            }
            while (currentColors.length < 4) currentColors.push('#ffffff');

            inputArea = `
                <form class="task-form task-palette-form" data-id="${tarefa.id}" data-type="${tarefa.type}">
                    <div class="palette-picker-container" style="display:flex; flex-wrap:wrap; gap:1.2rem; margin-top:.4rem;">
                        <div class="palette-picker-item" style="display:flex; flex-direction:column; gap:.25rem; min-width:100px; flex:1;">
                            <label class="palette-picker-label" style="font-size:.65rem; font-weight:700; text-transform:uppercase; color:var(--text-secondary,#64748b);">Primária</label>
                            <div class="color-swatch-wrapper" style="position:relative; width:48px; height:48px; border-radius:.5rem; overflow:hidden; border:2px solid rgba(0,0,0,.08); box-shadow:inset 0 1px 3px rgba(0,0,0,.1); background:#f8fafc;">
                                <div class="color-swatch-preview" style="position:absolute; inset:0; background-color:${currentColors[0]}; z-index:1; pointer-events:none;"></div>
                                <input type="color" class="color-picker-input" value="${currentColors[0]}" style="position:absolute; inset:0; opacity:0; width:100%; height:100%; cursor:pointer; z-index:2;">
                            </div>
                            <input type="text" class="color-hex-input" value="${currentColors[0].toUpperCase()}" maxlength="7" placeholder="#000000" style="width:100%; font-size:.75rem; font-weight:700; text-align:center; padding:.2rem .4rem; border:1px solid rgba(0,0,0,.1); border-radius:.35rem; color:#334155; text-transform:uppercase; font-family:monospace; background:var(--card-bg,#fff);">
                        </div>
                        <div class="palette-picker-item" style="display:flex; flex-direction:column; gap:.25rem; min-width:100px; flex:1;">
                            <label class="palette-picker-label" style="font-size:.65rem; font-weight:700; text-transform:uppercase; color:var(--text-secondary,#64748b);">Secundária</label>
                            <div class="color-swatch-wrapper" style="position:relative; width:48px; height:48px; border-radius:.5rem; overflow:hidden; border:2px solid rgba(0,0,0,.08); box-shadow:inset 0 1px 3px rgba(0,0,0,.1); background:#f8fafc;">
                                <div class="color-swatch-preview" style="position:absolute; inset:0; background-color:${currentColors[1]}; z-index:1; pointer-events:none;"></div>
                                <input type="color" class="color-picker-input" value="${currentColors[1]}" style="position:absolute; inset:0; opacity:0; width:100%; height:100%; cursor:pointer; z-index:2;">
                            </div>
                            <input type="text" class="color-hex-input" value="${currentColors[1].toUpperCase()}" maxlength="7" placeholder="#000000" style="width:100%; font-size:.75rem; font-weight:700; text-align:center; padding:.2rem .4rem; border:1px solid rgba(0,0,0,.1); border-radius:.35rem; color:#334155; text-transform:uppercase; font-family:monospace; background:var(--card-bg,#fff);">
                        </div>
                        <div class="palette-picker-item" style="display:flex; flex-direction:column; gap:.25rem; min-width:100px; flex:1;">
                            <label class="palette-picker-label" style="font-size:.65rem; font-weight:700; text-transform:uppercase; color:var(--text-secondary,#64748b);">Destaque</label>
                            <div class="color-swatch-wrapper" style="position:relative; width:48px; height:48px; border-radius:.5rem; overflow:hidden; border:2px solid rgba(0,0,0,.08); box-shadow:inset 0 1px 3px rgba(0,0,0,.1); background:#f8fafc;">
                                <div class="color-swatch-preview" style="position:absolute; inset:0; background-color:${currentColors[2]}; z-index:1; pointer-events:none;"></div>
                                <input type="color" class="color-picker-input" value="${currentColors[2]}" style="position:absolute; inset:0; opacity:0; width:100%; height:100%; cursor:pointer; z-index:2;">
                            </div>
                            <input type="text" class="color-hex-input" value="${currentColors[2].toUpperCase()}" maxlength="7" placeholder="#000000" style="width:100%; font-size:.75rem; font-weight:700; text-align:center; padding:.2rem .4rem; border:1px solid rgba(0,0,0,.1); border-radius:.35rem; color:#334155; text-transform:uppercase; font-family:monospace; background:var(--card-bg,#fff);">
                        </div>
                        <div class="palette-picker-item" style="display:flex; flex-direction:column; gap:.25rem; min-width:100px; flex:1;">
                            <label class="palette-picker-label" style="font-size:.65rem; font-weight:700; text-transform:uppercase; color:var(--text-secondary,#64748b);">Apoio / Fundo</label>
                            <div class="color-swatch-wrapper" style="position:relative; width:48px; height:48px; border-radius:.5rem; overflow:hidden; border:2px solid rgba(0,0,0,.08); box-shadow:inset 0 1px 3px rgba(0,0,0,.1); background:#f8fafc;">
                                <div class="color-swatch-preview" style="position:absolute; inset:0; background-color:${currentColors[3]}; z-index:1; pointer-events:none;"></div>
                                <input type="color" class="color-picker-input" value="${currentColors[3]}" style="position:absolute; inset:0; opacity:0; width:100%; height:100%; cursor:pointer; z-index:2;">
                            </div>
                            <input type="text" class="color-hex-input" value="${currentColors[3].toUpperCase()}" maxlength="7" placeholder="#000000" style="width:100%; font-size:.75rem; font-weight:700; text-align:center; padding:.2rem .4rem; border:1px solid rgba(0,0,0,.1); border-radius:.35rem; color:#334155; text-transform:uppercase; font-family:monospace; background:var(--card-bg,#fff);">
                        </div>
                    </div>
                    <div class="text-end mt-3">
                        <button class="btn-task-submit" type="submit"><i class="fa-solid fa-paper-plane me-1"></i>Enviar Paleta</button>
                    </div>
                </form>
            `;
        } else if (tarefa.type === 'url') {
            inputArea = `
                <form class="task-form" data-id="${tarefa.id}" data-type="${tarefa.type}">
                    <div class="url-input-row">
                        <i class="fa-solid fa-link url-icon"></i>
                        <input type="url" class="task-input-url" placeholder="https://..." required
                            ${tarefa.min_chars ? `minlength="${tarefa.min_chars}"` : ''}
                            ${tarefa.max_chars ? `maxlength="${tarefa.max_chars}"` : ''}>
                        <button class="btn-task-submit-inline" type="submit"><i class="fa-solid fa-arrow-right"></i></button>
                    </div>
                </form>`;
        } else {
            inputArea = `
                <form class="task-form" data-id="${tarefa.id}" data-type="${tarefa.type}">
                    <div class="text-input-row">
                        <input type="text" class="task-input js-char-input"
                            ${tarefa.min_chars ? `data-min="${tarefa.min_chars}"` : ''}
                            ${tarefa.max_chars ? `maxlength="${tarefa.max_chars}" data-max="${tarefa.max_chars}"` : ''}
                            placeholder="Digite aqui..." required>
                        <button class="btn-task-submit-inline" type="submit"><i class="fa-solid fa-arrow-right"></i></button>
                    </div>
                    ${tarefa.min_chars || tarefa.max_chars ? `
                    <div class="char-counter mt-1">
                        <span class="char-now">0</span>${tarefa.max_chars ? `<span class="char-sep"> / ${tarefa.max_chars}</span>` : ''}
                        ${tarefa.min_chars ? `<span class="char-min-hint"> (mín. ${tarefa.min_chars})</span>` : ''}
                    </div>` : ''}
                </form>`;
        }

        const div = document.createElement('div');
        div.className = 'task-card mb-3';
        div.innerHTML = `
            <div class="task-card-header">
                <div class="task-type-icon"><i class="fa-solid ${icon}"></i></div>
                <div class="task-card-info">
                    <h6 class="task-card-title">${tarefa.title}</h6>
                    <span class="task-type-label">${label}</span>
                </div>
                <span class="task-status-pill ${s.badge}">
                    <i class="fa-solid ${s.icon} me-1"></i>${s.label}
                </span>
            </div>
            ${tarefa.description ? `<p class="task-card-desc">${tarefa.description}</p>` : ''}
            ${pills ? `<div class="task-pills">${pills}</div>` : ''}
            ${tarefa.feedback ? `
            <div class="task-feedback-box">
                <div class="task-feedback-label"><i class="fa-solid fa-comment-dots me-1"></i>Feedback da equipe</div>
                <div class="task-feedback-text">${tarefa.feedback}</div>
            </div>` : ''}
            <div class="task-input-area">${inputArea}</div>
        `;
        return div;
    }

    function initCharCounters(root) {
        root.querySelectorAll('.js-char-input').forEach(inp => {
            const counter = inp.closest('form')?.querySelector('.char-now');
            if (!counter) return;
            const update = () => {
                counter.textContent = inp.value.length;
                const min = parseInt(inp.dataset.min || 0);
                counter.classList.toggle('char-warn', inp.value.length < min && inp.value.length > 0);
            };
            inp.addEventListener('input', update);
            update();
        });
    }

    function initUploadZones(root) {
        root.querySelectorAll('.upload-zone').forEach(zone => {
            const fileInput  = zone.querySelector('.upload-zone-input');
            const body       = zone.querySelector('.upload-zone-body');
            const preview    = zone.querySelector('.upload-zone-preview');
            const prevName   = zone.querySelector('.upload-preview-name');
            const prevRemove = zone.querySelector('.upload-preview-remove');
            const submitBtn  = zone.closest('form')?.querySelector('.btn-task-submit');
            const allowedExt = (zone.dataset.extensions || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

            function validateExt(file) {
                if (!allowedExt.length) return true;
                const ext = file.name.split('.').pop().toLowerCase();
                if (allowedExt.includes(ext)) return true;
                Toast.error(`Arquivo não permitido. Formatos aceitos: ${allowedExt.join(', ').toUpperCase()}`);
                return false;
            }

            const showPreview = file => {
                if (body)    body.classList.add('d-none');
                if (preview) preview.classList.remove('d-none');
                if (prevName) prevName.textContent = file.name;
                if (submitBtn) submitBtn.classList.remove('d-none');
            };
            const clearPreview = () => {
                if (body)    body.classList.remove('d-none');
                if (preview) preview.classList.add('d-none');
                if (fileInput) fileInput.value = '';
                if (submitBtn) submitBtn.classList.add('d-none');
            };

            zone.addEventListener('click', e => {
                if (!e.target.closest('.upload-preview-remove')) fileInput?.click();
            });
            fileInput?.addEventListener('change', () => {
                const file = fileInput.files[0];
                if (file) {
                    if (!validateExt(file)) { fileInput.value = ''; return; }
                    showPreview(file);
                }
            });
            prevRemove?.addEventListener('click', e => { e.stopPropagation(); clearPreview(); });

            zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('upload-zone-drag'); });
            zone.addEventListener('dragleave', () => zone.classList.remove('upload-zone-drag'));
            zone.addEventListener('drop', e => {
                e.preventDefault();
                zone.classList.remove('upload-zone-drag');
                const file = e.dataTransfer.files[0];
                if (file && fileInput) {
                    if (!validateExt(file)) return;
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    fileInput.files = dt.files;
                    showPreview(file);
                }
            });
        });
    }

    function initPalettePickers(root) {
        root.querySelectorAll('.palette-picker-container').forEach(container => {
            container.querySelectorAll('.palette-picker-item').forEach(item => {
                const picker = item.querySelector('.color-picker-input');
                const text = item.querySelector('.color-hex-input');
                const preview = item.querySelector('.color-swatch-preview');

                picker.addEventListener('input', () => {
                    text.value = picker.value.toUpperCase();
                    preview.style.backgroundColor = picker.value;
                });

                text.addEventListener('input', () => {
                    let val = text.value.trim();
                    if (!val.startsWith('#') && val.length > 0) {
                        val = '#' + val;
                        text.value = val;
                    }
                    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
                    if (hexRegex.test(val)) {
                        picker.value = val;
                        preview.style.backgroundColor = val;
                    }
                });
            });
        });
    }

    async function bindForms() {
        initCharCounters(document);
        initUploadZones(document);
        initPalettePickers(document);

        document.querySelectorAll(".task-form").forEach(form => {
            form.addEventListener("submit", async e => {
                e.preventDefault();
                const itemId = form.dataset.id;
                const tipo   = form.dataset.type;
                try {
                    let retorno;
                    if (tipo === "image" || tipo === "file") {
                        const arquivo = form.querySelector("input[type='file']");
                        if (!arquivo?.files?.[0]) { Toast.warning("Selecione um arquivo."); return; }
                        const fd = new FormData();
                        fd.append("item_id", itemId);
                        fd.append("arquivo", arquivo.files[0]);
                        retorno = await ApiClientFlow.postForm("cliente_tarefa_enviar.php", fd);
                    } else if (tipo === "color_palette") {
                        const hexInputs = form.querySelectorAll(".color-hex-input");
                        const cores = Array.from(hexInputs).map(inp => inp.value.trim());
                        const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
                        for (let cor of cores) {
                            if (!hexRegex.test(cor)) {
                                Toast.warning(`Cor inválida: ${cor}. Use o formato #HEXADECIMAL.`);
                                return;
                            }
                        }
                        const valor = cores.join(',');
                        retorno = await ApiClientFlow.post("cliente_tarefa_enviar.php", { item_id: itemId, valor });
                    } else {
                        const input = form.querySelector("input, textarea");
                        const valor = input?.value.trim();
                        if (!valor) { Toast.warning("Preencha o campo."); return; }
                        retorno = await ApiClientFlow.post("cliente_tarefa_enviar.php", { item_id: itemId, valor });
                    }

                    if (retorno.status !== "ok") { Toast.error(retorno.mensagem || "Erro ao enviar."); return; }
                    await carregarItens();
                } catch { Toast.error("Erro de conexão."); }
            });
        });
    }

    async function carregarItens() {
        itemsContainer.innerHTML = "";
        const retorno = await ApiClientFlow.get(`cliente_tarefas_listar.php?checklist_id=${checklistId}`);
        if (retorno.status !== "ok" || !retorno.data?.length) {
            emptyState.classList.remove("d-none");
            return;
        }
        if (navTitle) navTitle.textContent = retorno.data[0].checklist_name || "Projeto";
        emptyState.classList.add("d-none");
        retorno.data.forEach(t => itemsContainer.appendChild(criarCardItem(t)));
        await bindForms();
    }

    function initChat(sessaoUserId) {
        const widgetEl  = document.getElementById("floatingChatWidget");
        const chatBox   = document.getElementById("widgetChatBox");
        const openBtn   = document.getElementById("openChatBtn");
        const closeBtn  = document.getElementById("closeFloatingChat");
        const chatForm  = document.getElementById("widgetMessageForm");
        const chatInput = document.getElementById("widgetMessageInput");
        const chatSend  = document.getElementById("widgetBtnSend");
        let autoScroll  = true;
        let refreshInterval = null;

        async function loadMessages() {
            try {
                const ret = await ApiClientFlow.get(`mensagem_listar.php?checklist_id=${checklistId}`);
                if (ret.status !== "ok") return;

                const atBottom = chatBox.scrollHeight - chatBox.clientHeight <= chatBox.scrollTop + 40;
                chatBox.innerHTML = "";

                if (!ret.data.length) {
                    chatBox.innerHTML = `
                        <div class="h-100 d-flex flex-column align-items-center justify-content-center text-muted">
                            <i class="fa-regular fa-comments fs-3 mb-2 opacity-50"></i>
                            <p class="small text-center opacity-75">Nenhuma mensagem ainda.<br>Inicie a conversa!</p>
                        </div>`;
                    return;
                }

                let lastDate = null;
                ret.data.forEach(msg => {
                    const isMine = msg.remetente_usuario_id == sessaoUserId;
                    const dateObj = new Date(msg.criado_em.replace(" ", "T"));
                    const timeStr = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                    const dateStr = dateObj.toLocaleDateString();

                    if (lastDate !== dateStr) {
                        chatBox.innerHTML += `<div class="text-center my-2"><span class="badge bg-white text-muted border px-2 py-1" style="font-size:.65rem;">${dateStr}</span></div>`;
                        lastDate = dateStr;
                    }

                    const nameTag = !isMine ? `<small class="d-block text-muted mb-1 fw-bold" style="font-size:.65rem;">${msg.remetente_nome || "Prestador de Serviço"}</small>` : "";
                    chatBox.innerHTML += `
                        <div class="d-flex flex-column mb-2 ${isMine ? "align-items-end" : "align-items-start"}">
                            ${nameTag}
                            <div class="message-bubble ${isMine ? "message-sent" : "message-received"} shadow-sm">
                                <div>${msg.mensagem}</div>
                                <div class="text-end opacity-75 mt-1" style="font-size:.6rem;">${timeStr}</div>
                            </div>
                        </div>`;
                });

                if (autoScroll || atBottom) { chatBox.scrollTop = chatBox.scrollHeight; autoScroll = false; }
            } catch (_) {}
        }

        if (openBtn) {
            openBtn.addEventListener("click", () => {
                widgetEl.classList.remove("d-none");
                autoScroll = true;
                loadMessages();
                if (!refreshInterval) refreshInterval = setInterval(loadMessages, 3000);
                chatInput.focus();
            });
        }
        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                widgetEl.classList.add("d-none");
                clearInterval(refreshInterval);
                refreshInterval = null;
            });
        }
        if (chatForm) {
            chatForm.addEventListener("submit", async e => {
                e.preventDefault();
                const text = chatInput.value.trim();
                if (!text) return;
                chatInput.disabled = true; chatSend.disabled = true;
                try {
                    const ret = await ApiClientFlow.post("mensagem_enviar.php", { checklist_id: checklistId, mensagem: text });
                    if (ret.status === "ok") { chatInput.value = ""; autoScroll = true; await loadMessages(); }
                    else Toast.error(ret.mensagem || "Erro ao enviar.");
                } catch { Toast.error("Erro de conexão."); }
                chatInput.disabled = false; chatSend.disabled = false; chatInput.focus();
            });
        }
    }

    try {
        const sessao = await ApiClientFlow.get("valida_sessao_logado.php");
        if (sessao.status !== "ok") { window.location.href = "login.html"; return; }
        if (!sessao.data || sessao.data.tipo !== "client") { window.location.href = "dashboard_agency.html"; return; }

        await carregarItens();
        initChat(sessao.data.id);
    } catch (err) {
        console.error("Checklist Details error:", err);
        window.location.href = "login.html";
    }
});
