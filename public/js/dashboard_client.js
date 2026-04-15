document.addEventListener("DOMContentLoaded", async () => {
    const grid = document.getElementById("projects-grid");
    const loadingState = document.getElementById("projects-loading");
    const emptyState = document.getElementById("empty-state");
    const errorState = document.getElementById("error-state");

    const kpiTotal = document.getElementById("client-kpi-total");
    const kpiPending = document.getElementById("client-kpi-pending");
    const kpiFinished = document.getElementById("client-kpi-finished");

    const statusMap = {
        pending: { badge: "bg-warning text-dark", icon: "fa-clock", label: "Pendente" },
        review: { badge: "bg-primary", icon: "fa-eye", label: "Em Revisão" },
        approved: { badge: "bg-success", icon: "fa-check", label: "Concluído" },
        completed: { badge: "bg-success", icon: "fa-check", label: "Concluído" },
        rejected: { badge: "bg-danger", icon: "fa-triangle-exclamation", label: "Atenção" }
    };

    function setViewState(state) {
        if (loadingState) loadingState.classList.toggle("d-none", state !== "loading");
        if (grid) grid.classList.toggle("d-none", state !== "content");
        if (emptyState) emptyState.classList.toggle("d-none", state !== "empty");
        if (errorState) errorState.classList.toggle("d-none", state !== "error");
    }

    function atualizarKpis(projects = []) {
        const total = projects.length;
        const done = projects.filter((project) => project.status === "approved" || project.status === "completed").length;
        const pending = projects.filter((project) => project.status === "pending" || project.status === "review" || project.status === "rejected").length;

        if (kpiTotal) kpiTotal.textContent = total;
        if (kpiPending) kpiPending.textContent = pending;
        if (kpiFinished) kpiFinished.textContent = done;
    }

    function criarCard(checklist) {
        const status = statusMap[checklist.status] || statusMap.pending;
        const responsavel = checklist.agencia_nome_contato || checklist.agencia_empresa || "Agência";
        const totalItens = Number(checklist.total_itens || 0);
        const itensConcluidos = Number(checklist.itens_concluidos || 0);
        const percent = totalItens > 0 ? Math.round((itensConcluidos / totalItens) * 100) : 0;

        const col = document.createElement("div");
        col.className = "col-12 col-xl-6";
        col.innerHTML = `
            <div class="card card-custom border-0 h-100">
                <div class="card-body p-4">
                    <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
                        <div>
                            <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
                                <h5 class="fw-bold text-navy-blue mb-0">${checklist.titulo}</h5>
                                <span class="badge ${status.badge} rounded-pill text-nowrap">
                                    <i class="fa-solid ${status.icon} me-1"></i>${status.label}
                                </span>
                            </div>
                            <p class="text-muted small mb-0">${checklist.descricao || "Sem descrição adicional para este projeto."}</p>
                        </div>
                        <a href="checklist_details.html?id=${checklist.id}" class="btn btn-primary-custom btn-sm text-nowrap">
                            <i class="fa-solid fa-folder-open me-2"></i>Abrir Projeto
                        </a>
                    </div>

                    <div class="d-flex flex-wrap gap-2 mb-3">
                        <span class="status-pill">
                            <i class="fa-solid fa-user-tie text-primary"></i>${responsavel}
                        </span>
                        <span class="status-pill">
                            <i class="fa-solid fa-list-check text-success"></i>${totalItens} item(s)
                        </span>
                    </div>

                    <div>
                        <div class="d-flex justify-content-between text-muted small mb-1">
                            <span>Progresso</span>
                            <span class="fw-semibold text-dark">${percent}% (${itensConcluidos}/${totalItens})</span>
                        </div>
                        <div class="progress progress-soft">
                            <div class="progress-bar bg-success" role="progressbar" style="width: ${percent}%" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return col;
    }

    async function carregarProjetos() {
        setViewState("loading");
        if (grid) {
            grid.innerHTML = "";
        }

        const retorno = await API.get("cliente_checklists_listar.php");
        if (!retorno || retorno.status !== "ok") {
            atualizarKpis([]);
            setViewState("error");
            return;
        }

        const projetos = Array.isArray(retorno.data) ? retorno.data : [];
        atualizarKpis(projetos);

        if (!projetos.length) {
            setViewState("empty");
            return;
        }

        projetos.forEach((project) => {
            if (grid) {
                grid.appendChild(criarCard(project));
            }
        });
        setViewState("content");
    }

    try {
        await SidebarManager.init();

        const sessao = await Auth.validateSession();
        if (!sessao) {
            window.location.href = "login.html";
            return;
        }
        if (sessao.tipo !== "client") {
            window.location.href = "dashboard_agency.html";
            return;
        }

        if (window.ClientFlowIdentity) {
            window.ClientFlowIdentity.apply(sessao, {
                avatarBackground: "4F46E5"
            });
        }

        await carregarProjetos();
    } catch (error) {
        console.error("Dashboard client error:", error);
        setViewState("error");
    }
});
