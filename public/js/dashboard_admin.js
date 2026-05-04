async function carregarResumoAdmin() {
    try {
        const retorno = await ApiClientFlow.get('dashboard_admin_resumo.php');
        if (retorno && retorno.status === 'ok' && retorno.data) {
            document.getElementById('kpi-users').textContent = retorno.data.active_users ?? '0';
            document.getElementById('kpi-agencies').textContent = retorno.data.active_agencies ?? '0';
            document.getElementById('kpi-clients').textContent = retorno.data.clients ?? '0';
            document.getElementById('kpi-alerts').textContent = retorno.data.alerts ?? '0';
        }
    } catch (error) {
        console.error('Erro ao carregar resumo admin:', error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const sessao = await Auth.validateSession();
    if (!sessao || sessao.tipo !== 'admin') {
        window.location.href = 'login_admin.html';
        return;
    }

    const adminTitle = document.getElementById('adminTitle');
    const adminSubtitle = document.getElementById('adminSubtitle');

    if (adminTitle) {
        adminTitle.textContent = 'Painel Administrativo';
    }
    if (adminSubtitle) {
        adminSubtitle.textContent = `Bem-vindo de volta, ${sessao.nome}. Aqui você pode acessar recursos administrativos.`;
    }

    carregarResumoAdmin();
});
