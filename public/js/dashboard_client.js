document.addEventListener("DOMContentLoaded", async () => {
    const grid = document.getElementById("projects-grid");
    const emptyState = document.getElementById("empty-state");

    const statusMap = {
        pending:   { badge: "bg-warning text-dark", icon: "fa-clock", label: "Pendente" },
        review:    { badge: "bg-primary",            icon: "fa-eye",   label: "Em Revisão" },
        approved:  { badge: "bg-success",            icon: "fa-check", label: "Concluído" },
        completed: { badge: "bg-success",            icon: "fa-check", label: "Concluído" },
        rejected:  { badge: "bg-danger",             icon: "fa-triangle-exclamation", label: "Atenção" },
    };

    function criarCard(checklist) {
        const s = statusMap[checklist.status] || statusMap.pending;
        const responsavel = checklist.agencia_nome_contato || checklist.agencia_empresa || "Agência";

        const completados = checklist.itens_concluidos || 0;
        const total = checklist.total_itens || 0;
        const percent = total > 0 ? Math.round((completados / total) * 100) : 0;

        const col = document.createElement("div");
        col.className = "col-12 col-md-10 col-lg-8 mx-auto";
        col.innerHTML = `
            <div class="card card-custom border-0 shadow-sm h-100" style="border-left: 4px solid var(--navy-blue) !important;">
                <div class="card-body p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-2">
                            <h5 class="fw-bold text-navy-blue mb-0 me-3">${checklist.titulo}</h5>
                            <span class="badge ${s.badge} rounded-pill text-nowrap">
                                <i class="fa-solid ${s.icon} me-1"></i>${s.label}
                            </span>
                        </div>
                        <p class="text-muted small mb-3">
                            <i class="fa-solid fa-user-tie me-1"></i>
                            <span class="fw-semibold">${responsavel}</span>
                        </p>
                        <div class="w-100" style="max-width: 400px;">
                            <div class="d-flex justify-content-between text-muted small mb-1">
                                <span>Progresso</span>
                                <span class="fw-bold text-dark">${percent}% (${completados}/${total})</span>
                            </div>
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar bg-success" role="progressbar" style="width: ${percent}%;" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-3 mt-md-0 ms-md-4">
                        <a href="checklist_details.html?id=${checklist.id}"
                           class="btn btn-primary-custom px-4 py-2 text-nowrap shadow-sm">
                            <i class="fa-solid fa-folder-open me-2"></i>Abrir Projeto
                        </a>
                    </div>
                </div>
            </div>
        `;
        return col;
    }

    async function carregarProjetos() {
        const retorno = await ApiClientFlow.get("cliente_checklists_listar.php");
        if (retorno.status !== "ok" || !retorno.data || !retorno.data.length) {
            emptyState.classList.remove("d-none");
            return;
        }
        retorno.data.forEach(c => grid.appendChild(criarCard(c)));
    }

    try {
        const sessao = await ApiClientFlow.get("valida_sessao_logado.php");
        if (sessao.status !== "ok") { window.location.href = "login.html"; return; }
        if (!sessao.data || sessao.data.tipo !== "client") { window.location.href = "dashboard_agency.html"; return; }

        if (window.ClientFlowIdentity) {
            window.ClientFlowIdentity.apply(sessao.data, { avatarBackground: "E63946" });
        }

        await carregarProjetos();

        const logoutLink = document.querySelector(".js-logout-link");
        if (logoutLink) {
            logoutLink.addEventListener("click", async (e) => {
                e.preventDefault();
                await ApiClientFlow.post("usuario_logoff.php");
                window.location.href = "../../index.html";
            });
        }
    } catch (e) {
        console.error("Dashboard error:", e);
        // window.location.href = "login.html";
    }
});
