document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const checklistId = params.get("id");

    if (!checklistId) { window.location.href = "dashboard_client.html"; return; }

    const itemsContainer = document.getElementById("items-container");
    const emptyState     = document.getElementById("empty-state");
    const navTitle       = document.getElementById("nav-project-title");

    // ─── Status config ────────────────────────────────────────────────────────
    const statusMap = {
        pending:  { badge: "bg-warning text-dark", icon: "fa-clock",                label: "Pendente" },
        review:   { badge: "bg-primary",            icon: "fa-eye",                  label: "Em Revisão" },
        approved: { badge: "bg-success",            icon: "fa-check",                label: "Aprovado" },
        rejected: { badge: "bg-danger",             icon: "fa-triangle-exclamation", label: "Reprovado – Reenviar" },
    };

    // ─── Helpers ──────────────────────────────────────────────────────────────
    function buildAccept(t) {
        if (!t.allowed_extensions) return "";
        return t.allowed_extensions.split(",").map(e => `.${e.trim().toLowerCase()}`).join(",");
    }

    function buildConstraintHint(t) {
        const parts = [];
        if (t.min_chars || t.max_chars) parts.push(`Caracteres: ${t.min_chars || 0}–${t.max_chars || "∞"}`);
        if (t.allowed_extensions)        parts.push(`Extensões: ${t.allowed_extensions}`);
        if (t.max_file_size_kb)          parts.push(`Máx: ${t.max_file_size_kb} KB`);
        if (t.type === "image")          parts.push(`Resolução: ${t.min_width||0}–${t.max_width||"∞"} × ${t.min_height||0}–${t.max_height||"∞"} px`);
        return parts.length ? `<p class="text-muted small mb-2">${parts.join(" &nbsp;|&nbsp; ")}</p>` : "";
    }

    // ─── Item card renderer ───────────────────────────────────────────────────
    function criarCardItem(tarefa) {
        const s = statusMap[tarefa.status] || statusMap.pending;
        const accept = buildAccept(tarefa);
        const hint   = buildConstraintHint(tarefa);
        const locked = tarefa.status === "approved" || tarefa.status === "review";

        const div = document.createElement("div");
        div.className = "card card-custom border-0 shadow-sm mb-3 p-4";
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="fw-bold mb-0">${tarefa.title}</h6>
                <span class="badge ${s.badge} rounded-pill">
                    <i class="fa-solid ${s.icon} me-1"></i>${s.label}
                </span>
            </div>
            ${tarefa.description ? `<p class="text-muted small mb-2">${tarefa.description}</p>` : ""}
            ${hint}
            ${tarefa.feedback ? `
                <div class="alert alert-danger py-2 px-3 mb-2 small">
                    <i class="fa-solid fa-comment-dots me-1"></i><strong>Feedback:</strong> ${tarefa.feedback}
                </div>` : ""}
            ${locked ? `
                <div class="bg-light rounded p-2 text-muted small">
                    <i class="fa-solid fa-lock me-1"></i>
                    ${tarefa.type === "image" || tarefa.type === "file"
                        ? "Arquivo enviado"
                        : (tarefa.value || "Enviado")}
                </div>` : `
                <form class="task-form mt-1" data-id="${tarefa.id}" data-type="${tarefa.type}">
                    <div class="input-group">
                        ${tarefa.type === "image" || tarefa.type === "file" ? `
                            <input type="file" class="form-control" ${accept ? `accept="${accept}"` : ""} required>
                        ` : tarefa.type === "long_text" ? `
                            <textarea class="form-control"
                                ${tarefa.min_chars ? `minlength="${tarefa.min_chars}"` : ""}
                                ${tarefa.max_chars ? `maxlength="${tarefa.max_chars}"` : ""}
                                required placeholder="Digite sua resposta..."></textarea>
                        ` : `
                            <input type="${tarefa.type === "url" ? "url" : "text"}" class="form-control"
                                ${tarefa.min_chars ? `minlength="${tarefa.min_chars}"` : ""}
                                ${tarefa.max_chars ? `maxlength="${tarefa.max_chars}"` : ""}
                                required placeholder="Digite aqui...">
                        `}
                        ${tarefa.type !== "long_text" ? `<button class="btn btn-primary-custom" type="submit">Enviar</button>` : ""}
                    </div>
                    ${tarefa.type === "long_text" ? `<div class="text-end mt-2"><button class="btn btn-primary-custom px-4" type="submit">Enviar</button></div>` : ""}
                </form>`}
        `;
        return div;
    }

    // ─── Submit handler ────────────────────────────────────────────────────────
    async function bindForms() {
        document.querySelectorAll(".task-form").forEach(form => {
            form.addEventListener("submit", async e => {
                e.preventDefault();
                const itemId = form.dataset.id;
                const tipo   = form.dataset.type;
                try {
                    let retorno;
                    if (tipo === "image" || tipo === "file") {
                        const arquivo = form.querySelector("input[type='file']");
                        if (!arquivo?.files?.[0]) { alert("Selecione um arquivo."); return; }
                        const fd = new FormData();
                        fd.append("item_id", itemId);
                        fd.append("arquivo", arquivo.files[0]);
                        retorno = await ApiClientFlow.postForm("cliente_tarefa_enviar.php", fd);
                    } else {
                        const input = form.querySelector("input, textarea");
                        const valor = input?.value.trim();
                        if (!valor) { alert("Preencha o campo."); return; }
                        retorno = await ApiClientFlow.post("cliente_tarefa_enviar.php", { item_id: itemId, valor });
                    }
                    if (retorno.status !== "ok") { alert(retorno.mensagem || "Erro ao enviar."); return; }
                    await carregarItens();
                } catch { alert("Erro de conexão."); }
            });
        });
    }

    // ─── Load items ────────────────────────────────────────────────────────────
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

    // ─── Chat widget ───────────────────────────────────────────────────────────
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

                    const nameTag = !isMine ? `<small class="d-block text-muted mb-1 fw-bold" style="font-size:.65rem;">${msg.remetente_nome || "Agência"}</small>` : "";
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
                    else alert(ret.mensagem || "Erro ao enviar.");
                } catch { alert("Erro de conexão."); }
                chatInput.disabled = false; chatSend.disabled = false; chatInput.focus();
            });
        }
    }

    // ─── Init ──────────────────────────────────────────────────────────────────
    try {
        const sessao = await ApiClientFlow.get("valida_sessao_logado.php");
        if (sessao.status !== "ok") { window.location.href = "login.html"; return; }
        if (!sessao.data || sessao.data.tipo !== "client") { window.location.href = "dashboard_agency.html"; return; }

        if (window.ClientFlowIdentity) {
            window.ClientFlowIdentity.apply(sessao.data, { avatarBackground: "E63946" });
        }

        await carregarItens();
        initChat(sessao.data.id);

        const logoutLink = document.querySelector(".js-logout-link");
        if (logoutLink) {
            logoutLink.addEventListener("click", async e => {
                e.preventDefault();
                await ApiClientFlow.post("usuario_logoff.php");
                window.location.href = "../../index.html";
            });
        }
    } catch (err) {
        console.error("Checklist Details error:", err);
        // window.location.href = "login.html";
    }
});
