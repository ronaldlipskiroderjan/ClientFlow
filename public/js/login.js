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

        if (tipo === 'client') {
            alert('Esta entrega aceita apenas login de gestor (agencia/freelancer).');
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

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (!loginForm) {
        return;
    }

    loginForm.addEventListener('submit', handleLoginSubmit);
});
