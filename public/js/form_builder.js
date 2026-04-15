function createFieldRow() {
    const row = document.createElement("div");
    row.className = "p-3 border rounded bg-light field-row";
    row.innerHTML = `
        <div class="row g-2 align-items-end">
            <div class="col-md-3">
                <label class="form-label">Nome do Item</label>
                <input type="text" class="form-control field-name" placeholder="Ex: Logo em PNG" required>
            </div>
            <div class="col-md-3">
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
            <div class="col-md-5">
                <label class="form-label">Descrição</label>
                <input type="text" class="form-control field-description" placeholder="Instruções para o cliente">
            </div>
            <div class="col-md-1 text-end">
                <button type="button" class="btn btn-outline-danger remove-field-btn"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>

        <div class="constraints mt-3">
            <div class="constraint-text row g-2 d-none">
                <div class="col-md-3">
                    <label class="form-label">Mín. caracteres</label>
                    <input type="number" class="form-control min-chars" min="1" placeholder="Opcional">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Máx. caracteres</label>
                    <input type="number" class="form-control max-chars" min="1" placeholder="Opcional">
                </div>
            </div>

            <div class="constraint-file row g-2 d-none">
                <div class="col-md-5">
                    <label class="form-label">Extensões permitidas (csv)</label>
                    <input type="text" class="form-control allowed-extensions" placeholder="pdf,docx,png">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Tamanho máx. (KB)</label>
                    <input type="number" class="form-control max-file-size-kb" min="1" placeholder="Opcional">
                </div>
            </div>

            <div class="constraint-image row g-2 d-none">
                <div class="col-md-3">
                    <label class="form-label">Largura mín. (px)</label>
                    <input type="number" class="form-control min-width" min="1" placeholder="Opcional">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Largura máx. (px)</label>
                    <input type="number" class="form-control max-width" min="1" placeholder="Opcional">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Altura mín. (px)</label>
                    <input type="number" class="form-control min-height" min="1" placeholder="Opcional">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Altura máx. (px)</label>
                    <input type="number" class="form-control max-height" min="1" placeholder="Opcional">
                </div>
            </div>
        </div>
    `;

    return row;
}

function updateConstraintVisibility(row) {
    const type = row.querySelector(".field-type").value;
    const textBlock = row.querySelector(".constraint-text");
    const fileBlock = row.querySelector(".constraint-file");
    const imageBlock = row.querySelector(".constraint-image");

    textBlock.classList.toggle("d-none", !(type === "text" || type === "long_text" || type === "url" || type === "color"));
    fileBlock.classList.toggle("d-none", !(type === "file" || type === "image"));
    imageBlock.classList.toggle("d-none", type !== "image");

    if (type === "image") {
        const extensions = row.querySelector(".allowed-extensions");
        if (!extensions.value.trim()) {
            extensions.value = "png,jpg,jpeg,webp,gif,bmp,tif,tiff,svg,avif,heic,heif";
        }
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await SidebarManager.init();

    if (!Auth.hasAccess('perm_criar_projetos')) {
        alert('Você não tem permissão para criar formulários.');
        window.location.href = 'checklists.html';
        return;
    }

    const fieldsContainer = document.getElementById("fieldsContainer");
    const addFieldBtn = document.getElementById("addFieldBtn");
    const form = document.getElementById("formBuilderForm");
    const linkCard = document.getElementById("linkResultCard");
    const linkInput = document.getElementById("projectLinkInput");
    const copyLinkBtn = document.getElementById("copyLinkBtn");

    function addField() {
        const row = createFieldRow();

        row.querySelector(".remove-field-btn").addEventListener("click", () => {
            row.remove();
        });

        const typeSelect = row.querySelector(".field-type");
        typeSelect.addEventListener("change", () => updateConstraintVisibility(row));

        updateConstraintVisibility(row);
        fieldsContainer.appendChild(row);
    }

    addField();
    addFieldBtn.addEventListener("click", addField);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const titulo = document.getElementById("projectTitle").value.trim();
        const descricao = document.getElementById("projectDescription").value.trim();

        const itens = [];
        fieldsContainer.querySelectorAll(".field-row").forEach((row) => {
            const nome = row.querySelector(".field-name").value.trim();
            const tipo = row.querySelector(".field-type").value;
            const descricaoItem = row.querySelector(".field-description").value.trim();

            if (!nome) {
                return;
            }

            const item = {
                nome,
                tipo,
                descricao: descricaoItem,
                min_chars: row.querySelector(".min-chars")?.value || "",
                max_chars: row.querySelector(".max-chars")?.value || "",
                allowed_extensions: row.querySelector(".allowed-extensions")?.value || "",
                max_file_size_kb: row.querySelector(".max-file-size-kb")?.value || "",
                min_width: row.querySelector(".min-width")?.value || "",
                max_width: row.querySelector(".max-width")?.value || "",
                min_height: row.querySelector(".min-height")?.value || "",
                max_height: row.querySelector(".max-height")?.value || ""
            };

            itens.push(item);
        });

        if (!itens.length) {
            alert("Adicione pelo menos um item ao formulário.");
            return;
        }

        const retorno = await API.post("checklist_criar.php", {
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
        linkCard.scrollIntoView({ behavior: 'smooth' });
    });

    copyLinkBtn.addEventListener("click", async () => {
        if (!linkInput.value) {
            return;
        }

        await navigator.clipboard.writeText(linkInput.value);
        copyLinkBtn.innerHTML = '<i class="fas fa-check me-1"></i> Copiado';
        setTimeout(() => {
            copyLinkBtn.innerHTML = '<i class="fa-solid fa-copy me-1"></i> Copiar Link';
        }, 1500);
    });
});
