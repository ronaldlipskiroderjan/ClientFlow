class SidebarManager {
    static async init() {
        this.mountLayout();

        const user = await Auth.validateSession();
        const role = Auth.getTipo();
        const papel = Auth.get("papel_agencia");
        const displayName = user
            ? (user.nome_empresa || user.nome_responsavel || user.nome || "Usuário")
            : "Usuário";

        const userNameEl = document.getElementById("sidebarUserName");
        const userRoleEl = document.getElementById("sidebarUserRole");
        const userAvatarEl = document.getElementById("userAvatar");

        if (userNameEl) {
            userNameEl.textContent = displayName;
        }
        if (userRoleEl) {
            userRoleEl.textContent = this.getRoleLabel(role, papel);
        }
        if (userAvatarEl) {
            userAvatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4F46E5&color=fff&size=96`;
        }

        let navHtml = "";
        if (role === "agency" || role === "agency_member") {
            navHtml = this.getAgencyNav(papel);
        } else if (role === "freelancer") {
            navHtml = this.getFreelancerNav();
        } else if (role === "client") {
            navHtml = this.getClientNav();
        }

        const navContainer = document.getElementById("sidebarNav");
        if (navContainer) {
            navContainer.innerHTML = navHtml;
        }

        const currentPath = window.location.pathname.split("/").pop();
        document.querySelectorAll("#sidebarNav .sidebar-nav-link").forEach((link) => {
            if (link.getAttribute("href") === currentPath) {
                link.classList.add("active");
            }
        });

        const toggleBtn = document.getElementById("sidebarToggleBtn");
        const offcanvas = document.getElementById("sidebarOffcanvas");
        if (toggleBtn && offcanvas) {
            const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvas);
            toggleBtn.addEventListener("click", () => bsOffcanvas.toggle());
        }
    }

    static mountLayout() {
        if (!document.getElementById("clientflow-topbar")) {
            const navbarHtml = `
                <nav id="clientflow-topbar" class="navbar app-topbar sticky-top">
                    <div class="container-fluid px-3 px-md-4">
                        <div class="d-flex align-items-center gap-2">
                            <button class="btn btn-icon-soft" id="sidebarToggleBtn" type="button" title="Abrir menu">
                                <i class="fas fa-bars fs-6"></i>
                            </button>
                            <span class="app-brand mb-0 h5">
                                <i class="fas fa-layer-group me-2 text-primary"></i>ClientFlow
                            </span>
                        </div>
                        <img id="userAvatar" src="" alt="Avatar" class="app-avatar">
                    </div>
                </nav>
            `;
            const navbarContainer = document.createElement("div");
            navbarContainer.innerHTML = navbarHtml.trim();
            document.body.insertBefore(navbarContainer.firstElementChild, document.body.firstChild);
        }

        if (!document.getElementById("sidebarOffcanvas")) {
            const sidebarHtml = `
                <div class="offcanvas offcanvas-start sidebar-offcanvas shadow-lg" id="sidebarOffcanvas" tabindex="-1" style="width: 292px;">
                    <div class="offcanvas-header py-3 px-3">
                        <div>
                            <h5 class="offcanvas-title fw-bold text-primary mb-1">
                                <i class="fas fa-layer-group me-2"></i>ClientFlow
                            </h5>
                            <div class="sidebar-user-label">Bem-vindo de volta</div>
                            <div class="fw-semibold text-navy-blue mt-1" id="sidebarUserName">Usuário</div>
                            <span class="sidebar-role-pill mt-2" id="sidebarUserRole">Conta</span>
                        </div>
                        <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Fechar"></button>
                    </div>
                    <div class="offcanvas-body p-3 d-flex flex-column">
                        <div class="sidebar-section-label">Navegação</div>
                        <div class="nav flex-column gap-1" id="sidebarNav"></div>
                        <div class="mt-auto pt-3 border-top">
                            <button class="btn btn-outline-danger sidebar-logout-btn w-100 text-start" onclick="Auth.logout()">
                                <i class="fas fa-sign-out-alt me-2"></i><span>Sair</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            const sidebarContainer = document.createElement("div");
            sidebarContainer.innerHTML = sidebarHtml.trim();
            document.body.appendChild(sidebarContainer.firstElementChild);
        }
    }

    static getRoleLabel(role, papel) {
        if (role === "client") return "Cliente";
        if (role === "freelancer") return "Freelancer";
        if (role === "agency" || role === "agency_member") {
            const roleMap = {
                admin_agencia: "Owner Agência",
                gerente: "Gerente",
                dev: "Especialista",
                gestor_cliente: "Atendimento",
                financeiro: "Financeiro"
            };
            return roleMap[papel] || "Agência";
        }
        return "Usuário";
    }

    static getAgencyNav(papel) {
        return `
            <a href="dashboard_agency.html" class="sidebar-nav-link nav-link">
                <i class="fas fa-home"></i><span>Dashboard</span>
            </a>
            ${Auth.hasAccess("perm_ver_projetos") || Auth.hasAccess("perm_criar_projetos") ? `
            <a href="checklists.html" class="sidebar-nav-link nav-link">
                <i class="fas fa-tasks"></i><span>Projetos / Formulários</span>
            </a>` : ""}
            ${Auth.hasAccess("perm_ver_clientes") || Auth.hasAccess("perm_criar_clientes") ? `
            <a href="clients.html" class="sidebar-nav-link nav-link">
                <i class="fas fa-users"></i><span>Clientes</span>
            </a>` : ""}
            ${Auth.hasAccess("perm_financeiro") ? `
            <a href="financeiro.html" class="sidebar-nav-link nav-link">
                <i class="fas fa-file-invoice-dollar"></i><span>Contratos & Repasses</span>
            </a>` : ""}
            ${Auth.hasAccess("perm_gerenciar_membros") || papel === "admin_agencia" ? `
            <hr class="my-2">
            <a href="agency_team.html" class="sidebar-nav-link nav-link">
                <i class="fas fa-users-cog"></i><span>Equipe da Agência</span>
            </a>` : ""}
        `;
    }

    static getFreelancerNav() {
        return `
            <a href="dashboard_agency.html" class="sidebar-nav-link nav-link">
                <i class="fas fa-home"></i><span>Dashboard</span>
            </a>
            <a href="checklists.html" class="sidebar-nav-link nav-link">
                <i class="fas fa-tasks"></i><span>Meus Projetos</span>
            </a>
            <a href="clients.html" class="sidebar-nav-link nav-link">
                <i class="fas fa-address-book"></i><span>Clientes</span>
            </a>
        `;
    }

    static getClientNav() {
        return `
            <a href="dashboard_client.html" class="sidebar-nav-link nav-link">
                <i class="fas fa-folder-open"></i><span>Meus Projetos</span>
            </a>
        `;
    }
}

window.SidebarManager = SidebarManager;
