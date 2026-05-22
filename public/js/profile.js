const ProfilePage = {
    _senhaAtualCheckTimer: null,
    _senhaAtualReqToken: 0,
    _senhaAtualValida: null,

    hasSequentialPasswordPattern(value) {
        const segments = String(value || "").toLowerCase().match(/[a-z0-9]+/g) || [];

        for (const segment of segments) {
            if (segment.length < 3) continue;

            for (let index = 0; index <= segment.length - 3; index += 1) {
                const first = segment.charCodeAt(index);
                const second = segment.charCodeAt(index + 1);
                const third = segment.charCodeAt(index + 2);

                if (second === first + 1 && third === second + 1) return true;
                if (second === first - 1 && third === second - 1) return true;
            }
        }

        return false;
    },

    validatePasswordStrength(password) {
        const value = String(password || "");

        if (value.length < 8) {
            return "A senha deve ter no mínimo 8 caracteres.";
        }

        if (!/[A-Z]/.test(value)) {
            return "A senha deve conter ao menos 1 letra maiúscula.";
        }

        if (!/[a-z]/.test(value)) {
            return "A senha deve conter ao menos 1 letra minúscula.";
        }

        if (!/\d/.test(value)) {
            return "A senha deve conter ao menos 1 número.";
        }

        if (!/[^A-Za-z0-9]/.test(value)) {
            return "A senha deve conter ao menos 1 caractere especial.";
        }

        if (/(.)\1{2,}/.test(value)) {
            return "A senha não pode repetir o mesmo caractere em sequência.";
        }

        if (this.hasSequentialPasswordPattern(value)) {
            return "A senha não pode conter sequências óbvias como 123 ou abc.";
        }

        return null;
    },

    getPasswordRules(password) {
        const value = String(password || "");

        return {
            length: value.length >= 8,
            uppercase: /[A-Z]/.test(value),
            lowercase: /[a-z]/.test(value),
            number: /\d/.test(value),
            special: /[^A-Za-z0-9]/.test(value),
            noRepeat: !/(.)\1{2,}/.test(value),
            noSequence: !this.hasSequentialPasswordPattern(value)
        };
    },

    _defaultAvatar(name) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4F46E5&color=fff&size=128`;
    },

    resolvePhoto(fotoPath, fallbackName) {
        if (fotoPath) {
            return "../../" + fotoPath + "?t=" + Date.now();
        }
        return this._defaultAvatar(fallbackName);
    },

    updateAllAvatars(src) {
        const elements = [
            document.getElementById("userAvatar"),
            document.getElementById("profileModalAvatar"),
            document.getElementById("profilePhotoPreview")
        ];
        elements.forEach((el) => {
            if (el) el.src = src;
        });
    },

    init() {
        document.getElementById("profilePhotoWrap")?.addEventListener("click", () => {
            document.getElementById("profilePhotoInput")?.click();
        });
        document.getElementById("profilePhotoBtn")?.addEventListener("click", () => {
            document.getElementById("profilePhotoInput")?.click();
        });
        document.getElementById("profilePhotoInput")?.addEventListener("change", (e) => this.handlePhotoChange(e));

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

        this.setupSecurityUX();
        this.loadProfile();
    },

    setupSecurityUX() {
        const currentInput = document.getElementById("senhaAtual");
        const newInput = document.getElementById("novaSenha");
        const confirmInput = document.getElementById("confirmarSenha");
        const checklist = document.querySelector('[data-password-checklist="novaSenha"]');
        const checklistItems = checklist ? checklist.querySelectorAll(".password-checklist-item") : [];
        const confirmStatus = document.getElementById("confirmarSenhaStatus");

        const refreshChecklist = () => {
            if (!newInput) return;

            const value = newInput.value;
            const rules = this.getPasswordRules(value);
            const showChecklist = document.activeElement === newInput || value.length > 0;

            if (checklist) {
                checklist.classList.toggle("d-none", !showChecklist);
            }

            checklistItems.forEach((item) => {
                const rule = item.dataset.rule;
                const valid =
                    (rule === "length" && rules.length) ||
                    (rule === "uppercase" && rules.uppercase) ||
                    (rule === "lowercase" && rules.lowercase) ||
                    (rule === "number" && rules.number) ||
                    (rule === "special" && rules.special) ||
                    (rule === "no-repeat" && rules.noRepeat) ||
                    (rule === "no-sequence" && rules.noSequence);

                item.classList.toggle("is-valid", Boolean(valid));
                item.classList.toggle("is-invalid", !valid && value.length > 0);
            });
        };

        const refreshConfirmStatus = () => {
            if (!confirmInput || !newInput || !confirmStatus) return;

            const hasValue = confirmInput.value.length > 0;
            const match = confirmInput.value === newInput.value;

            confirmStatus.classList.toggle("d-none", !hasValue);
            confirmStatus.classList.toggle("text-danger", hasValue && !match);
            confirmStatus.classList.toggle("text-success", hasValue && match);
            confirmStatus.innerHTML = hasValue
                ? (match
                    ? '<i class="fa-solid fa-circle-check me-1"></i>Confirmação de senha correta.'
                    : '<i class="fa-solid fa-circle-xmark me-1"></i>As senhas não coincidem.')
                : "As senhas não coincidem.";
        };

        if (newInput) {
            newInput.addEventListener("focus", refreshChecklist);
            newInput.addEventListener("input", () => {
                refreshChecklist();
                refreshConfirmStatus();
            });
            newInput.addEventListener("blur", () => {
                if (checklist && !newInput.value) {
                    checklist.classList.add("d-none");
                }
            });
        }

        if (confirmInput) {
            confirmInput.addEventListener("input", refreshConfirmStatus);
            confirmInput.addEventListener("blur", refreshConfirmStatus);
        }

        if (currentInput) {
            currentInput.addEventListener("input", () => this.scheduleCurrentPasswordValidation());
            currentInput.addEventListener("blur", () => this.scheduleCurrentPasswordValidation());
        }
    },

    scheduleCurrentPasswordValidation() {
        const currentInput = document.getElementById("senhaAtual");
        const statusEl = document.getElementById("senhaAtualStatus");
        if (!currentInput || !statusEl) return;

        const senha = currentInput.value;
        if (!senha) {
            if (this._senhaAtualCheckTimer) clearTimeout(this._senhaAtualCheckTimer);
            this._senhaAtualValida = null;
            statusEl.className = "form-text small d-none mt-2";
            statusEl.textContent = "";
            return;
        }

        if (this._senhaAtualCheckTimer) clearTimeout(this._senhaAtualCheckTimer);
        this._senhaAtualCheckTimer = setTimeout(() => this.validateCurrentPasswordRealtime(), 350);
    },

    async validateCurrentPasswordRealtime() {
        const currentInput = document.getElementById("senhaAtual");
        const statusEl = document.getElementById("senhaAtualStatus");
        if (!currentInput || !statusEl) return;

        const senha = currentInput.value;
        if (!senha) return;

        const reqToken = ++this._senhaAtualReqToken;

        try {
            const res = await API.post("senha_validar_atual.php", { senha_atual: senha });
            if (reqToken !== this._senhaAtualReqToken) return;

            const valida = Boolean(res?.data?.valida);
            this._senhaAtualValida = valida;

            statusEl.className = `form-text small mt-2 ${valida ? "text-success" : "text-danger"}`;
            statusEl.innerHTML = valida
                ? '<i class="fa-solid fa-circle-check me-1"></i>Senha atual conferida.'
                : '<i class="fa-solid fa-circle-xmark me-1"></i>Senha atual incorreta.';
        } catch (_) {
            if (reqToken !== this._senhaAtualReqToken) return;
            this._senhaAtualValida = null;
            statusEl.className = "form-text small mt-2 text-danger";
            statusEl.innerHTML = '<i class="fa-solid fa-circle-xmark me-1"></i>Não foi possível validar a senha agora.';
        }
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

            const displayName = usuario.nome_empresa || usuario.nome_responsavel || usuario.nome || "Usuário";
            const photoSrc = this.resolvePhoto(usuario.foto_path, displayName);

            const roleEl = document.getElementById("profileModalRole");
            if (roleEl) roleEl.textContent = this.getRoleLabel(tipo, papel);

            this.updateAllAvatars(photoSrc);

            const sidebarName = document.getElementById("sidebarUserName");
            if (sidebarName) sidebarName.textContent = displayName;

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

            const perfilTabBtn = document.getElementById("tab-perfil-btn");
            if (perfilTabBtn) {
                bootstrap.Tab.getOrCreateInstance(perfilTabBtn).show();
            }

            ["alertPerfil", "alertEmpresa", "alertSenha", "alertExcluir", "alertFoto"].forEach((id) => this.hideAlert(id));
        } catch (e) {
            console.error("Erro ao carregar perfil:", e);
        }
    },

    async handlePhotoChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const previewEl = document.getElementById("profilePhotoPreview");
            if (previewEl) previewEl.src = ev.target.result;
        };
        reader.readAsDataURL(file);

        const btn = document.getElementById("profilePhotoBtn");
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Enviando...';
        }

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
        } catch (_) {
            this.showAlert("alertFoto", "danger", "Erro de conexão.");
        }

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-upload me-1"></i>Escolher foto';
        }
        e.target.value = "";
    },

    async submitPerfil() {
        const btn = document.querySelector("#formPerfil [type='submit']");
        const nome = document.getElementById("perfilNome").value.trim();
        const telefone = document.getElementById("perfilTelefone").value.trim();

        this.setLoading(btn, true, "Salvando...");

        try {
            const res = await API.post("perfil_atualizar.php", { nome, telefone });
            if (res.status === "ok") {
                this.showAlert("alertPerfil", "success", res.mensagem);
                const nameEl = document.getElementById("sidebarUserName");
                if (nameEl) nameEl.textContent = nome;

                const topAvatar = document.getElementById("userAvatar");
                const hasRealPhoto = topAvatar && !topAvatar.src.includes("ui-avatars.com");
                if (topAvatar && !hasRealPhoto) {
                    topAvatar.src = this._defaultAvatar(nome);
                }
            } else {
                this.showAlert("alertPerfil", "danger", res.mensagem);
            }
        } catch (_) {
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
        } catch (_) {
            this.showAlert("alertEmpresa", "danger", "Erro de conexão.");
        }

        this.setLoading(btn, false, '<i class="fas fa-save me-2"></i>Salvar Dados da Empresa');
    },

    async submitSenha() {
        const btn = document.querySelector("#formSenha [type='submit']");
        const senha_atual = document.getElementById("senhaAtual").value;
        const nova_senha = document.getElementById("novaSenha").value;
        const confirmar_senha = document.getElementById("confirmarSenha").value;

        if (!senha_atual) {
            this.showAlert("alertSenha", "danger", "Informe sua senha atual.");
            return;
        }

        if (this._senhaAtualValida === false) {
            this.showAlert("alertSenha", "danger", "A senha atual está incorreta.");
            return;
        }

        if (senha_atual === nova_senha) {
            this.showAlert("alertSenha", "danger", "A nova senha precisa ser diferente da senha atual.");
            return;
        }

        const passwordError = this.validatePasswordStrength(nova_senha);
        if (passwordError) {
            this.showAlert("alertSenha", "danger", passwordError);
            return;
        }

        if (nova_senha !== confirmar_senha) {
            this.showAlert("alertSenha", "danger", "A confirmação de senha precisa ser igual à senha informada.");
            return;
        }

        this.setLoading(btn, true, "Alterando...");

        try {
            const res = await API.post("senha_alterar.php", { senha_atual, nova_senha, confirmar_senha });
            if (res.status === "ok") {
                this.showAlert("alertSenha", "success", res.mensagem);
                document.getElementById("formSenha").reset();
                this._senhaAtualValida = null;
                const statusEl = document.getElementById("senhaAtualStatus");
                if (statusEl) {
                    statusEl.className = "form-text small d-none mt-2";
                    statusEl.textContent = "";
                }
                const checklist = document.querySelector('[data-password-checklist="novaSenha"]');
                if (checklist) checklist.classList.add("d-none");
                const confirmStatus = document.getElementById("confirmarSenhaStatus");
                if (confirmStatus) {
                    confirmStatus.className = "form-text small d-none mt-2";
                    confirmStatus.textContent = "As senhas não coincidem.";
                }
            } else {
                this.showAlert("alertSenha", "danger", res.mensagem);
            }
        } catch (_) {
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
                setTimeout(() => {
                    window.location.href = "../../index.html";
                }, 1500);
                return;
            }
            this.showAlert("alertExcluir", "danger", res.mensagem);
        } catch (_) {
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
        if (!el) return;
        el.className = "alert d-none";
        el.textContent = "";
    },

    getRoleLabel(tipo, papel) {
        if (tipo === "client") return "Cliente";
        if (tipo === "agency") return "Prestador de Serviço - Proprietário";
        if (tipo === "agency_member") {
            const map = {
                admin_agencia: "Administrador",
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

document.addEventListener("DOMContentLoaded", async () => {
    const embedded = new URLSearchParams(window.location.search).get("embedded") === "1";
    const sessao = await Auth.validateSession();
    if (!sessao) {
        window.location.href = "login.html";
        return;
    }

    if (!embedded) {
        await SidebarManager.init();
    }
    ProfilePage.init();
});
