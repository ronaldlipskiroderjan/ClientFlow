async function handleAdminLoginSubmit(event) {
    event.preventDefault();

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    const email = emailInput.value.trim();
    const password = passwordInput.value;

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
        if (tipo !== 'admin') {
            alert('Use uma conta de administrador para acessar este painel.');
            return;
        }

        window.location.href = 'dashboard_admin.html';
    } catch (error) {
        alert('Erro ao conectar com o servidor. Tente novamente.');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('adminLoginForm');

    try {
        const sessao = await ApiClientFlow.get('valida_sessao_logado.php');
        if (sessao.status === 'ok' && sessao.data && sessao.data.tipo === 'admin') {
            window.location.href = 'dashboard_admin.html';
            return;
        }
    } catch (e) {
        // prossegue normalmente
    }

    if (!loginForm) {
        return;
    }

    loginForm.addEventListener('submit', handleAdminLoginSubmit);
});
