function getDashboardByRole(role) {
    if (role === 'client') {
        return 'dashboard_client.html';
    }

    return 'dashboard_agency.html';
}

async function handleLoginSubmit(event) {
    event.preventDefault();

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    try {
        const retorno = await ApiClientFlow.post('usuario_login.php', {
            email,
            senha: password
        });

        if (retorno.status !== 'ok') {
            alert(retorno.mensagem || 'E-mail ou senha incorretos.');
            return;
        }

        const tipo = retorno.data && retorno.data.tipo ? retorno.data.tipo : null;

        if (!tipo) {
            alert('Nao foi possivel identificar o perfil do usuario.');
            return;
        }

        if (token) {
            if (tipo !== 'client') {
                alert('Este link de formulario exige login de cliente.');
                return;
            }

            const vinculo = await ApiClientFlow.post('checklist_vincular_cliente.php', { token });
            if (vinculo.status !== 'ok') {
                alert(vinculo.mensagem || 'Nao foi possivel vincular o formulario.');
                return;
            }
        }

        window.location.href = getDashboardByRole(tipo);
    } catch (error) {
        alert('Erro ao conectar com o servidor. Tente novamente.');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('loginForm');

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    // ─── Auto-redirect se já estiver logado ──────────────────────────────────
    try {
        const sessao = await ApiClientFlow.get('valida_sessao_logado.php');
        if (sessao.status === 'ok' && sessao.data && sessao.data.tipo) {
            const tipo = sessao.data.tipo;

            // Se tem token na URL, processa o vinculo agora mesmo
            if (token) {
                if (tipo !== 'client') {
                    alert('Este link de formulário exige conta de cliente. Deslogue da conta de agência primeiro.');
                    return;
                }
                const vinculo = await ApiClientFlow.post('checklist_vincular_cliente.php', { token });
                if (vinculo.status !== 'ok') {
                    alert(vinculo.mensagem || 'Não foi possível vincular o formulário.');
                }
            }

            // Já está logado: tchau login page!
            window.location.href = getDashboardByRole(tipo);
            return;
        }
    } catch (e) {
        // Se der erro na checagem, segue normalmente carregando a tela de login
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

    if (!loginForm) {
        return;
    }

    loginForm.addEventListener('submit', handleLoginSubmit);
});
