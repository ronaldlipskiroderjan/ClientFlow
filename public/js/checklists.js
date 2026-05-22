document.addEventListener("DOMContentLoaded", async () => {
    await SidebarManager.init();

    if (!Auth.hasAccess('perm_ver_projetos') && !Auth.hasAccess('perm_criar_projetos')) {
        Toast.error('Você não tem permissão para visualizar projetos.');
        window.location.href = "dashboard_agency.html";
        return;
    }

    const btnNovo = document.getElementById("btnNovoChecklist");
    if (btnNovo && !Auth.hasAccess('perm_criar_projetos')) {
        btnNovo.classList.add('d-none');
    }

    const tableBody    = document.getElementById("checklistsTableBody");
    const modalTitle   = document.getElementById("reviewModalTitle");
    const modalClient  = document.getElementById("reviewModalClient");
    const modalList    = document.getElementById("reviewItemsList");
    const reviewModalEl = document.getElementById("reviewModal");
    const reviewModal  = reviewModalEl ? new bootstrap.Modal(reviewModalEl) : null;

    const modalVinculoEl    = document.getElementById('modalVincularCPF');
    const modalVinculo      = modalVinculoEl ? new bootstrap.Modal(modalVinculoEl) : null;
    const formVinculo       = document.getElementById('formVincularCPF');
    const selChecklistVinculo = document.getElementById('vinculo_checklist_id');
    const btnConfirmarVinculo = document.getElementById('btnConfirmarVinculo');
    const btnBuscarCPF      = document.getElementById('btnBuscarCPF');
    const feedbackCPF       = document.getElementById('feedbackClienteCPF');
    const inputVinculoCPF   = document.getElementById('vinculo_cpf');

    const searchInput = document.getElementById('searchProjects');
    let todosChecklists = [];

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const q = searchInput.value.trim().toLowerCase();
            const filtrados = q
                ? todosChecklists.filter(c =>
                    (c.titulo || '').toLowerCase().includes(q) ||
                    (c.cliente_nome || '').toLowerCase().includes(q)
                  )
                : todosChecklists;
            renderChecklists(filtrados);
        });
    }

    inputVinculoCPF.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 11) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (value.length <= 14) {
            value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
        e.target.value = value.slice(0, e.target.value.length);
    });

    window.abrirModalVincularCPF = async function () {
        const res = await API.get('checklist_listar_agencia.php');
        if (res && res.status === 'ok') {
            selChecklistVinculo.innerHTML = '<option value="">-- Selecione um projeto --</option>';
            res.data.forEach(chk => {
                const opt = document.createElement('option');
                opt.value = chk.id;
                opt.textContent = chk.titulo + (chk.cliente_nome ? ` (${chk.cliente_nome})` : '');
                selChecklistVinculo.appendChild(opt);
            });
        }
        inputVinculoCPF.value = '';
        feedbackCPF.classList.add('d-none');
        btnConfirmarVinculo.disabled = true;
        modalVinculo.show();
    };

    btnBuscarCPF.addEventListener('click', async (e) => {
        e.preventDefault();
        const cpf = inputVinculoCPF.value;
        if (!cpf) { Toast.warning('Informe um CPF ou CNPJ.'); return; }

        btnBuscarCPF.disabled = true;
        feedbackCPF.classList.remove('d-none');
        feedbackCPF.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
        feedbackCPF.classList.remove('text-success', 'text-danger');
        feedbackCPF.classList.add('text-muted');

        const res = await API.get(`cliente_buscar_cpf.php?cpf=${encodeURIComponent(cpf)}`);
        if (res && res.status === 'ok') {
            feedbackCPF.innerHTML = `<i class="fas fa-check text-success"></i> Cliente: <strong>${res.data.nome}</strong> (${res.data.email})`;
            feedbackCPF.classList.replace('text-muted', 'text-success');
            btnConfirmarVinculo.disabled = false;
        } else {
            feedbackCPF.innerHTML = `<i class="fas fa-times text-danger"></i> ${res ? res.mensagem : 'Cliente não encontrado.'}`;
            feedbackCPF.classList.replace('text-muted', 'text-danger');
            btnConfirmarVinculo.disabled = true;
        }
        btnBuscarCPF.disabled = false;
    });

    formVinculo.addEventListener('submit', async (e) => {
        e.preventDefault();
        const cid = selChecklistVinculo.value;
        const cpf = inputVinculoCPF.value.replace(/\D/g, '');
        if (!cid || !cpf) return;

        btnConfirmarVinculo.disabled = true;
        btnConfirmarVinculo.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i>Vinculando...';

        const res = await API.post('cliente_vincular_projeto.php', { checklist_id: cid, cpf });
        if (res && res.status === 'ok') {
            Toast.success('Vínculo realizado com sucesso!' + (res.data.tipo_documento ? ` (${res.data.tipo_documento})` : ''));
            modalVinculo.hide();
            await carregarListaChecklists();
        } else {
            Toast.error(res ? res.mensagem : 'Erro ao vincular.');
        }
        btnConfirmarVinculo.disabled = false;
        btnConfirmarVinculo.textContent = 'Confirmar Vínculo';
    });

    let motivoReprovarResolve = null;
    const modalReprovarEl = document.getElementById('modalReprovar');
    const modalReprovar   = modalReprovarEl ? new bootstrap.Modal(modalReprovarEl) : null;

    function pedirMotivoReprovar() {
        return new Promise((resolve) => {
            motivoReprovarResolve = resolve;
            document.getElementById('inputMotivoReprovar').value = '';
            modalReprovar?.show();

            modalReprovarEl.addEventListener('shown.bs.modal', () => {
                const backdrops = document.querySelectorAll('.modal-backdrop');
                if (backdrops.length > 0) {
                    backdrops[backdrops.length - 1].style.zIndex = '1070';
                }
            }, { once: true });
        });
    }

    document.getElementById('btnConfirmarReprovar')?.addEventListener('click', () => {
        const motivo = document.getElementById('inputMotivoReprovar')?.value.trim();
        if (!motivo) { Toast.warning('Informe um motivo para reprovar.'); return; }
        modalReprovar?.hide();
        motivoReprovarResolve?.(motivo);
        motivoReprovarResolve = null;
    });

    document.getElementById('btnCancelarReprovar')?.addEventListener('click', () => {
        modalReprovar?.hide();
        motivoReprovarResolve?.(null);
        motivoReprovarResolve = null;
    });

    async function revisarItem(itemId, aprovar) {
        let motivo = "";
        if (!aprovar) {
            motivo = await pedirMotivoReprovar();
            if (motivo === null) return;
        }
        const retorno = await API.post("checklist_item_revisar.php", {
            item_id: itemId,
            acao: aprovar ? "aprovar" : "reprovar",
            motivo
        });
        if (!retorno || retorno.status !== "ok") {
            Toast.error((retorno && retorno.mensagem) || "Erro ao revisar item.");
        } else {
            Toast.success(aprovar ? "Item aprovado!" : "Item reprovado e feedback enviado.");
        }
    }

    function renderReviewItem(item) {
        const wrapper = document.createElement("div");
        wrapper.className = "border rounded p-3 mb-3 bg-light shadow-sm";

        let valorExibicao = '';
        if (item.arquivo_path) {
            valorExibicao = `<a href="../../${item.arquivo_path}" class="btn btn-sm btn-outline-primary" target="_blank" rel="noopener"><i class="fas fa-external-link-alt me-1"></i>Abrir arquivo enviado</a>`;
        } else if (item.formato_esperado === 'color_palette' && item.resposta_texto) {
            const cores = item.resposta_texto.split(',').map(s => s.trim().toUpperCase());
            const nomesCores = ['Primária', 'Secundária', 'Destaque', 'Fundo'];
            let divsCores = '';
            cores.forEach((cor, idx) => {
                const labelColor = nomesCores[idx] || `Cor ${idx + 1}`;
                divsCores += `
                    <div class="review-color-item" style="display:flex; align-items:center; gap:.5rem; margin-bottom:.4rem;">
                        <div class="review-color-dot" style="width:24px; height:24px; border-radius:50%; border:1px solid rgba(0,0,0,.15); background-color:${cor}; box-shadow:0 2px 4px rgba(0,0,0,.1);"></div>
                        <span style="font-size:.8rem; font-weight:600; color:#334155; min-width:80px;">${labelColor}:</span>
                        <code style="font-size:.8rem; font-weight:700; color:#475569;">${cor}</code>
                    </div>
                `;
            });
            valorExibicao = `<div class="p-3 bg-white border rounded" style="display:flex; flex-direction:column; gap:.2rem;">${divsCores}</div>`;
        } else {
            valorExibicao = `<div class="p-2 bg-white border rounded"><code>${item.resposta_texto || "Sem resposta"}</code></div>`;
        }

        const itemStatusMap = {
            "pending":  '<span class="badge bg-warning text-dark">Aguardando Envio</span>',
            "review":   '<span class="badge bg-primary">Em Revisão</span>',
            "approved": '<span class="badge bg-success">Aprovado</span>',
            "rejected": '<span class="badge bg-danger">Rejeitado</span>'
        };
        const statusItemBdg = itemStatusMap[item.status] || `<span class="badge bg-secondary">${item.status}</span>`;

        wrapper.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0 fw-bold">${item.nome_item}</h6>
                ${statusItemBdg}
            </div>
            ${item.descricao_item ? `<p class="text-muted small mb-2">${item.descricao_item}</p>` : ""}
            <div class="mb-3"><strong>Resposta:</strong> ${valorExibicao}</div>
            ${item.motivo_rejeicao ? `<div class="alert alert-warning py-1 small mb-2"><i class="fas fa-info-circle me-1"></i> Devolvido: ${item.motivo_rejeicao}</div>` : ""}
            <div class="d-flex gap-2">
                <button type="button" class="btn btn-success btn-sm px-3 js-approve"><i class="fas fa-check me-1"></i>Aprovar</button>
                <button type="button" class="btn btn-danger btn-sm px-3 js-reject"><i class="fas fa-undo me-1"></i>Reprovar</button>
            </div>
        `;

        wrapper.querySelector(".js-approve").addEventListener("click", async () => {
            await revisarItem(item.id, true);
            await abrirRevisaoChecklist(item.checklist_id);
            await carregarListaChecklists();
        });
        wrapper.querySelector(".js-reject").addEventListener("click", async () => {
            await revisarItem(item.id, false);
            await abrirRevisaoChecklist(item.checklist_id);
            await carregarListaChecklists();
        });

        return wrapper;
    }

    async function abrirRevisaoChecklist(checklistId) {
        const retorno = await API.get(`checklist_itens_agencia.php?checklist_id=${encodeURIComponent(checklistId)}`);
        if (retorno.status !== "ok") {
            Toast.error(retorno.mensagem || "Erro ao carregar itens.");
            return;
        }
        const itens = retorno.data || [];
        if (!itens.length) {
            modalTitle.textContent = "Revisão de Itens";
            modalList.innerHTML = '<div class="text-muted text-center py-4">Nenhum item encontrado.</div>';
            reviewModal.show();
            return;
        }
        const base = itens[0];
        modalTitle.textContent = `Revisão: ${base.checklist_titulo || "Checklist"}`;
        modalClient.textContent = base.cliente_nome ? `Cliente: ${base.cliente_nome}` : "Sem cliente vinculado";
        modalList.innerHTML = "";
        itens.forEach(item => modalList.appendChild(renderReviewItem(item)));
        reviewModal.show();
    }

    async function deletarChecklist(id, titulo) {
        const retorno = await API.post("checklist_deletar.php", { checklist_id: id });
        if (retorno && retorno.status === "ok") {
            Toast.success(`Projeto "${titulo}" excluído.`);
            await carregarListaChecklists();
        } else {
            Toast.error((retorno && retorno.mensagem) || "Erro ao excluir projeto.");
        }
    }

    function renderChecklists(lista) {
        const cardContainer = document.getElementById('checklistsCardContainer');
        const vazioMsg = 'Nenhum projeto encontrado.';

        if (!lista || !lista.length) {
            tableBody.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-muted"><i class="fa-solid fa-folder-open fa-2x opacity-25 mb-2 d-block"></i>${vazioMsg}</td></tr>`;
            if (cardContainer) cardContainer.innerHTML = `<div class="text-center text-muted py-5"><i class="fa-solid fa-folder-open fa-2x opacity-25 mb-2 d-block"></i>${vazioMsg}</div>`;
            return;
        }

        tableBody.innerHTML = "";
        if (cardContainer) cardContainer.innerHTML = '';

        const podeExcluir = Auth.hasAccess('perm_criar_projetos');

        lista.forEach(item => {
            const statusMap = {
                "pending":   '<span class="badge bg-warning text-dark"><i class="fa-solid fa-clock me-1"></i>Pendente</span>',
                "review":    '<span class="badge bg-primary shadow-sm"><i class="fa-solid fa-eye me-1"></i>Em Revisão</span>',
                "approved":  '<span class="badge bg-success shadow-sm"><i class="fa-solid fa-check me-1"></i>Concluído</span>',
                "completed": '<span class="badge bg-success shadow-sm"><i class="fa-solid fa-check me-1"></i>Concluído</span>'
            };
            const bdg = statusMap[item.status] || `<span class="badge bg-secondary">${item.status}</span>`;
            const basePath = (window.location.pathname.match(/^(.*?)(?=\/public\/)/i)?.[1]) || "";
            const link = `${window.location.origin}${basePath}/public/pages/login.html?token=${encodeURIComponent(item.link_hash)}`;
            const deleteBtnDesktop = podeExcluir
                ? `<button class="btn btn-sm btn-outline-danger js-delete" title="Excluir projeto"><i class="fas fa-trash-alt"></i></button>`
                : '';
            const deleteBtnMobile = podeExcluir
                ? `<button class="btn btn-sm btn-outline-danger js-delete-card" title="Excluir"><i class="fas fa-trash-alt"></i></button>`
                : '';

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="ps-4">
                    <div class="fw-bold text-navy-blue">${item.titulo}</div>
                    <small class="text-muted">${item.descricao || "Sem descrição"}</small>
                </td>
                <td class="small">${item.cliente_nome ? `<strong>${item.cliente_nome}</strong>` : '<span class="text-muted fst-italic">Aguardando vínculo</span>'}</td>
                <td class="text-center"><span class="badge bg-light text-dark border">${item.total_itens}</span></td>
                <td>${bdg}</td>
                <td style="max-width:200px;">
                    <div class="input-group input-group-sm">
                        <input class="form-control bg-light" value="${link}" readonly>
                        <button class="btn btn-outline-secondary js-copy-link" data-link="${link}" title="Copiar"><i class="far fa-copy"></i></button>
                    </div>
                </td>
                <td class="text-end pe-4">
                    <div class="d-flex gap-1 justify-content-end">
                        <button class="btn btn-sm btn-primary px-3 js-open-review" title="Revisar Envios"><i class="fas fa-tasks me-1"></i>Revisar</button>
                        <button class="btn btn-sm btn-outline-info js-open-chat" title="Abrir Chat"><i class="fas fa-comment"></i></button>
                        ${deleteBtnDesktop}
                    </div>
                </td>
            `;
            tr.querySelector(".js-open-review").addEventListener("click", () => abrirRevisaoChecklist(item.id));
            tr.querySelector(".js-open-chat").addEventListener("click", () => abrirChatProjeto(item.id, item.titulo, item.cliente_nome));
            tr.querySelector(".js-copy-link").addEventListener("click", async (e) => {
                await navigator.clipboard.writeText(e.currentTarget.dataset.link);
                Toast.success('Link copiado!');
            });
            if (podeExcluir) {
                tr.querySelector(".js-delete").addEventListener("click", () => deletarChecklist(item.id, item.titulo));
            }
            tableBody.appendChild(tr);

            if (cardContainer) {
                const card = document.createElement('div');
                card.className = 'card mb-2 border-0 shadow-sm rounded-3 p-3';
                card.innerHTML = `
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div class="overflow-hidden me-2">
                            <div class="fw-bold text-navy-blue text-truncate">${item.titulo}</div>
                            <small class="text-muted">${item.descricao || 'Sem descrição'}</small>
                        </div>
                        ${bdg}
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="small">
                            ${item.cliente_nome
                                ? `<span class="text-muted"><i class="fa-solid fa-user me-1"></i>${item.cliente_nome}</span>`
                                : '<span class="text-muted fst-italic">Aguardando vínculo</span>'}
                            <span class="badge bg-light text-dark border ms-2">${item.total_itens} itens</span>
                        </div>
                        <div class="d-flex gap-1 flex-shrink-0 ms-2">
                            <button class="btn btn-sm btn-primary js-open-review-card" title="Revisar"><i class="fas fa-tasks"></i></button>
                            <button class="btn btn-sm btn-outline-secondary js-copy-link-card" data-link="${link}" title="Copiar Link"><i class="far fa-copy"></i></button>
                            <button class="btn btn-sm btn-outline-info js-open-chat-card" title="Chat"><i class="fas fa-comment"></i></button>
                            ${deleteBtnMobile}
                        </div>
                    </div>
                `;
                card.querySelector('.js-open-review-card').addEventListener('click', () => abrirRevisaoChecklist(item.id));
                card.querySelector('.js-open-chat-card').addEventListener('click', () => abrirChatProjeto(item.id, item.titulo, item.cliente_nome));
                card.querySelector('.js-copy-link-card').addEventListener('click', async (e) => {
                    await navigator.clipboard.writeText(e.currentTarget.dataset.link);
                    Toast.success('Link copiado!');
                });
                if (podeExcluir) {
                    card.querySelector('.js-delete-card').addEventListener('click', () => deletarChecklist(item.id, item.titulo));
                }
                cardContainer.appendChild(card);
            }
        });
    }

    async function carregarListaChecklists() {
        const retorno = await API.get("checklist_listar_agencia.php");
        if (retorno.status !== "ok") {
            Toast.error("Não foi possível carregar os projetos.");
            renderChecklists([]);
            return;
        }
        todosChecklists = retorno.data || [];

        const q = searchInput?.value.trim().toLowerCase() || '';
        const filtrados = q
            ? todosChecklists.filter(c =>
                (c.titulo || '').toLowerCase().includes(q) ||
                (c.cliente_nome || '').toLowerCase().includes(q)
              )
            : todosChecklists;
        renderChecklists(filtrados);
    }

    let activeChatChecklistId = null;
    let chatRefreshInterval   = null;
    const widgetEl = document.getElementById('floatingChatWidget');

    if (widgetEl) {
        const widgetChatBox = document.getElementById('widgetChatBox');
        window.abrirChatProjeto = function (id, title, clientName) {
            activeChatChecklistId = id;
            document.getElementById('widgetChatTitle').textContent = title;
            document.getElementById('widgetChatClient').innerHTML = clientName
                ? `<i class="fa-regular fa-user"></i> ${clientName}`
                : 'Sem cliente vinculado';
            widgetEl.classList.remove('d-none');
            widgetChatBox.innerHTML = `<div class="d-flex h-100 align-items-center justify-content-center"><div class="spinner-border spinner-border-sm text-primary" role="status"></div></div>`;
            loadWidgetMessages();
            if (chatRefreshInterval) clearInterval(chatRefreshInterval);
            chatRefreshInterval = setInterval(loadWidgetMessages, 3000);
        };

        const loadWidgetMessages = async () => {
            if (!activeChatChecklistId) return;
            try {
                const res = await API.get(`mensagem_listar.php?checklist_id=${activeChatChecklistId}`);
                if (!res || res.status !== 'ok') {
                    widgetChatBox.innerHTML = '<div class="d-flex h-100 align-items-center justify-content-center text-muted small px-3 text-center">Não foi possível carregar as mensagens.</div>';
                    return;
                }
                const mensagens = Array.isArray(res.data) ? res.data : [];
                if (!mensagens.length) {
                    widgetChatBox.innerHTML = '<div class="d-flex h-100 align-items-center justify-content-center text-muted small px-3 text-center">Nenhuma mensagem ainda.</div>';
                    return;
                }
                widgetChatBox.innerHTML = '';
                mensagens.forEach(m => {
                    const isMine = m.remetente_usuario_id == Auth.get('id');
                    widgetChatBox.innerHTML += `
                        <div class="d-flex flex-column mb-2 ${isMine ? 'align-items-end' : 'align-items-start'}">
                            <div class="message-bubble ${isMine ? 'message-sent' : 'message-received'} shadow-sm">
                                <div class="small">${m.mensagem}</div>
                            </div>
                        </div>
                    `;
                });
                widgetChatBox.scrollTop = widgetChatBox.scrollHeight;
            } catch (e) {
                widgetChatBox.innerHTML = '<div class="d-flex h-100 align-items-center justify-content-center text-muted small px-3 text-center">Erro ao carregar mensagens.</div>';
            }
        };

        document.getElementById('widgetMessageForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('widgetMessageInput');
            if (!input.value.trim() || !activeChatChecklistId) return;
            const res = await API.post('mensagem_enviar.php', { checklist_id: activeChatChecklistId, mensagem: input.value });
            if (res && res.status === 'ok') {
                input.value = '';
                loadWidgetMessages();
            } else {
                Toast.error((res && res.mensagem) || 'Erro ao enviar mensagem.');
            }
        });

        document.getElementById('closeFloatingChat').addEventListener('click', () => {
            widgetEl.classList.add('d-none');
            if (chatRefreshInterval) clearInterval(chatRefreshInterval);
        });
    }

    await carregarListaChecklists();
});
