document.addEventListener("DOMContentLoaded", async () => {
    const tableBody = document.getElementById("checklistsTableBody");

    const sessao = await ApiClientFlow.get("valida_sessao_logado.php");
    if (sessao.status !== "ok") {
        window.location.href = "login.html";
        return;
    }

    if (sessao.data && sessao.data.tipo === "client") {
        window.location.href = "dashboard_client.html";
        return;
    }

    const retorno = await ApiClientFlow.get("checklist_listar_agencia.php");
    if (retorno.status !== "ok") {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Nenhum projeto encontrado.</td></tr>';
        return;
    }

    const lista = retorno.data || [];
    if (!lista.length) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Nenhum projeto encontrado.</td></tr>';
        return;
    }

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
        `;
        tableBody.appendChild(tr);
    });
});

function gerarLink() {
    fetch('../../api/gerar_link.php')
        .then(response => response.json())
        .then(data => {
            document.getElementById("linkGerado").innerText = data.link;
        });
}

function copiarLink() {
    const link = document.getElementById("linkGerado").innerText;
    navigator.clipboard.writeText(link);
    alert("Link copiado!");
}