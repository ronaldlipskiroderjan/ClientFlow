const TIPO_LABELS = {
    text:      "Texto",
    long_text: "Texto longo",
    file:      "Arquivo",
    image:     "Imagem",
    url:       "URL",
};
 
const TIPOS_VALIDOS = Object.keys(TIPO_LABELS);
 
const TIPO_BADGE_COLOR = {
    text:      "badge bg-secondary",
    long_text: "badge bg-secondary",
    file:      "badge text-white bg-primary",
    image:     "badge text-white bg-success",
    url:       "badge text-white bg-info",
};
  
let itensColetados = [];
let editandoId     = null;
let salvando       = false;
let _nextId        = 1;
  
function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
 
function exibirAlertaItem(msg) {
    const el = document.getElementById("alerta_item");
    el.querySelector("#alerta_item_msg").textContent = msg;
    el.classList.remove("d-none");
}
 
function ocultarAlertaItem() {
    document.getElementById("alerta_item").classList.add("d-none");
}
 
function exibirAlertaGeral(msg, tipo = "danger") {
    const el  = document.getElementById("alerta_geral");
    const txt = document.getElementById("alerta_geral_msg");
    el.className    = `alert alert-${tipo} py-2`;
    txt.textContent = msg;
    el.classList.remove("d-none");
    if (tipo === "success") setTimeout(() => el.classList.add("d-none"), 4000);
}
 
function setBtnSalvar(loading) {
    const btn = document.querySelector('[data-acao="salvar"]');
    if (!btn) return;
    btn.disabled  = loading;
    btn.innerHTML = loading
        ? '<span class="spinner-border spinner-border-sm me-1"></span> Salvando...'
        : '<i class="fa-solid fa-floppy-disk me-1"></i> Salvar checklist';
}
 
function limparFormulario() {
    document.getElementById("item_nome").value = "";
    document.getElementById("item_desc").value = "";
    document.getElementById("item_tipo").value = "text";
    document.getElementById("item_nome").focus();
}
  
function adicionarItemNaLista() {
    const nome      = document.getElementById("item_nome").value.trim();
    const descricao = document.getElementById("item_desc").value.trim();
    const tipo      = document.getElementById("item_tipo").value;
 
    if (!nome) {
        exibirAlertaItem("O nome do item é obrigatório.");
        return;
    }
 
    ocultarAlertaItem();
    itensColetados.push({ id: _nextId++, nome, descricao, tipo });
    limparFormulario();
    renderizarTabela();
}
 
function editarItem(id) {
    const item = itensColetados.find(i => i.id === id);
    if (!item) return;
 
    editandoId = id;
    document.getElementById("edit_nome").value = item.nome;
    document.getElementById("edit_desc").value = item.descricao;
    document.getElementById("edit_tipo").value = item.tipo;
    document.getElementById("edit_row_container").classList.remove("d-none");
}
 
function confirmarEdicao() {
    const nome      = document.getElementById("edit_nome").value.trim();
    const descricao = document.getElementById("edit_desc").value.trim();
    const tipo      = document.getElementById("edit_tipo").value;
 
    if (!nome) {
        exibirAlertaItem("O nome do item é obrigatório.");
        return;
    }
 
    const index = itensColetados.findIndex(i => i.id === editandoId);
    if (index !== -1) {
        itensColetados[index] = { id: editandoId, nome, descricao, tipo };
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
    if (!confirm("Deseja remover este item?")) return;
    itensColetados = itensColetados.filter(i => i.id !== id);
    if (editandoId === id) cancelarEdicao();
    renderizarTabela();
}
  
function renderizarTabela() {
    const corpo    = document.getElementById("tabela_itens");
    const vazio    = document.getElementById("tabela_vazia");
    const contador = document.getElementById("contador_itens");
 
    corpo.innerHTML = "";
 
    if (itensColetados.length === 0) {
        vazio.classList.remove("d-none");
        contador.textContent = "0 item(s)";
        return;
    }
 
    vazio.classList.add("d-none");
    contador.textContent = `${itensColetados.length} item(s)`;
 
    itensColetados.forEach((item, index) => {
        const tr = document.createElement("tr");
 
        const btnEditar = document.createElement("button");
        btnEditar.className = "btn btn-sm btn-outline-secondary me-1";
        btnEditar.innerHTML = '<i class="fa-solid fa-pen"></i>';
        btnEditar.title     = "Editar item";
        btnEditar.addEventListener("click", () => editarItem(item.id));
 
        const btnRemover = document.createElement("button");
        btnRemover.className = "btn btn-sm btn-outline-danger";
        btnRemover.innerHTML = '<i class="fa-solid fa-trash"></i>';
        btnRemover.title     = "Remover item";
        btnRemover.addEventListener("click", () => removerItem(item.id));
 
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${escapeHtml(item.nome)}</td>
            <td class="text-muted">${escapeHtml(item.descricao)}</td>
            <td><span class="${TIPO_BADGE_COLOR[item.tipo]}">${TIPO_LABELS[item.tipo]}</span></td>
            <td class="text-end"></td>
        `;
 
        tr.querySelector("td.text-end").append(btnEditar, btnRemover);
        corpo.appendChild(tr);
    });
}
  
async function salvarChecklistCompleto() {
    if (salvando) return;
 
    const titulo    = document.getElementById("checklist_titulo").value.trim();
    const descricao = document.getElementById("checklist_descricao").value.trim();
 
    if (!titulo) {
        exibirAlertaGeral("Informe o título do checklist.", "danger");
        return;
    }
    if (itensColetados.length === 0) {
        exibirAlertaGeral("Adicione pelo menos um item antes de salvar.", "danger");
        return;
    }
 
    salvando = true;
    setBtnSalvar(true);
 
    try {
        const itensValidos = itensColetados.filter(
            i => i.nome.trim() && TIPOS_VALIDOS.includes(i.tipo)
        );
 
        const result = await ApiClientFlow.post("agencia_checklist_criar.php", {
            titulo,
            descricao,
            itens: itensValidos,
        });
 
        if (result.status === "ok") {
            exibirAlertaGeral("Checklist criado com sucesso! Redirecionando...", "success");
            setTimeout(() => { window.location.href = "dashboard_agency.html"; }, 1500);
        } else {
            exibirAlertaGeral(result.mensagem || "Erro ao salvar. Tente novamente.", "danger");
        }
 
    } catch (error) {
        console.error("[ClientFlow] Erro ao salvar checklist:", error);
        exibirAlertaGeral("Erro de conexão. Verifique sua internet e tente novamente.", "danger");
    } finally {
        salvando = false;
        setBtnSalvar(false);
    }
}
  
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // 1. Valida sessão
        const sessao = await ApiClientFlow.get("valida_sessao_logado.php");
        if (sessao.status !== "ok") {
            window.location.href = "login.html";
            return;
        }
 
        if (sessao.data && sessao.data.tipo === "client") {
            window.location.href = "dashboard_client.html";
            return;
        }
 
        // 2. Preenche nome do usuário
        const nomeUsuario = sessao.data && sessao.data.nome ? sessao.data.nome : "Usuário";
 
        document.querySelectorAll(".text-navy-blue.fw-bold").forEach((el) => {
            if (el.textContent.includes("Olá,")) {
                el.innerHTML = `Olá, <span class="fw-bold text-navy-blue">${nomeUsuario}</span>`;
            }
        });
 
        const nomeSidebar = document.querySelector(".dropdown strong");
        if (nomeSidebar) {
            nomeSidebar.textContent = nomeUsuario;
        }
 
        const avatar = document.querySelector(".dropdown img");
        if (avatar) {
            avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeUsuario)}&background=0D8ABC&color=fff`;
        }
 
    
        ["item_nome", "item_desc"].forEach(id => {
            document.getElementById(id).addEventListener("keydown", e => {
                if (e.key === "Enter") { e.preventDefault(); adicionarItemNaLista(); }
            });
        });
 
    
        const btnCriarChecklist = document.getElementById("btnCriarChecklist");
        if (btnCriarChecklist) {
            btnCriarChecklist.addEventListener("click", () => {
                window.location.href = "dashboard_agency_create.html";
            });
        }

        const btnLogoff = document.querySelector(".dropdown-item.text-danger");
        if (btnLogoff) {
            btnLogoff.addEventListener("click", async (event) => {
                event.preventDefault();
                await ApiClientFlow.post("usuario_logoff.php");
                window.location.href = "../../index.html";
            });
        }
 
    } catch (error) {
        window.location.href = "login.html";
    }
});
 