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
    const sessao = await Auth.validateSession();

    if (!sessao) {
        window.location.href = "login.html";
        return;
    }

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
    const templateManagerCard = document.getElementById("templateManagerCard");
    const templateSelect = document.getElementById("templateSelect");
    const loadTemplateBtn = document.getElementById("loadTemplateBtn");
    const templateNameInput = document.getElementById("templateNameInput");
    const templateDescriptionInput = document.getElementById("templateDescriptionInput");
    const saveTemplateBtn = document.getElementById("saveTemplateBtn");
    const templateHint = document.getElementById("templateHint");

    const canUseTemplates = (
        (sessao.tipo === "agency" || sessao.tipo === "agency_member") &&
        Boolean(sessao.agencia_id)
    );

    function atualizarHintTemplate(mensagem = "", tipo = "info") {
        if (!templateHint) {
            return;
        }

        templateHint.classList.remove("d-none", "alert-info", "alert-warning", "alert-success");
        if (!mensagem) {
            templateHint.classList.add("d-none");
            return;
        }

        const classes = {
            info: "alert-info",
            warning: "alert-warning",
            success: "alert-success"
        };

        templateHint.classList.add(classes[tipo] || "alert-info");
        templateHint.textContent = mensagem;
    }

    function montarLinkCliente(token) {
        const link = `${window.location.origin}/ClientFlow/public/pages/cadastro.html?token=${encodeURIComponent(token)}`;
        linkInput.value = link;
        linkCard.classList.remove("d-none");
        linkCard.scrollIntoView({ behavior: 'smooth' });
    }

    function coletarItensFormulario() {
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

        return itens;
    }

    async function listarTemplates() {
        if (!canUseTemplates || !templateSelect) {
            return;
        }

        templateSelect.innerHTML = '<option value="">Carregando templates...</option>';

        const retorno = await API.get("template_listar.php");
        if (!retorno || retorno.status !== "ok") {
            templateSelect.innerHTML = '<option value="">Nenhum template disponível</option>';
            if (loadTemplateBtn) {
                loadTemplateBtn.disabled = true;
            }
            atualizarHintTemplate((retorno && retorno.mensagem) || "Não foi possível carregar templates.", "warning");
            return;
        }

        const templates = Array.isArray(retorno.data) ? retorno.data : [];
        templateSelect.innerHTML = '<option value="">Selecione um template...</option>';

        templates.forEach((template) => {
            const option = document.createElement("option");
            option.value = String(template.id);
            option.textContent = `${template.nome} (${template.quantidade_itens || 0} item(ns))`;
            templateSelect.appendChild(option);
        });

        if (loadTemplateBtn) {
            loadTemplateBtn.disabled = templates.length === 0;
        }

        if (!templates.length) {
            atualizarHintTemplate("Você ainda não possui templates salvos para esta agência.", "info");
        } else {
            atualizarHintTemplate("");
        }
    }

    async function salvarComoTemplate() {
        const nomeTemplate = templateNameInput?.value.trim() || "";
        const descricaoTemplate = templateDescriptionInput?.value.trim() || "";

        if (!nomeTemplate) {
            alert("Informe um nome para o template.");
            return;
        }

        const itens = coletarItensFormulario();
        if (!itens.length) {
            alert("Adicione pelo menos um item para salvar o template.");
            return;
        }

        if (saveTemplateBtn) {
            saveTemplateBtn.disabled = true;
            saveTemplateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Salvando...';
        }

        try {
            const retorno = await API.post("template_salvar.php", {
                nome: nomeTemplate,
                descricao: descricaoTemplate,
                itens: JSON.stringify(itens)
            });

            if (!retorno || retorno.status !== "ok") {
                alert((retorno && retorno.mensagem) || "Erro ao salvar template.");
                return;
            }

            if (templateNameInput) {
                templateNameInput.value = "";
            }
            if (templateDescriptionInput) {
                templateDescriptionInput.value = "";
            }

            atualizarHintTemplate(`Template "${retorno.data?.nome || nomeTemplate}" salvo com sucesso.`, "success");
            await listarTemplates();
        } catch (error) {
            console.error("Erro ao salvar template:", error);
            alert("Erro ao salvar template.");
        } finally {
            if (saveTemplateBtn) {
                saveTemplateBtn.disabled = false;
                saveTemplateBtn.innerHTML = '<i class="fa-solid fa-floppy-disk me-1"></i> Salvar Template';
            }
        }
    }

    async function criarChecklistPorTemplate() {
        const templateId = templateSelect?.value || "";
        if (!templateId) {
            alert("Selecione um template para continuar.");
            return;
        }

        const titulo = document.getElementById("projectTitle").value.trim();
        const descricao = document.getElementById("projectDescription").value.trim();

        if (!titulo) {
            alert("Informe o título do projeto antes de carregar o template.");
            return;
        }

        if (loadTemplateBtn) {
            loadTemplateBtn.disabled = true;
            loadTemplateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1"></i> Criando...';
        }

        try {
            const retorno = await API.post("template_carregar.php", {
                template_id: templateId,
                titulo,
                descricao
            });

            if (!retorno || retorno.status !== "ok") {
                alert((retorno && retorno.mensagem) || "Erro ao criar checklist a partir do template.");
                return;
            }

            const token = retorno.data && retorno.data.link_hash ? retorno.data.link_hash : "";
            montarLinkCliente(token);
            atualizarHintTemplate("Checklist criado a partir do template com sucesso.", "success");
        } catch (error) {
            console.error("Erro ao criar checklist por template:", error);
            alert("Erro ao criar checklist a partir do template.");
        } finally {
            if (loadTemplateBtn) {
                loadTemplateBtn.disabled = false;
                loadTemplateBtn.innerHTML = '<i class="fa-solid fa-clone me-1"></i> Criar';
            }
        }
    }

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

    if (!canUseTemplates) {
        if (templateManagerCard) {
            templateManagerCard.classList.add("d-none");
        }
    } else {
        if (templateSelect) {
            templateSelect.addEventListener("change", () => {
                if (loadTemplateBtn) {
                    loadTemplateBtn.disabled = !templateSelect.value;
                }
            });
        }

        if (saveTemplateBtn) {
            saveTemplateBtn.addEventListener("click", salvarComoTemplate);
        }

        if (loadTemplateBtn) {
            loadTemplateBtn.addEventListener("click", criarChecklistPorTemplate);
            loadTemplateBtn.disabled = true;
        }

        await listarTemplates();
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const titulo = document.getElementById("projectTitle").value.trim();
        const descricao = document.getElementById("projectDescription").value.trim();
        const itens = coletarItensFormulario();

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
        montarLinkCliente(token);
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
