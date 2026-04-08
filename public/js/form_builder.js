function createFieldRow(index) {
    const row = document.createElement("div");
    row.className = "p-3 border rounded bg-light";
    row.innerHTML = `
        <div class="row g-2 align-items-end">
            <div class="col-md-4">
                <label class="form-label">Nome do Item</label>
                <input type="text" class="form-control field-name" placeholder="Ex: Logo em PNG" required>
            </div>
            <div class="col-md-4">
                <label class="form-label">Tipo de Resposta</label>
                <select class="form-select field-type">
                    <option value="text">Texto</option>
                    <option value="long_text">Texto longo</option>
                    <option value="url">URL</option>
                    <option value="file">Arquivo</option>
                    <option value="image">Imagem</option>
                    <option value="color">Cor</option>
                </select>
            </div>
            <div class="col-md-3">
                <label class="form-label">Descrição</label>
                <input type="text" class="form-control field-description" placeholder="Opcional">
            </div>
            <div class="col-md-1 text-end">
                <button type="button" class="btn btn-outline-danger remove-field-btn"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `;

    return row;
}

document.addEventListener("DOMContentLoaded", async () => {
    const sessao = await ApiClientFlow.get("valida_sessao_logado.php");
    if (sessao.status !== "ok") {
        window.location.href = "login.html";
        return;
    }

    if (sessao.data && sessao.data.tipo === "client") {
        window.location.href = "dashboard_client.html";
        return;
    }

    const fieldsContainer = document.getElementById("fieldsContainer");
    const addFieldBtn = document.getElementById("addFieldBtn");
    const form = document.getElementById("formBuilderForm");
    const linkCard = document.getElementById("linkResultCard");
    const linkInput = document.getElementById("projectLinkInput");
    const copyLinkBtn = document.getElementById("copyLinkBtn");

    function addField() {
        const row = createFieldRow(fieldsContainer.children.length + 1);
        row.querySelector(".remove-field-btn").addEventListener("click", () => {
            row.remove();
        });
        fieldsContainer.appendChild(row);
    }

    addField();

    addFieldBtn.addEventListener("click", addField);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const titulo = document.getElementById("projectTitle").value.trim();
        const descricao = document.getElementById("projectDescription").value.trim();

        const itens = [];
        fieldsContainer.querySelectorAll(".p-3.border").forEach((row) => {
            const nome = row.querySelector(".field-name").value.trim();
            const tipo = row.querySelector(".field-type").value;
            const descricaoItem = row.querySelector(".field-description").value.trim();

            if (nome) {
                itens.push({ nome, tipo, descricao: descricaoItem });
            }
        });

        if (!itens.length) {
            alert("Adicione pelo menos um item ao formulário.");
            return;
        }

        const retorno = await ApiClientFlow.post("checklist_criar.php", {
            titulo,
            descricao,
            itens: JSON.stringify(itens)
        });

        if (retorno.status !== "ok") {
            alert(retorno.mensagem || "Erro ao criar formulário.");
            return;
        }

        const token = retorno.data && retorno.data.link_hash ? retorno.data.link_hash : "";
        const link = `${window.location.origin}/ClientFlow/public/pages/cadastro.html?token=${encodeURIComponent(token)}`;

        linkInput.value = link;
        linkCard.classList.remove("d-none");
    });

    copyLinkBtn.addEventListener("click", async () => {
        if (!linkInput.value) {
            return;
        }

        await navigator.clipboard.writeText(linkInput.value);
        copyLinkBtn.textContent = "Copiado";
        setTimeout(() => {
            copyLinkBtn.textContent = "Copiar";
        }, 1500);
    });
});
