class SidebarManager {
    static async init() {
        this.mountLayout();

        // Bind theme toggle now that the sidebar DOM exists
        if (window.ClientFlowTheme) {
            window.ClientFlowTheme.bindToggles();
        }

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
            // Usa foto real se existir, senão gera avatar com iniciais
            const fotoPath = user ? user.foto_path : null;
            userAvatarEl.src = fotoPath
                ? "../../" + fotoPath
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4F46E5&color=fff&size=96`;
        }

        ProfileModal.init();
        const openProfileBtn = document.getElementById("openProfileBtn");
        if (openProfileBtn) {
            openProfileBtn.addEventListener("click", () => ProfileModal.open());
        }

        let navHtml = "";
        if (role === "agency" || role === "agency_member") {
            navHtml = this.getAgencyNav(papel);
        } else if (role === "client") {
            navHtml = this.getClientNav();
        } else if (role === "admin") {
            navHtml = this.getAdminNav();
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
                        <button type="button" class="btn p-0 border-0 bg-transparent app-avatar-btn" id="openProfileBtn" title="Meu Perfil">
                            <img id="userAvatar" src="" alt="Avatar" class="app-avatar">
                        </button>
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
                            <h5 class="offcanvas-title fw-bold mb-1">
                                <i class="fas fa-layer-group me-2 text-primary"></i><span class="app-brand">ClientFlow</span>
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
                        <div class="mt-auto pt-3 border-top d-flex flex-column gap-2">
                            <button type="button" class="sidebar-theme-btn" data-theme-toggle="sidebar" id="sidebarThemeBtn">
                                <i class="fa-solid fa-moon fs-6"></i>
                                <span id="sidebarThemeBtnLabel">Modo Escuro</span>
                            </button>
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

        if (!document.getElementById("profileModal")) {
            const modalHtml = `
                <div class="modal fade" id="profileModal" tabindex="-1" aria-labelledby="profileModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div class="modal-content">
                            <div class="modal-header border-bottom py-3">
                                <div class="d-flex align-items-center gap-3">
                                    <img id="profileModalAvatar" src="" alt="Avatar" class="rounded-3" style="width:48px;height:48px;object-fit:cover;">
                                    <div>
                                        <h5 class="modal-title fw-bold mb-0" id="profileModalLabel">Meu Perfil</h5>
                                        <small class="text-muted" id="profileModalRole"></small>
                                    </div>
                                </div>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                            </div>
                            <div class="modal-body p-0">
                                <ul class="nav nav-tabs profile-modal-tabs px-4 pt-3" id="profileTabs" role="tablist">
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link active" id="tab-perfil-btn" data-bs-toggle="tab" data-bs-target="#tabPerfil" type="button" role="tab">
                                            <i class="fas fa-user me-2"></i>Meu Perfil
                                        </button>
                                    </li>
                                    <li class="nav-item" role="presentation" id="tabEmpresaItem" style="display:none">
                                        <button class="nav-link" id="tab-empresa-btn" data-bs-toggle="tab" data-bs-target="#tabEmpresa" type="button" role="tab">
                                            <i class="fas fa-building me-2"></i>Dados da Empresa
                                        </button>
                                    </li>
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link" id="tab-senha-btn" data-bs-toggle="tab" data-bs-target="#tabSenha" type="button" role="tab">
                                            <i class="fas fa-lock me-2"></i>Segurança
                                        </button>
                                    </li>
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link profile-tab-danger" id="tab-excluir-btn" data-bs-toggle="tab" data-bs-target="#tabExcluir" type="button" role="tab">
                                            <i class="fas fa-user-slash me-2"></i>Desativar Conta
                                        </button>
                                    </li>
                                </ul>

                                <div class="tab-content p-4" id="profileTabsContent">
                                    <!-- Tab: Meu Perfil -->
                                    <div class="tab-pane fade show active" id="tabPerfil" role="tabpanel">
                                        <form id="formPerfil" novalidate>
                                            <!-- Foto de perfil -->
                                            <div class="d-flex align-items-center gap-4 mb-4 pb-3 border-bottom">
                                                <div class="profile-photo-wrap" id="profilePhotoWrap" title="Clique para trocar a foto">
                                                    <img id="profilePhotoPreview" src="" alt="Foto de perfil" class="profile-photo-img">
                                                    <div class="profile-photo-overlay">
                                                        <i class="fas fa-camera"></i>
                                                    </div>
                                                    <input type="file" id="profilePhotoInput" accept="image/jpeg,image/png,image/webp,image/gif" class="d-none">
                                                </div>
                                                <div>
                                                    <p class="fw-semibold mb-1">Foto de Perfil</p>
                                                    <p class="text-muted small mb-2">JPG, PNG, WEBP ou GIF · Máx. 5 MB</p>
                                                    <button type="button" class="btn btn-sm btn-outline-secondary" id="profilePhotoBtn">
                                                        <i class="fas fa-upload me-1"></i>Escolher foto
                                                    </button>
                                                    <div id="alertFoto" class="alert alert-sm d-none mt-2 mb-0 py-2 px-3 small" role="alert"></div>
                                                </div>
                                            </div>
                                            <div class="mb-3">
                                                <label for="perfilNome" class="form-label fw-semibold">Nome</label>
                                                <input type="text" class="form-control" id="perfilNome" required>
                                            </div>
                                            <div class="mb-3">
                                                <label for="perfilEmail" class="form-label fw-semibold">E-mail</label>
                                                <input type="email" class="form-control" id="perfilEmail" readonly>
                                                <div class="form-text">O e-mail não pode ser alterado.</div>
                                            </div>
                                            <div class="mb-3">
                                                <label for="perfilTelefone" class="form-label fw-semibold">Telefone</label>
                                                <input type="text" class="form-control" id="perfilTelefone" placeholder="(00) 00000-0000">
                                            </div>
                                            <label for="perfilProvaAutoria" class="form-label fw-semibold">Nome da Mãe</label>
                                            <input type="text" class="form-control" id="perfilProvaAutoria" placeholder="Alterar nome da mãe">
                                            </div>
                                            <div id="alertPerfil" class="alert d-none" role="alert"></div>
                                            <button type="submit" class="btn btn-primary">
                                                <i class="fas fa-save me-2"></i>Salvar Alterações
                                            </button>
                                        </form>
                                    </div>

                                    <!-- Tab: Dados da Empresa (somente proprietário agency) -->
                                    <div class="tab-pane fade" id="tabEmpresa" role="tabpanel">
                                        <form id="formEmpresa" novalidate>
                                            <div class="mb-3">
                                                <label for="agNomeEmpresa" class="form-label fw-semibold">Nome da Empresa</label>
                                                <input type="text" class="form-control" id="agNomeEmpresa" required>
                                            </div>
                                            <div class="mb-3">
                                                <label for="agCnpj" class="form-label fw-semibold">CNPJ</label>
                                                <input type="text" class="form-control" id="agCnpj" placeholder="00.000.000/0000-00">
                                            </div>
                                            <div class="row g-3 mb-3">
                                                <div class="col-md-6">
                                                    <label for="agTelefone" class="form-label fw-semibold">Telefone da Empresa</label>
                                                    <input type="text" class="form-control" id="agTelefone" placeholder="(00) 0000-0000">
                                                </div>
                                                <div class="col-md-6">
                                                    <label for="agSite" class="form-label fw-semibold">Site</label>
                                                    <input type="text" class="form-control" id="agSite" placeholder="https://...">
                                                </div>
                                            </div>
                                            <div class="mb-3">
                                                <label for="agDescricao" class="form-label fw-semibold">Descrição</label>
                                                <textarea class="form-control" id="agDescricao" rows="3" placeholder="Descreva sua empresa..."></textarea>
                                            </div>
                                            <div id="alertEmpresa" class="alert d-none" role="alert"></div>
                                            <button type="submit" class="btn btn-primary">
                                                <i class="fas fa-save me-2"></i>Salvar Dados da Empresa
                                            </button>
                                        </form>
                                    </div>

                                    <!-- Tab: Segurança -->
                                    <div class="tab-pane fade" id="tabSenha" role="tabpanel">
                                        <form id="formSenha" novalidate>
                                            <div class="mb-3">
                                                <label for="senhaAtual" class="form-label fw-semibold">Senha Atual</label>
                                                <input type="password" class="form-control" id="senhaAtual" autocomplete="current-password">
                                            </div>
                                            <div class="mb-3">
                                                <label for="novaSenha" class="form-label fw-semibold">Nova Senha</label>
                                                <input type="password" class="form-control" id="novaSenha" autocomplete="new-password">
                                                <div class="form-text">Mínimo de 8 caracteres.</div>
                                            </div>
                                            <div class="mb-3">
                                                <label for="confirmarSenha" class="form-label fw-semibold">Confirmar Nova Senha</label>
                                                <input type="password" class="form-control" id="confirmarSenha" autocomplete="new-password">
                                            </div>
                                            <div id="alertSenha" class="alert d-none" role="alert"></div>
                                            <button type="submit" class="btn btn-primary">
                                                <i class="fas fa-lock me-2"></i>Alterar Senha
                                            </button>
                                        </form>
                                    </div>

                                    <!-- Tab: Excluir Conta -->
                                    <div class="tab-pane fade" id="tabExcluir" role="tabpanel">
                                        <div class="alert alert-danger d-flex gap-2 align-items-start mb-4">
                                            <i class="fas fa-exclamation-triangle mt-1 flex-shrink-0"></i>
                                            <div><strong>Atenção!</strong> Ao desativar sua conta você será desconectado imediatamente. Você terá 180 dias para reativá-la — após esse prazo a conta será desativada permanentemente.</div>
                                        </div>
                                        <form id="formExcluir" novalidate>
                                            <div class="mb-3">
                                                <label for="senhaExcluir" class="form-label fw-semibold">Digite sua senha para confirmar</label>
                                                <input type="password" class="form-control" id="senhaExcluir" autocomplete="current-password">
                                            </div>
                                            <div id="alertExcluir" class="alert d-none" role="alert"></div>
                                            <button type="submit" class="btn btn-danger">
                                                <i class="fas fa-user-slash me-2"></i>Desativar Conta
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            const modalContainer = document.createElement("div");
            modalContainer.innerHTML = modalHtml.trim();
            document.body.appendChild(modalContainer.firstElementChild);
        }
    }

    static getRoleLabel(role, papel) {
        if (role === "client") return "Cliente";
        if (role === "admin") return "Administrador";
        if (role === "agency" || role === "agency_member") {
            const roleMap = {
                admin_agencia: "Owner Prestador",
                gerente: "Gerente",
                dev: "Especialista",
                gestor_cliente: "Atendimento",
                financeiro: "Financeiro"
            };
            return roleMap[papel] || "Prestador";
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
                <i class="fas fa-tasks"></i><span>Projetos</span>
            </a>` : ""}
            ${Auth.hasAccess("perm_ver_clientes") || Auth.hasAccess("perm_criar_clientes") ? `
            <a href="clients.html" class="sidebar-nav-link nav-link">
                <i class="fas fa-users"></i><span>Clientes</span>
            </a>` : ""}

            ${Auth.hasAccess("perm_gerenciar_membros") || papel === "admin_agencia" ? `
            <hr class="my-2">
            <a href="agency_team.html" class="sidebar-nav-link nav-link">
                <i class="fas fa-users-cog"></i><span>Colaboradores</span>
            </a>
            <a href="planos.html" class="sidebar-nav-link nav-link">
                <i class="fas fa-layer-group"></i><span>Planos e Upgrade</span>
            </a>` : ""}
        `;
    }

    static getClientNav() {
        return `
            <a href="dashboard_client.html" class="sidebar-nav-link nav-link">
                <i class="fas fa-folder-open"></i><span>Meus Projetos</span>
            </a>
        `;
    }

    static getAdminNav() {
        return `
            <a href="dashboard_admin.html" class="sidebar-nav-link nav-link">
                <i class="fas fa-gauge-high"></i><span>Painel Admin</span>
            </a>
        `;
    }
}

window.SidebarManager = SidebarManager;

const ProfileModal = {
    _bsModal: null,

    _defaultAvatar(name) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4F46E5&color=fff&size=128`;
    },

    resolvePhoto(foto_path, fallbackName) {
        if (foto_path) {
            return "../../" + foto_path + "?t=" + Date.now();
        }
        return this._defaultAvatar(fallbackName);
    },

    updateAllAvatars(src) {
        const els = [
            document.getElementById("userAvatar"),
            document.getElementById("profileModalAvatar"),
            document.getElementById("profilePhotoPreview")
        ];
        els.forEach((el) => { if (el) el.src = src; });
    },

    init() {
        const modalEl = document.getElementById("profileModal");
        if (!modalEl) return;

        this._bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modalEl.addEventListener("show.bs.modal", () => this.loadProfile());

        // Foto de perfil — clique no wrap ou no botão
        const photoInput = document.getElementById("profilePhotoInput");
        document.getElementById("profilePhotoWrap")?.addEventListener("click", () => photoInput?.click());
        document.getElementById("profilePhotoBtn")?.addEventListener("click", () => photoInput?.click());
        photoInput?.addEventListener("change", (e) => this.handlePhotoChange(e));

        document.getElementById("formPerfil")?.addEventListener("submit", (e) => {
            e.preventDefault();
            this.submitPerfil();
        });
        document.getElementById("formEmpresa")?.addEventListener("submit", (e) => {
            e.preventDefault();
            this.submitEmpresa();
        });
        document.getElementById("formSenha")?.addEventListener("submit", (e) => {
            e.preventDefault();
            this.submitSenha();
        });
        document.getElementById("formExcluir")?.addEventListener("submit", (e) => {
            e.preventDefault();
            this.submitExcluir();
        });
    },

    open() {
        this._bsModal?.show();
    },

    async loadProfile() {
        try {
            const res = await API.get("perfil_obter.php");
            if (res.status !== "ok") return;

            const { usuario, agencia, papel } = res.data;
            const tipo = usuario.tipo;

            document.getElementById("perfilNome").value = usuario.nome || "";
            document.getElementById("perfilEmail").value = usuario.email || "";
            document.getElementById("perfilTelefone").value = usuario.telefone || "";
            document.getElementById("perfilProvaAutoria").value = usuario.prova_autoria || "";

            const displayName = usuario.nome_empresa || usuario.nome_responsavel || usuario.nome || "Usuário";
            const photoSrc = this.resolvePhoto(usuario.foto_path, displayName);

            const modalAvatarEl = document.getElementById("profileModalAvatar");
            if (modalAvatarEl) modalAvatarEl.src = photoSrc;

            const previewEl = document.getElementById("profilePhotoPreview");
            if (previewEl) previewEl.src = photoSrc;

            // Atualiza avatar da topbar com a foto real
            const topAvatar = document.getElementById("userAvatar");
            if (topAvatar) topAvatar.src = photoSrc;

            const roleEl = document.getElementById("profileModalRole");
            if (roleEl) roleEl.textContent = this.getRoleLabel(tipo, papel);

            // Aba empresa: somente proprietário da agência (tipo agency)
            const tabEmpresaItem = document.getElementById("tabEmpresaItem");
            if (tabEmpresaItem) {
                if (tipo === "agency" && agencia) {
                    tabEmpresaItem.style.display = "";
                    document.getElementById("agNomeEmpresa").value = agencia.nome_empresa || "";
                    document.getElementById("agCnpj").value = agencia.cnpj || "";
                    document.getElementById("agTelefone").value = agencia.telefone || "";
                    document.getElementById("agSite").value = agencia.site || "";
                    document.getElementById("agDescricao").value = agencia.descricao || "";
                } else {
                    tabEmpresaItem.style.display = "none";
                }
            }

            // Volta para aba Meu Perfil ao abrir
            const perfilTabBtn = document.getElementById("tab-perfil-btn");
            if (perfilTabBtn) bootstrap.Tab.getOrCreateInstance(perfilTabBtn).show();

            ["alertPerfil", "alertEmpresa", "alertSenha", "alertExcluir"].forEach((id) => this.hideAlert(id));

        } catch (e) {
            console.error("Erro ao carregar perfil:", e);
        }
    },

    async handlePhotoChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview imediato
        const reader = new FileReader();
        reader.onload = (ev) => {
            const previewEl = document.getElementById("profilePhotoPreview");
            if (previewEl) previewEl.src = ev.target.result;
        };
        reader.readAsDataURL(file);

        // Upload
        const alertEl = document.getElementById("alertFoto");
        const btn = document.getElementById("profilePhotoBtn");
        if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Enviando...'; }
        this.hideAlert("alertFoto");

        const formData = new FormData();
        formData.append("foto", file);

        try {
            const res = await API.postForm("perfil_foto_atualizar.php", formData);
            if (res.status === "ok") {
                this.showAlert("alertFoto", "success", res.mensagem);
                if (res.data?.foto_url) {
                    this.updateAllAvatars(res.data.foto_url);
                }
            } else {
                this.showAlert("alertFoto", "danger", res.mensagem);
            }
        } catch (err) {
            this.showAlert("alertFoto", "danger", "Erro de conexão.");
        }

        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-upload me-1"></i>Escolher foto'; }
        // Limpa o input para permitir re-selecionar o mesmo arquivo
        e.target.value = "";
    },

    async submitPerfil() {
        const btn = document.querySelector("#formPerfil [type='submit']");
        const nome = document.getElementById("perfilNome").value.trim();
        const telefone = document.getElementById("perfilTelefone").value.trim();
        const prova_autoria = document.getElementById("perfilProvaAutoria").value.trim();

        this.setLoading(btn, true, "Salvando...");
        try {
            const res = await API.post("perfil_atualizar.php", { nome, telefone, prova_autoria });
            if (res.status === "ok") {
                this.showAlert("alertPerfil", "success", res.mensagem);
                const nameEl = document.getElementById("sidebarUserName");
                if (nameEl) nameEl.textContent = nome;
                // Só atualiza o avatar gerado se não houver foto real
                const topAvatar = document.getElementById("userAvatar");
                const hasRealPhoto = topAvatar && !topAvatar.src.includes("ui-avatars.com");
                if (topAvatar && !hasRealPhoto) {
                    topAvatar.src = this._defaultAvatar(nome);
                }
            } else {
                this.showAlert("alertPerfil", "danger", res.mensagem);
            }
        } catch (e) {
            this.showAlert("alertPerfil", "danger", "Erro de conexão.");
        }
        this.setLoading(btn, false, '<i class="fas fa-save me-2"></i>Salvar Alterações');
    },

    async submitEmpresa() {
        const btn = document.querySelector("#formEmpresa [type='submit']");
        const nome_empresa = document.getElementById("agNomeEmpresa").value.trim();
        const cnpj = document.getElementById("agCnpj").value.trim();
        const telefone = document.getElementById("agTelefone").value.trim();
        const site = document.getElementById("agSite").value.trim();
        const descricao = document.getElementById("agDescricao").value.trim();

        this.setLoading(btn, true, "Salvando...");
        try {
            const res = await API.post("perfil_empresa_atualizar.php", { nome_empresa, cnpj, telefone, site, descricao });
            if (res.status === "ok") {
                this.showAlert("alertEmpresa", "success", res.mensagem);
            } else {
                this.showAlert("alertEmpresa", "danger", res.mensagem);
            }
        } catch (e) {
            this.showAlert("alertEmpresa", "danger", "Erro de conexão.");
        }
        this.setLoading(btn, false, '<i class="fas fa-save me-2"></i>Salvar Dados da Empresa');
    },

    async submitSenha() {
        const btn = document.querySelector("#formSenha [type='submit']");
        const senha_atual = document.getElementById("senhaAtual").value;
        const nova_senha = document.getElementById("novaSenha").value;
        const confirmar_senha = document.getElementById("confirmarSenha").value;

        this.setLoading(btn, true, "Alterando...");
        try {
            const res = await API.post("senha_alterar.php", { senha_atual, nova_senha, confirmar_senha });
            if (res.status === "ok") {
                this.showAlert("alertSenha", "success", res.mensagem);
                document.getElementById("formSenha").reset();
            } else {
                this.showAlert("alertSenha", "danger", res.mensagem);
            }
        } catch (e) {
            this.showAlert("alertSenha", "danger", "Erro de conexão.");
        }
        this.setLoading(btn, false, '<i class="fas fa-lock me-2"></i>Alterar Senha');
    },

    async submitExcluir() {
        const btn = document.querySelector("#formExcluir [type='submit']");
        const senha_confirmar = document.getElementById("senhaExcluir").value;

        this.setLoading(btn, true, "Desativando...");
        try {
            const res = await API.post("perfil_desativar_solicitar.php", { senha_confirmar });
            if (res.status === "ok") {
                this.showAlert("alertExcluir", "success", res.mensagem);
                setTimeout(() => { window.location.href = "../../index.html"; }, 1500);
                return;
            } else {
                this.showAlert("alertExcluir", "danger", res.mensagem);
            }
        } catch (e) {
            this.showAlert("alertExcluir", "danger", "Erro de conexão.");
        }
        this.setLoading(btn, false, '<i class="fas fa-user-slash me-2"></i>Desativar Conta');
    },

    setLoading(btn, loading, label) {
        if (!btn) return;
        btn.disabled = loading;
        btn.innerHTML = loading
            ? `<span class="spinner-border spinner-border-sm me-2" role="status"></span>${label}`
            : label;
    },

    showAlert(id, type, message) {
        const el = document.getElementById(id);
        if (!el) return;
        const icon = type === "success" ? "check-circle" : "exclamation-circle";
        el.className = `alert alert-${type}`;
        el.innerHTML = `<i class="fas fa-${icon} me-2"></i>${message}`;
    },

    hideAlert(id) {
        const el = document.getElementById(id);
        if (el) { el.className = "alert d-none"; el.textContent = ""; }
    },

    getRoleLabel(tipo, papel) {
        if (tipo === "client") return "Cliente";
        if (tipo === "agency") return "Prestador de Serviço — Proprietário";
        if (tipo === "agency_member") {
            const map = {
                admin_agencia: "Admin do Prestador",
                gerente: "Gerente",
                dev: "Especialista",
                gestor_cliente: "Atendimento",
                financeiro: "Financeiro"
            };
            return map[papel] || "Colaborador";
        }
        return "Usuário";
    }
};

window.ProfileModal = ProfileModal;
