document.addEventListener("DOMContentLoaded", async () => {
    const tableBody = document.getElementById("checklistsTableBody");
    const modalTitle = document.getElementById("reviewModalTitle");
    const modalClient = document.getElementById("reviewModalClient");
    const modalList = document.getElementById("reviewItemsList");
    const reviewModalEl = document.getElementById("reviewModal");
    const reviewModal = reviewModalEl ? new bootstrap.Modal(reviewModalEl) : null;

    const sessao = await ApiClientFlow.get("valida_sessao_logado.php");
    if (sessao.status !== "ok") {
        window.location.href = "login.html";
        return;
    }

    if (sessao.data && sessao.data.tipo === "client") {
        window.location.href = "dashboard_client.html";
        return;
    }

    async function revisarItem(itemId, aprovar) {
        let motivo = "";

        if (!aprovar) {
            motivo = prompt("Informe o motivo da reprovação para o cliente:", "");
            if (motivo === null) {
                return;
            }
            motivo = motivo.trim();
            if (!motivo) {
                alert("Informe um motivo para reprovar.");
                return;
            }
        }

        const retorno = await ApiClientFlow.post("checklist_item_revisar.php", {
            item_id: itemId,
            acao: aprovar ? "aprovar" : "reprovar",
            motivo
        });

        if (retorno.status !== "ok") {
            alert(retorno.mensagem || "Erro ao revisar item.");
            return;
        }

        alert(retorno.mensagem || "Revisão registrada com sucesso.");
    }

    function renderReviewItem(item) {
        const wrapper = document.createElement("div");
        wrapper.className = "border rounded p-3 mb-3 bg-light";

        const valorExibicao = item.arquivo_path
            ? `<a href="../../${item.arquivo_path}" target="_blank" rel="noopener">Abrir arquivo enviado</a>`
            : (item.resposta_texto || "-");

        const regras = [];
        if (item.min_chars || item.max_chars) {
            regras.push(`Chars: ${item.min_chars || 0}-${item.max_chars || "sem limite"}`);
        }
        if (item.allowed_extensions) {
            regras.push(`Extensões: ${item.allowed_extensions}`);
        }
        if (item.max_file_size_kb) {
            regras.push(`Tamanho máx: ${item.max_file_size_kb} KB`);
        }
        if (item.formato_esperado === "image") {
            regras.push(`Resolução: ${item.min_width || 0}-${item.max_width || "inf"} x ${item.min_height || 0}-${item.max_height || "inf"}`);
        }

        const itemStatusMap = {
            "pending": '<span class="badge bg-warning text-dark"><i class="fa-solid fa-clock me-1"></i> Aguardando Envio</span>',
            "review": '<span class="badge bg-primary"><i class="fa-solid fa-eye me-1"></i> Em Revisão</span>',
            "approved": '<span class="badge bg-success"><i class="fa-solid fa-check me-1"></i> Aprovado</span>',
            "rejected": '<span class="badge bg-danger"><i class="fa-solid fa-xmark me-1"></i> Rejeitado</span>'
        };
        const statusItemBdg = itemStatusMap[item.status] || `<span class="badge bg-secondary">${item.status}</span>`;

        wrapper.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0">${item.nome_item}</h6>
                ${statusItemBdg}
            </div>
            ${item.descricao_item ? `<p class="text-muted mb-2">${item.descricao_item}</p>` : ""}
            ${regras.length ? `<div class="small text-muted mb-2">${regras.join(" | ")}</div>` : ""}
            <div class="mb-2"><strong>Resposta:</strong> ${valorExibicao}</div>
            ${item.motivo_rejeicao ? `<div class="alert alert-warning py-2 mb-2">Último motivo de devolução: ${item.motivo_rejeicao}</div>` : ""}
            <div class="d-flex gap-2">
                <button type="button" class="btn btn-success btn-sm js-approve">Aprovar</button>
                <button type="button" class="btn btn-danger btn-sm js-reject">Reprovar e pedir reenvio</button>
            </div>
        `;

        const approveBtn = wrapper.querySelector(".js-approve");
        const rejectBtn = wrapper.querySelector(".js-reject");

        approveBtn.addEventListener("click", async () => {
            await revisarItem(item.id, true);
            await abrirRevisaoChecklist(item.checklist_id);
            await carregarListaChecklists();
        });

        rejectBtn.addEventListener("click", async () => {
            await revisarItem(item.id, false);
            await abrirRevisaoChecklist(item.checklist_id);
            await carregarListaChecklists();
        });

        return wrapper;
    }

    async function abrirRevisaoChecklist(checklistId) {
        const retorno = await ApiClientFlow.get(`checklist_itens_agencia.php?checklist_id=${encodeURIComponent(checklistId)}`);

        if (retorno.status !== "ok") {
            alert(retorno.mensagem || "Erro ao carregar itens do checklist.");
            return;
        }

        const itens = retorno.data || [];
        if (!itens.length) {
            modalTitle.textContent = "Revisão de Itens";
            modalClient.textContent = "Nenhum item encontrado.";
            modalList.innerHTML = '<div class="text-muted">Nenhum item para revisão.</div>';
            reviewModal.show();
            return;
        }

        const base = itens[0];
        modalTitle.textContent = `Revisão: ${base.checklist_titulo || "Checklist"}`;
        modalClient.textContent = base.cliente_nome
            ? `Cliente: ${base.cliente_nome} (${base.cliente_email || "sem e-mail"})`
            : "Cliente ainda não vinculado";

        modalList.innerHTML = "";
        itens.forEach((item) => {
            modalList.appendChild(renderReviewItem(item));
        });

        reviewModal.show();
    }

    async function carregarListaChecklists() {
        const retorno = await ApiClientFlow.get("checklist_listar_agencia.php");
        if (retorno.status !== "ok") {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Nenhum projeto encontrado.</td></tr>';
            return;
        }

        const lista = retorno.data || [];
        if (!lista.length) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Nenhum projeto encontrado.</td></tr>';
            return;
        }

        tableBody.innerHTML = "";

        lista.forEach((item) => {
            const statusMap = {
                "pending": '<span class="badge bg-warning text-dark"><i class="fa-solid fa-clock me-1"></i> Pendente</span>',
                "review": '<span class="badge bg-primary"><i class="fa-solid fa-eye me-1"></i> Em Revisão</span>',
                "approved": '<span class="badge bg-success"><i class="fa-solid fa-check me-1"></i> Concluído</span>',
                "completed": '<span class="badge bg-success"><i class="fa-solid fa-check me-1"></i> Concluído</span>'
            };
            const bdg = statusMap[item.status] || `<span class="badge bg-secondary">${item.status}</span>`;

            const link = `${window.location.origin}/ClientFlow/public/pages/login.html?token=${encodeURIComponent(item.link_hash)}`;
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>
                    <div class="fw-semibold">${item.titulo}</div>
                    <small class="text-muted">${item.descricao || "Sem descrição"}</small>
                </td>
                <td>${item.cliente_nome ? `${item.cliente_nome} (${item.cliente_email || ""})` : "Aguardando vínculo"}</td>
                <td>${item.total_itens}</td>
                <td>${bdg}</td>
                <td>
                    <input class="form-control form-control-sm mb-2" value="${link}" readonly>
                </td>
                <td>
                    <button type="button" class="btn btn-outline-primary btn-sm js-open-review w-100 mb-1"><i class="fa-solid fa-list-check"></i> Revisar itens</button>
                    <button type="button" class="btn btn-outline-info btn-sm js-open-chat w-100"><i class="fa-regular fa-comment"></i> Mensagens</button>
                </td>
            `;

            tr.querySelector(".js-open-review").addEventListener("click", async () => {
                await abrirRevisaoChecklist(item.id);
            });
            tr.querySelector(".js-open-chat").addEventListener("click", () => {
                abrirChatProjeto(item.id, item.titulo, item.cliente_nome);
            });

            tableBody.appendChild(tr);
        });
    }

    await carregarListaChecklists();

    // Widget Chat Logic
    let activeChatChecklistId = null;
    let chatRefreshInterval = null;
    let chatAutoScroll = true;

    const widgetEl = document.getElementById('floatingChatWidget');
    if (widgetEl) {
        const closeWidgetBtn = document.getElementById('closeFloatingChat');
        const widgetTitle = document.getElementById('widgetChatTitle');
        const widgetClient = document.getElementById('widgetChatClient');
        const widgetChatBox = document.getElementById('widgetChatBox');
        const widgetForm = document.getElementById('widgetMessageForm');
        const widgetInput = document.getElementById('widgetMessageInput');
        const widgetBtnSend = document.getElementById('widgetBtnSend');

        closeWidgetBtn.addEventListener('click', () => {
            widgetEl.classList.add('d-none');
            activeChatChecklistId = null;
            if (chatRefreshInterval) clearInterval(chatRefreshInterval);
        });

        const loadWidgetMessages = async () => {
            if (!activeChatChecklistId) return;
            try {
                const retorno = await ApiClientFlow.get(`mensagem_listar.php?checklist_id=${activeChatChecklistId}`);
                if (retorno.status === 'ok') {
                    const isScrolledToBottom = widgetChatBox.scrollHeight - widgetChatBox.clientHeight <= widgetChatBox.scrollTop + 30;

                    widgetChatBox.innerHTML = '';
                    if (retorno.data.length === 0) {
                        widgetChatBox.innerHTML = `
                            <div class="h-100 d-flex flex-column align-items-center justify-content-center text-muted">
                                <i class="fa-regular fa-comments fs-3 mb-2 opacity-50"></i>
                                <p class="small text-center opacity-75">Nenhuma mensagem encontrada.<br>Inicie o contato!</p>
                            </div>
                        `;
                    } else {
                        let lastDate = null;
                        retorno.data.forEach(msg => {
                            const isMine = msg.remetente_usuario_id == sessao.data.id;
                            const dateObj = new Date(msg.criado_em.replace(' ', 'T'));
                            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const dateStr = dateObj.toLocaleDateString();

                            if (lastDate !== dateStr) {
                                widgetChatBox.innerHTML += `<div class="text-center my-2"><span class="badge bg-white text-muted border px-2 py-1" style="font-size:0.65rem;">${dateStr}</span></div>`;
                                lastDate = dateStr;
                            }

                            const nameLabel = !isMine ? `<small class="d-block text-muted mb-1 fw-bold" style="font-size: 0.65rem; margin-left: 2px;">${msg.remetente_nome}</small>` : '';

                            widgetChatBox.innerHTML += `
                                <div class="d-flex flex-column mb-2 ${isMine ? 'align-items-end' : 'align-items-start'}">
                                    ${nameLabel}
                                    <div class="message-bubble ${isMine ? 'message-sent' : 'message-received'} shadow-sm">
                                        <div>${msg.mensagem}</div>
                                        <div class="text-end opacity-75 mt-1" style="font-size: 0.6rem;">${timeStr}</div>
                                    </div>
                                </div>
                            `;
                        });
                    }

                    if (chatAutoScroll || isScrolledToBottom) {
                        widgetChatBox.scrollTop = widgetChatBox.scrollHeight;
                        chatAutoScroll = false;
                    }
                }
            } catch (e) { }
        };

        window.abrirChatProjeto = function (id, title, clientName) {
            activeChatChecklistId = id;
            widgetTitle.textContent = title;
            widgetClient.innerHTML = clientName ? `<i class="fa-regular fa-user"></i> ${clientName}` : 'Sem cliente vinculado';

            widgetEl.classList.remove('d-none');
            widgetChatBox.innerHTML = '<div class="text-center text-muted mt-4"><div class="spinner-border spinner-border-sm text-primary"></div></div>';

            chatAutoScroll = true;
            loadWidgetMessages();

            if (chatRefreshInterval) clearInterval(chatRefreshInterval);
            chatRefreshInterval = setInterval(loadWidgetMessages, 3000);
        };

        widgetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = widgetInput.value.trim();
            if (!text || !activeChatChecklistId) return;

            widgetInput.disabled = true;
            widgetBtnSend.disabled = true;

            try {
                const retorno = await ApiClientFlow.post('mensagem_enviar.php', {
                    checklist_id: activeChatChecklistId,
                    mensagem: text
                });

                if (retorno.status === 'ok') {
                    widgetInput.value = '';
                    chatAutoScroll = true;
                    await loadWidgetMessages();
                } else {
                    alert(retorno.mensagem || 'Erro ao enviar.');
                }
            } catch (error) {
                alert('Erro de conexão ao enviar.');
            }

            widgetInput.disabled = false;
            widgetBtnSend.disabled = false;
            widgetInput.focus();
        });
    }

});
