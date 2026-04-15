document.addEventListener("DOMContentLoaded", async () => {
    await SidebarManager.init();
    
    if (!Auth.hasAccess('perm_ver_projetos') && !Auth.hasAccess('perm_criar_projetos')) {
         alert('Você não tem permissão para visualizar projetos.');
         window.location.href = "dashboard_agency.html";
         return;
    }
    
    const btnNovo = document.getElementById("btnNovoChecklist");
    if(btnNovo && !Auth.hasAccess('perm_criar_projetos')){
        btnNovo.classList.add('d-none');
    }

    const tableBody = document.getElementById("checklistsTableBody");
    const modalTitle = document.getElementById("reviewModalTitle");
    const modalClient = document.getElementById("reviewModalClient");
    const modalList = document.getElementById("reviewItemsList");
    const reviewModalEl = document.getElementById("reviewModal");
    const reviewModal = reviewModalEl ? new bootstrap.Modal(reviewModalEl) : null;
    
    // Modal Vincular CPF/CNPJ
    const modalVinculoEl = document.getElementById('modalVincularCPF');
    const modalVinculo = modalVinculoEl ? new bootstrap.Modal(modalVinculoEl) : null;
    const formVinculo = document.getElementById('formVincularCPF');
    const selChecklistVinculo = document.getElementById('vinculo_checklist_id');
    const btnConfirmarVinculo = document.getElementById('btnConfirmarVinculo');
    const btnBuscarCPF = document.getElementById('btnBuscarCPF');
    const feedbackCPF = document.getElementById('feedbackClienteCPF');
    const inputVinculoCPF = document.getElementById('vinculo_cpf');

    // Formatar CPF/CNPJ enquanto digita
    inputVinculoCPF.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 11) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (value.length <= 14) {
            value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
        e.target.value = value.slice(0, e.target.value.length);
    });

    window.abrirModalVincularCPF = async function() {
        // Carregar projetos disponíveis
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
        if (!cpf) {
            alert('Informe um CPF ou CNPJ.');
            return;
        }

        btnBuscarCPF.disabled = true;
        feedbackCPF.classList.remove('d-none');
        feedbackCPF.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
        feedbackCPF.classList.remove('text-success', 'text-danger');
        feedbackCPF.classList.add('text-muted');

        const res = await API.get(`cliente_buscar_cpf.php?cpf=${encodeURIComponent(cpf)}`);
        if(res && res.status === 'ok') {
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
        if(!cid || !cpf) return;

        btnConfirmarVinculo.disabled = true;
        btnConfirmarVinculo.textContent = 'Vinculando...';

        const res = await API.post('cliente_vincular_projeto.php', { checklist_id: cid, cpf });
        if(res && res.status === 'ok') {
            alert('Vínculo realizado com sucesso! ' + (res.data.tipo_documento ? `(${res.data.tipo_documento})` : ''));
            modalVinculo.hide();
            await carregarListaChecklists();
        } else {
            alert(res ? res.mensagem : 'Erro ao vincular.');
        }
        btnConfirmarVinculo.disabled = false;
        btnConfirmarVinculo.textContent = 'Confirmar Vínculo';
    });

    async function revisarItem(itemId, aprovar) {
        let motivo = "";
        if (!aprovar) {
            motivo = prompt("Informe o motivo da reprovação:");
            if (motivo === null) {
                return;
            }
            motivo = motivo.trim();
            if (!motivo) {
                alert("Informe um motivo para reprovar.");
                return;
            }
        }

        const retorno = await API.post("checklist_item_revisar.php", {
            item_id: itemId,
            aprovar,
            motivo_rejeicao: motivo
        });

        if (!retorno || retorno.status !== "ok") {
            alert((retorno && retorno.mensagem) || "Erro ao revisar item.");
        }
    }

    function renderReviewItem(item) {
        const wrapper = document.createElement("div");
        wrapper.className = "border rounded p-3 mb-3 bg-light shadow-sm";

        const valorExibicao = item.arquivo_path
            ? `<a href="../../${item.arquivo_path}" class="btn btn-sm btn-outline-primary" target="_blank" rel="noopener"><i class="fas fa-external-link-alt me-1"></i> Abrir arquivo enviado</a>`
            : `<div class="p-2 bg-white border rounded"><code>${item.resposta_texto || "Sem resposta"}</code></div>`;

        const itemStatusMap = {
            "pending": '<span class="badge bg-warning text-dark">Aguardando Envio</span>',
            "review": '<span class="badge bg-primary">Em Revisão</span>',
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
                <button type="button" class="btn btn-success btn-sm px-3 js-approve"><i class="fas fa-check me-1"></i> Aprovar</button>
                <button type="button" class="btn btn-danger btn-sm px-3 js-reject"><i class="fas fa-undo me-1"></i> Reprovar</button>
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
            alert(retorno.mensagem || "Erro ao carregar itens.");
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

    async function carregarListaChecklists() {
        const retorno = await API.get("checklist_listar_agencia.php");
        if (retorno.status !== "ok") {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-5">Nenhum projeto encontrado.</td></tr>';
            return;
        }

        const lista = retorno.data || [];
        if (!lista.length) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-5">Nenhum projeto encontrado.</td></tr>';
            return;
        }

        tableBody.innerHTML = "";
        lista.forEach(item => {
            const statusMap = {
                "pending": '<span class="badge bg-warning text-dark"><i class="fa-solid fa-clock me-1"></i> Pendente</span>',
                "review": '<span class="badge bg-primary shadow-sm"><i class="fa-solid fa-eye me-1"></i> Em Revisão</span>',
                "approved": '<span class="badge bg-success shadow-sm"><i class="fa-solid fa-check me-1"></i> Concluído</span>',
                "completed": '<span class="badge bg-success shadow-sm"><i class="fa-solid fa-check me-1"></i> Concluído</span>'
            };
            const bdg = statusMap[item.status] || `<span class="badge bg-secondary">${item.status}</span>`;
            const link = `${window.location.origin}/ClientFlow/public/pages/login.html?token=${encodeURIComponent(item.link_hash)}`;
            
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="ps-4">
                    <div class="fw-bold text-navy-blue">${item.titulo}</div>
                    <small class="text-muted">${item.descricao || "Sem descrição"}</small>
                </td>
                <td class="small">${item.cliente_nome ? `<strong>${item.cliente_nome}</strong>` : '<span class="text-muted italic">Aguardando vínculo</span>'}</td>
                <td class="text-center"><span class="badge bg-light text-dark border">${item.total_itens}</span></td>
                <td>${bdg}</td>
                <td style="max-width: 200px;">
                    <div class="input-group input-group-sm">
                        <input class="form-control bg-light" value="${link}" readonly>
                        <button class="btn btn-outline-secondary" onclick="navigator.clipboard.writeText('${link}'); alert('Link copiado!')" title="Copiar"><i class="far fa-copy"></i></button>
                    </div>
                </td>
                <td class="text-end pe-4">
                    <div class="d-flex gap-1 justify-content-end">
                        <button class="btn btn-sm btn-primary px-3 js-open-review" title="Revisar Envios"><i class="fas fa-tasks me-1"></i> Revisar</button>
                        <button class="btn btn-sm btn-outline-info js-open-chat" title="Abrir Chat"><i class="fas fa-comment"></i></button>
                    </div>
                </td>
            `;

            tr.querySelector(".js-open-review").addEventListener("click", () => abrirRevisaoChecklist(item.id));
            tr.querySelector(".js-open-chat").addEventListener("click", () => abrirChatProjeto(item.id, item.titulo, item.cliente_nome));
            tableBody.appendChild(tr);
        });
    }

    // Chat Widget
    let activeChatChecklistId = null;
    let chatRefreshInterval = null;
    const widgetEl = document.getElementById('floatingChatWidget');
    
    if (widgetEl) {
        const widgetChatBox = document.getElementById('widgetChatBox');
        window.abrirChatProjeto = function (id, title, clientName) {
            activeChatChecklistId = id;
            document.getElementById('widgetChatTitle').textContent = title;
            document.getElementById('widgetChatClient').innerHTML = clientName ? `<i class="fa-regular fa-user"></i> ${clientName}` : 'Sem cliente vinculado';
            widgetEl.classList.remove('d-none');
            widgetChatBox.innerHTML = `
                <div class="d-flex h-100 align-items-center justify-content-center text-center px-3">
                    <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                </div>
            `;
            loadWidgetMessages();
            if (chatRefreshInterval) clearInterval(chatRefreshInterval);
            chatRefreshInterval = setInterval(loadWidgetMessages, 3000);
        };

        const loadWidgetMessages = async () => {
             if (!activeChatChecklistId) return;
             try {
                 const res = await API.get(`mensagem_listar.php?checklist_id=${activeChatChecklistId}`);
                 if (!res || res.status !== 'ok') {
                     widgetChatBox.innerHTML = '<div class="d-flex h-100 align-items-center justify-content-center text-muted small px-3 text-center">Nao foi possivel carregar as mensagens.</div>';
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
            if(!input.value.trim() || !activeChatChecklistId) return;
            const res = await API.post('mensagem_enviar.php', { checklist_id: activeChatChecklistId, mensagem: input.value });
            if(res && res.status === 'ok') {
                input.value = '';
                loadWidgetMessages();
            } else {
                alert((res && res.mensagem) || 'Erro ao enviar mensagem.');
            }
        });

        document.getElementById('closeFloatingChat').addEventListener('click', () => {
            widgetEl.classList.add('d-none');
            if (chatRefreshInterval) clearInterval(chatRefreshInterval);
        });
    }

    await carregarListaChecklists();
});
