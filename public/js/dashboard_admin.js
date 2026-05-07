let paginaAtual = 1;
let modalPlanoInstance = null;
let modalDesatInstance = null;

// ─── KPIs ─────────────────────────────────────────────────────────────────────

async function carregarResumoAdmin() {
    try {
        const retorno = await ApiClientFlow.get('dashboard_admin_resumo.php');
        if (retorno && retorno.status === 'ok' && retorno.data) {
            document.getElementById('kpi-users').textContent     = retorno.data.active_users   ?? '0';
            document.getElementById('kpi-agencies').textContent  = retorno.data.active_agencies ?? '0';
            document.getElementById('kpi-clients').textContent   = retorno.data.clients         ?? '0';
            document.getElementById('kpi-alerts').textContent    = retorno.data.alerts          ?? '0';
        }
    } catch (error) {
        console.error('Erro ao carregar resumo admin:', error);
    }
}

// ─── Usuários ─────────────────────────────────────────────────────────────────

async function carregarUsuarios(pagina = 1) {
    paginaAtual = pagina;

    const loadingState        = document.getElementById('loading-state');
    const errorState          = document.getElementById('error-state');
    const emptyState          = document.getElementById('empty-state');
    const usuariosContainer   = document.getElementById('usuarios-container');
    const usuariosTbody       = document.getElementById('usuarios-tbody');
    const usuariosCards       = document.getElementById('usuarios-cards');
    const paginationContainer = document.getElementById('pagination-container');

    loadingState.classList.remove('d-none');
    errorState.classList.add('d-none');
    emptyState.classList.add('d-none');
    usuariosContainer.classList.add('d-none');
    paginationContainer.classList.add('d-none');

    const filtroStatus = document.getElementById('filtro-status').value;
    const filtroPlano  = document.getElementById('filtro-plano').value;

    try {
        const queryParams = new URLSearchParams({ page: paginaAtual, limit: 10 });
        if (filtroStatus) queryParams.append('status', filtroStatus);
        if (filtroPlano)  queryParams.append('plano_id', filtroPlano);

        const retorno = await ApiClientFlow.get(`admin_usuarios_listar.php?${queryParams.toString()}`);
        if (retorno.status !== 'ok') throw new Error(retorno.mensagem || 'Erro ao carregar usuários');

        const usuarios = Array.isArray(retorno.data) ? retorno.data : [];

        loadingState.classList.add('d-none');

        if (usuarios.length === 0) {
            emptyState.classList.remove('d-none');
            return;
        }

        usuariosTbody.innerHTML = '';
        usuariosCards.innerHTML = '';

        usuarios.forEach(usuario => {
            const statusBadge = getStatusBadge(usuario.status_conta);
            const nomePlano   = usuario.nome_plano
                ? `<span class="badge bg-secondary">${usuario.nome_plano}</span>`
                : '<span class="badge bg-light text-dark border">Nenhum</span>';
            const dataAcesso  = usuario.data_ultimo_acesso
                ? new Date(usuario.data_ultimo_acesso).toLocaleString('pt-BR')
                : '<span class="text-muted">Nunca acessou</span>';

            const estaDesativado = usuario.status_conta === 'desativado' || usuario.status_conta === 'banido';
            const btnDesatClass  = estaDesativado ? 'btn-outline-success'  : 'btn-outline-warning';
            const btnDesatIcon   = estaDesativado ? 'fa-check-circle'      : 'fa-ban';
            const btnDesatTitle  = estaDesativado ? 'Ativar conta'         : 'Desativar conta';

            // Linha de tabela (desktop)
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="fw-semibold">${usuario.nome}</td>
                <td class="text-muted">${usuario.email}</td>
                <td>${nomePlano}</td>
                <td class="small">${dataAcesso}</td>
                <td>${statusBadge}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary me-1"
                        onclick="abrirModalMudarPlano(${usuario.id}, ${usuario.plano_id || 1})"
                        title="Mudar Plano">
                        <i class="fa-solid fa-gem"></i>
                    </button>
                    <button class="btn btn-sm ${btnDesatClass}"
                        onclick="abrirModalDesativar(${usuario.id}, '${usuario.status_conta}')"
                        title="${btnDesatTitle}">
                        <i class="fa-solid ${btnDesatIcon}"></i>
                    </button>
                </td>`;
            usuariosTbody.appendChild(row);

            // Card (mobile)
            const card = document.createElement('div');
            card.className = 'card mb-2 border-0 shadow-sm rounded-3 p-3';
            card.innerHTML = `
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="overflow-hidden me-2">
                        <div class="fw-semibold text-truncate">${usuario.nome}</div>
                        <div class="text-muted small text-truncate">${usuario.email}</div>
                    </div>
                    ${statusBadge}
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <div class="small">
                        ${nomePlano}
                        <div class="text-muted mt-1" style="font-size:0.72rem;">${dataAcesso}</div>
                    </div>
                    <div class="d-flex gap-1 ms-2 flex-shrink-0">
                        <button class="btn btn-sm btn-outline-primary"
                            onclick="abrirModalMudarPlano(${usuario.id}, ${usuario.plano_id || 1})"
                            title="Mudar Plano">
                            <i class="fa-solid fa-gem"></i>
                        </button>
                        <button class="btn btn-sm ${btnDesatClass}"
                            onclick="abrirModalDesativar(${usuario.id}, '${usuario.status_conta}')"
                            title="${btnDesatTitle}">
                            <i class="fa-solid ${btnDesatIcon}"></i>
                        </button>
                    </div>
                </div>`;
            usuariosCards.appendChild(card);
        });

        usuariosContainer.classList.remove('d-none');

        if (retorno.pagination && retorno.pagination.pages > 1) {
            renderizarPaginacao(retorno.pagination);
            paginationContainer.classList.remove('d-none');
        }

    } catch (error) {
        loadingState.classList.add('d-none');
        errorState.classList.remove('d-none');
        console.error(error);
    }
}

function renderizarPaginacao(paginacao) {
    const ul = document.getElementById('pagination-ul');
    ul.innerHTML = '';
    for (let i = 1; i <= paginacao.pages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === paginacao.page ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="event.preventDefault(); carregarUsuarios(${i})">${i}</a>`;
        ul.appendChild(li);
    }
}

function getStatusBadge(status) {
    const map = {
        'ativo':       '<span class="badge bg-success">Ativo</span>',
        'aprovado':    '<span class="badge bg-success">Ativo</span>',
        'pendente':    '<span class="badge bg-warning text-dark">Pendente</span>',
        'desativado':  '<span class="badge bg-secondary">Desativado</span>',
        'banido':      '<span class="badge bg-danger">Banido</span>'
    };
    return map[status] || '<span class="badge bg-light text-dark border">Desconhecido</span>';
}

// ─── Modal: Mudar Plano ───────────────────────────────────────────────────────

function abrirModalMudarPlano(id, planoAtualId) {
    document.getElementById('modal-plano-usuario-id').value = id;
    document.getElementById('modal-plano-select').value     = planoAtualId;
    const el = document.getElementById('mudarPlanoModal');
    modalPlanoInstance = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
    modalPlanoInstance.show();
}

async function salvarNovoPlano() {
    const id     = document.getElementById('modal-plano-usuario-id').value;
    const planoId = document.getElementById('modal-plano-select').value;
    const btn    = document.getElementById('btn-salvar-plano');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';

    try {
        const retorno = await ApiClientFlow.post('admin_usuario_atualizar_plano.php', {
            usuario_id: id,
            plano_id: planoId
        });
        if (retorno.status !== 'ok') {
            alert(retorno.mensagem || 'Erro ao alterar plano');
            return;
        }
        if (modalPlanoInstance) modalPlanoInstance.hide();
        carregarUsuarios(paginaAtual);
    } catch (error) {
        alert('Erro ao conectar com o servidor');
        console.error(error);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save me-2"></i>Salvar';
    }
}

// ─── Modal: Desativar / Ativar ────────────────────────────────────────────────

function abrirModalDesativar(id, statusAtual) {
    document.getElementById('modal-desat-usuario-id').value = id;

    const titulo       = document.getElementById('desativarModalLabel');
    const texto        = document.getElementById('modal-desat-texto');
    const btnConfirmar = document.getElementById('btn-confirmar-desat');

    const estaDesativado = statusAtual === 'desativado' || statusAtual === 'banido';

    if (estaDesativado) {
        titulo.textContent        = 'Ativar Conta';
        titulo.className          = 'modal-title fw-bold text-success';
        texto.textContent         = 'Tem certeza de que deseja ativar esta conta? O usuário poderá acessar a plataforma novamente.';
        btnConfirmar.textContent  = 'Sim, Ativar';
        btnConfirmar.className    = 'btn btn-success';
        btnConfirmar.onclick      = () => confirmarStatus(id, 'aprovado');
    } else {
        titulo.textContent        = 'Desativar Conta';
        titulo.className          = 'modal-title fw-bold text-warning';
        texto.textContent         = 'Tem certeza de que deseja desativar esta conta? O acesso do usuário será suspenso imediatamente.';
        btnConfirmar.textContent  = 'Sim, Desativar';
        btnConfirmar.className    = 'btn btn-warning';
        btnConfirmar.onclick      = () => confirmarStatus(id, 'desativado');
    }

    const el = document.getElementById('desativarModal');
    modalDesatInstance = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
    modalDesatInstance.show();
}

async function confirmarStatus(id, novoStatus) {
    const btn    = document.getElementById('btn-confirmar-desat');
    btn.disabled = true;

    try {
        const retorno = await ApiClientFlow.post('admin_usuario_atualizar_status.php', {
            usuario_id: id,
            status: novoStatus
        });
        if (retorno.status !== 'ok') {
            alert(retorno.mensagem || 'Erro ao alterar status');
            return;
        }
        if (modalDesatInstance) modalDesatInstance.hide();
        carregarUsuarios(paginaAtual);
    } catch (error) {
        alert('Erro ao conectar com o servidor');
        console.error(error);
    } finally {
        btn.disabled = false;
    }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
    const sessao = await Auth.validateSession();
    if (!sessao || sessao.tipo !== 'admin') {
        window.location.href = 'login_admin.html';
        return;
    }

    await SidebarManager.init();

    const adminSubtitle = document.getElementById('adminSubtitle');
    if (adminSubtitle) {
        adminSubtitle.textContent = `Bem-vindo de volta, ${sessao.nome}. Aqui você pode acessar recursos administrativos.`;
    }

    carregarResumoAdmin();
    carregarUsuarios(1);
});
