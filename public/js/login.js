function getDashboardByRole(role) {
    if (role === 'client') return 'dashboard_client.html';
    if (role === 'admin')  return 'dashboard_admin.html';
    return 'dashboard_agency.html';
}

function mostrarPainelReativacao(diasRestantes) {
    document.getElementById('loginForm').classList.add('d-none');
    document.getElementById('reativacaoPanel').classList.remove('d-none');
    document.getElementById('diasRestantes').textContent = diasRestantes;
}

function ocultarPainelReativacao() {
    document.getElementById('reativacaoPanel').classList.add('d-none');
    document.getElementById('loginForm').classList.remove('d-none');
    document.getElementById('alertReativacao').classList.add('d-none');
}

async function handleLoginSubmit(event) {
    event.preventDefault();

    const email           = document.getElementById('email').value.trim();
    const password        = document.getElementById('password').value;
    const manterConectado = document.getElementById('manterConectado')?.checked;
    const params          = new URLSearchParams(window.location.search);
    const token           = params.get('token');

    if (manterConectado) {
        localStorage.setItem('cf_remember_email', email);
        localStorage.setItem('cf_remember_me', '1');
    } else {
        localStorage.removeItem('cf_remember_email');
        localStorage.removeItem('cf_remember_me');
    }

    try {
        const retorno = await ApiClientFlow.post('usuario_login.php', { email, senha: password });

        if (retorno.status === 'conta_desativada') {
            mostrarPainelReativacao(retorno.data?.dias_restantes ?? 180);
            return;
        }

        if (retorno.status !== 'ok') {
            Toast.error(retorno.mensagem || 'E-mail ou senha incorretos.');
            return;
        }

        const tipo = retorno.data?.tipo;
        if (!tipo) {
            Toast.error('Não foi possível identificar o perfil do usuário.');
            return;
        }

        if (token) {
            if (tipo !== 'client') {
                Toast.warning('Este link de formulário exige login de cliente.');
                return;
            }
            const vinculo = await ApiClientFlow.post('checklist_vincular_cliente.php', { token });
            if (vinculo.status !== 'ok') {
                Toast.error(vinculo.mensagem || 'Não foi possível vincular o formulário.');
                return;
            }
        }

        window.location.href = getDashboardByRole(tipo);
    } catch (error) {
        Toast.error('Erro ao conectar com o servidor. Tente novamente.');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('loginForm');

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    const savedEmail    = localStorage.getItem('cf_remember_email');
    const savedRemember = localStorage.getItem('cf_remember_me') === '1';
    const emailInput    = document.getElementById('email');
    const checkRemember = document.getElementById('manterConectado');
    if (savedRemember && savedEmail && emailInput) {
        emailInput.value = savedEmail;
        if (checkRemember) checkRemember.checked = true;
    }

    try {
        const sessao = await ApiClientFlow.get('valida_sessao_logado.php');
        if (sessao.status === 'ok' && sessao.data && sessao.data.tipo) {
            const tipo = sessao.data.tipo;

            if (token) {
                if (tipo !== 'client') {
                    Toast.warning('Este link exige conta de cliente. Deslogue da conta de prestador de serviço primeiro.');
                    return;
                }
                const vinculo = await ApiClientFlow.post('checklist_vincular_cliente.php', { token });
                if (vinculo.status !== 'ok') {
                    Toast.error(vinculo.mensagem || 'Não foi possível vincular o formulário.');
                }
            }

            window.location.href = getDashboardByRole(tipo);
            return;
        }
    } catch (e) {
        // Segue carregando a tela de login normalmente
    }

    if (token) {
        document.querySelectorAll('a[href="cadastro.html"]').forEach(a => {
            a.href = `cadastro.html?token=${encodeURIComponent(token)}`;
        });

        const titleEl = document.querySelector('.text-center.mb-4 h2');
        const descEl = document.querySelector('.text-center.mb-4 p.text-muted');

        if (titleEl) titleEl.textContent = 'Vincular Projeto';
        if (descEl) descEl.innerHTML = 'Faça login para vincular o projeto à sua conta, ou <a href="cadastro.html?token=' + encodeURIComponent(token) + '" class="text-primary fw-semibold">cadastre-se</a>.';
    }

    if (!loginForm) return;

    loginForm.addEventListener('submit', handleLoginSubmit);

    document.getElementById('btnCancelarReativar')?.addEventListener('click', ocultarPainelReativacao);

    document.getElementById('btnReativar')?.addEventListener('click', async () => {
        const email    = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const alertEl  = document.getElementById('alertReativacao');
        const btn      = document.getElementById('btnReativar');

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Reativando...';
        alertEl.classList.add('d-none');

        try {
            const res = await ApiClientFlow.post('conta_reativar.php', { email, senha: password });
            if (res.status === 'ok') {
                alertEl.className = 'alert alert-success mb-3';
                alertEl.innerHTML = '<i class="fas fa-check-circle me-2"></i>' + res.mensagem;
                alertEl.classList.remove('d-none');
                setTimeout(() => { window.location.href = getDashboardByRole(res.data?.tipo); }, 1200);
            } else {
                alertEl.className = 'alert alert-danger mb-3';
                alertEl.innerHTML = '<i class="fas fa-exclamation-circle me-2"></i>' + res.mensagem;
                alertEl.classList.remove('d-none');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-user-check me-2"></i>Reativar Minha Conta';
            }
        } catch (e) {
            alertEl.className = 'alert alert-danger mb-3';
            alertEl.innerHTML = '<i class="fas fa-exclamation-circle me-2"></i>Erro de conexão.';
            alertEl.classList.remove('d-none');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-user-check me-2"></i>Reativar Minha Conta';
        }
    });
});
