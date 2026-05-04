const TIPO_LABELS = {
    text: "Texto",
    long_text: "Texto longo",
    file: "Arquivo",
    image: "Imagem",
    url: "URL"
};

const TIPO_BADGE_COLOR = {
    text: "badge bg-secondary",
    long_text: "badge bg-secondary",
    file: "badge text-white bg-primary",
    image: "badge text-white bg-success",
    url: "badge text-white bg-info"
};

const TIPOS_VALIDOS = Object.keys(TIPO_LABELS);

let itensColetados = [];
let editandoId = null;
let salvando = false;
let proximoId = 1;

function escapeHtml(valor) {
    if (!valor) {
        return "";
    }

    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function exibirAlertaItem(mensagem) {
    const alerta = document.getElementById("alerta_item");
    const texto = document.getElementById("alerta_item_msg");

    if (!alerta || !texto) {
        return;
    }

    texto.textContent = mensagem;
    alerta.classList.remove("d-none");
}

function ocultarAlertaItem() {
    const alerta = document.getElementById("alerta_item");
    if (alerta) {
        alerta.classList.add("d-none");
    }
}

function exibirAlertaGeral(mensagem, tipo = "danger") {
    const alerta = document.getElementById("alerta_geral");
    const texto = document.getElementById("alerta_geral_msg");

    if (!alerta || !texto) {
        return;
    }

    alerta.className = `alert alert-${tipo}`;
    texto.textContent = mensagem;
    alerta.classList.remove("d-none");

    if (tipo === "success") {
        setTimeout(() => alerta.classList.add("d-none"), 4000);
    }
}

function setBtnSalvar(estadoCarregando) {
    const botao = document.querySelector('[data-acao="salvar"]');

    if (!botao) {
        return;
    }

    botao.disabled = estadoCarregando;
    botao.innerHTML = estadoCarregando
        ? '<span class="spinner-border spinner-border-sm me-1"></span> Salvando...'
        : '<i class="fa-solid fa-floppy-disk me-1"></i> Salvar checklist';
}

function limparFormularioItem() {
    document.getElementById("item_nome").value = "";
    document.getElementById("item_desc").value = "";
    document.getElementById("item_tipo").value = "text";
    document.getElementById("item_nome").focus();
}

function adicionarItemNaLista() {
    const nome = document.getElementById("item_nome").value.trim();
    const descricao = document.getElementById("item_desc").value.trim();
    const tipo = document.getElementById("item_tipo").value;

    if (!nome) {
        exibirAlertaItem("O nome do item é obrigatório.");
        return;
    }

    ocultarAlertaItem();
    itensColetados.push({ id: proximoId++, nome, descricao, tipo });
    limparFormularioItem();
    renderizarTabela();
}

function editarItem(id) {
    const item = itensColetados.find((entrada) => entrada.id === id);

    if (!item) {
        return;
    }

    editandoId = id;
    document.getElementById("edit_nome").value = item.nome;
    document.getElementById("edit_desc").value = item.descricao;
    document.getElementById("edit_tipo").value = item.tipo;
    document.getElementById("edit_row_container").classList.remove("d-none");
}

function confirmarEdicao() {
    const nome = document.getElementById("edit_nome").value.trim();
    const descricao = document.getElementById("edit_desc").value.trim();
    const tipo = document.getElementById("edit_tipo").value;

    if (!nome) {
        exibirAlertaItem("O nome do item é obrigatório.");
        return;
    }

    const indice = itensColetados.findIndex((item) => item.id === editandoId);

    if (indice !== -1) {
        itensColetados[indice] = { id: editandoId, nome, descricao, tipo };
    }

    cancelarEdicao();
    renderizarTabela();
}

function cancelarEdicao() {
    editandoId = null;
    document.getElementById("edit_row_container").classList.add("d-none");
    document.getElementById("edit_nome").value = "";
    document.getElementById("edit_desc").value = "";
    document.getElementById("edit_tipo").value = "text";
}

function removerItem(id) {
    if (!confirm("Deseja remover este item?")) {
        return;
    }

    itensColetados = itensColetados.filter((item) => item.id !== id);

    if (editandoId === id) {
        cancelarEdicao();
    }

    renderizarTabela();
}

function renderizarTabela() {
    const corpo = document.getElementById("tabela_itens");
    const vazio = document.getElementById("tabela_vazia");
    const contador = document.getElementById("contador_itens");

    if (!corpo || !vazio || !contador) {
        return;
    }

    corpo.innerHTML = "";

    if (itensColetados.length === 0) {
        vazio.classList.remove("d-none");
        contador.textContent = "0 item(s)";
        return;
    }

    vazio.classList.add("d-none");
    contador.textContent = `${itensColetados.length} item(s)`;

    itensColetados.forEach((item, index) => {
        const linha = document.createElement("tr");

        const botaoEditar = document.createElement("button");
        botaoEditar.className = "btn btn-sm btn-outline-secondary me-1";
        botaoEditar.innerHTML = '<i class="fa-solid fa-pen"></i>';
        botaoEditar.title = "Editar item";
        botaoEditar.addEventListener("click", () => editarItem(item.id));

        const botaoRemover = document.createElement("button");
        botaoRemover.className = "btn btn-sm btn-outline-danger";
        botaoRemover.innerHTML = '<i class="fa-solid fa-trash"></i>';
        botaoRemover.title = "Remover item";
        botaoRemover.addEventListener("click", () => removerItem(item.id));

        linha.innerHTML = `
            <td>${index + 1}</td>
            <td>${escapeHtml(item.nome)}</td>
            <td class="text-muted">${escapeHtml(item.descricao)}</td>
            <td><span class="${TIPO_BADGE_COLOR[item.tipo]}">${TIPO_LABELS[item.tipo]}</span></td>
            <td class="text-end"></td>
        `;

        linha.querySelector("td.text-end").append(botaoEditar, botaoRemover);
        corpo.appendChild(linha);
    });
}

async function salvarChecklistCompleto() {
    if (salvando) {
        return;
    }

    const titulo = document.getElementById("checklist_titulo").value.trim();
    const descricao = document.getElementById("checklist_descricao").value.trim();

    if (!titulo) {
        exibirAlertaGeral("Informe o título do checklist.");
        return;
    }

    if (itensColetados.length === 0) {
        exibirAlertaGeral("Adicione pelo menos um item antes de salvar.");
        return;
    }

    salvando = true;
    setBtnSalvar(true);

    try {
        const itensValidos = itensColetados.filter((item) => item.nome.trim() && TIPOS_VALIDOS.includes(item.tipo));
        const retorno = await ApiClientFlow.post("checklist_criar.php", {
            titulo,
            descricao,
            itens: JSON.stringify(itensValidos)
        });

        if (retorno.status !== "ok") {
            exibirAlertaGeral(retorno.mensagem || "Erro ao salvar checklist.");
            return;
        }

        exibirAlertaGeral("Checklist criado com sucesso! Redirecionando...", "success");
        setTimeout(() => {
            window.location.href = "dashboard_agency.html";
        }, 1500);
    } catch (error) {
        console.error("[ClientFlow] Erro ao salvar checklist:", error);
        exibirAlertaGeral("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
        salvando = false;
        setBtnSalvar(false);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const sessao = await ApiClientFlow.get("valida_sessao_logado.php");

        if (sessao.status !== "ok") {
            window.location.href = "login.html";
            return;
        }

        if (sessao.data && sessao.data.tipo === "client") {
            window.location.href = "dashboard_client.html";
            return;
        }

        if (window.ClientFlowIdentity) {
            window.ClientFlowIdentity.apply(sessao.data, {
                avatarBackground: "0D8ABC"
            });
        }

        const logoutLink = document.querySelector(".js-logout-link");
        if (logoutLink) {
            logoutLink.addEventListener("click", async (event) => {
                event.preventDefault();
                await ApiClientFlow.post("usuario_logoff.php");
                window.location.href = "../../index.html";
            });
        }

        ["item_nome", "item_desc"].forEach((id) => {
            const input = document.getElementById(id);
            if (!input) {
                return;
            }

            input.addEventListener("keydown", (event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    adicionarItemNaLista();
                }
            });
        });

        const copiarBotao = document.getElementById("copyLinkBtn");
        if (copiarBotao) {
            copiarBotao.addEventListener("click", async () => {
                const linkInput = document.getElementById("projectLinkInput");
                if (!linkInput || !linkInput.value) {
                    return;
                }

                await navigator.clipboard.writeText(linkInput.value);
                copiarBotao.textContent = "Copiado";
                setTimeout(() => {
                    copiarBotao.textContent = "Copiar";
                }, 1500);
            });
        }

        renderizarTabela();
    } catch (error) {
        window.location.href = "login.html";
    }
});