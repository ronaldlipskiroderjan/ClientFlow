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

        wrapper.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="mb-0">${item.nome_item}</h6>
                <span class="badge bg-secondary">${item.status}</span>
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

        if (item.status !== "review") {
            approveBtn.disabled = true;
            rejectBtn.disabled = true;
        }

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
            const link = `${window.location.origin}/ClientFlow/public/pages/cadastro.html?token=${encodeURIComponent(item.link_hash)}`;
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>
                    <div class="fw-semibold">${item.titulo}</div>
                    <small class="text-muted">${item.descricao || "Sem descrição"}</small>
                </td>
                <td>${item.cliente_nome ? `${item.cliente_nome} (${item.cliente_email || ""})` : "Aguardando vínculo"}</td>
                <td>${item.total_itens}</td>
                <td>${item.status}</td>
                <td>
                    <input class="form-control form-control-sm mb-2" value="${link}" readonly>
                </td>
                <td>
                    <button type="button" class="btn btn-outline-primary btn-sm js-open-review">Revisar itens</button>
                </td>
            `;

            tr.querySelector(".js-open-review").addEventListener("click", async () => {
                await abrirRevisaoChecklist(item.id);
            });

            tableBody.appendChild(tr);
        });
    }

    await carregarListaChecklists();
});
