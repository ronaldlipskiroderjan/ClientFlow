let paginaAtual = 1;
let modalPlanoInstance  = null;
let modalDesatInstance  = null;
let modalMembrosInstance = null;
let agenciaAtualId      = null;
let agenciaAtualNome    = '';
let tabAtiva            = 'clientes';


async function carregarResumoAdmin() {
    try {
        const retorno = await ApiClientFlow.get('dashboard_admin_resumo.php');
        if (retorno && retorno.status === 'ok' && retorno.data) {
            document.getElementById('kpi-users').textContent    = retorno.data.active_users    ?? '0';
            document.getElementById('kpi-agencies').textContent = retorno.data.active_agencies ?? '0';
            document.getElementById('kpi-clients').textContent  = retorno.data.clients         ?? '0';
            document.getElementById('kpi-alerts').textContent   = retorno.data.alerts          ?? '0';
        }
    } catch (e) {
        console.error('Erro ao carregar resumo admin:', e);
    }
}


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
        const queryParams = new URLSearchParams({ page: paginaAtual, limit: 10, tipo: 'agency_member' });
        if (filtroStatus) queryParams.append('status', filtroStatus);
        if (filtroPlano)  queryParams.append('plano_id', filtroPlano);

        const filtroTipoPrestador = document.getElementById('filtro-tipo-prestador')?.value || '';
        if (filtroTipoPrestador) queryParams.append('tipo_prestador', filtroTipoPrestador);

        const retorno = await ApiClientFlow.get(`admin_usuarios_listar.php?${queryParams.toString()}`);
        if (retorno.status !== 'ok') throw new Error(retorno.mensagem || 'Erro ao carregar');

        const lista = Array.isArray(retorno.data) ? retorno.data : [];
        loadingState.classList.add('d-none');

        if (lista.length === 0) {
            emptyState.classList.remove('d-none');
            return;
        }

        usuariosTbody.innerHTML = '';
        if (usuariosCards) usuariosCards.innerHTML = '';

        lista.forEach(u => {
            const isPJ         = !!(u.nome_empresa && u.nome_empresa.trim());
            const nomeExibido  = isPJ ? u.nome_empresa : u.nome;
            const tipoBadge    = isPJ
                ? '<span class="badge bg-info-subtle text-info border border-info-subtle ms-1" style="font-size:0.65rem;">PJ</span>'
                : '<span class="badge bg-purple-soft text-purple border border-purple-subtle ms-1" style="font-size:0.65rem;">PF</span>';
            const statusBadge  = getStatusBadge(u.status_conta);
            const nomePlano    = u.nome_plano
                ? `<span class="badge bg-secondary">${u.nome_plano}</span>`
                : '<span class="badge bg-light text-dark border">Nenhum</span>';
            const dataAcesso   = u.data_ultimo_acesso
                ? new Date(u.data_ultimo_acesso).toLocaleString('pt-BR')
                : '<span class="text-muted">Nunca acessou</span>';
            const estaDesativado = u.status_conta === 'desativado' || u.status_conta === 'banido';
            const btnDesatClass  = estaDesativado ? 'btn-outline-success'  : 'btn-outline-warning';
            const btnDesatIcon   = estaDesativado ? 'fa-check-circle'      : 'fa-ban';
            const btnDesatTitle  = estaDesativado ? 'Ativar conta'         : 'Desativar conta';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="fw-semibold d-flex align-items-center gap-1">${nomeExibido} ${tipoBadge}</div>
                    ${isPJ ? `<small class="text-muted"><i class="fa-solid fa-user me-1 opacity-50"></i>${u.nome}</small>` : ''}
                </td>
                <td class="text-muted">${u.email}</td>
                <td>${nomePlano}</td>
                <td class="small">${dataAcesso}</td>
                <td>${statusBadge}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-info me-1"
                        onclick="abrirModalAgencia(${u.id}, '${(nomeExibido).replace(/'/g,"\\'")}') "
                        title="Ver clientes e colaboradores">
                        <i class="fa-solid fa-users"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-primary me-1"
                        onclick="abrirModalMudarPlano(${u.id}, ${u.plano_id || 1})"
                        title="Mudar Plano">
                        <i class="fa-solid fa-gem"></i>
                    </button>
                    <button class="btn btn-sm ${btnDesatClass}"
                        onclick="abrirModalDesativar(${u.id}, '${u.status_conta}')"
                        title="${btnDesatTitle}">
                        <i class="fa-solid ${btnDesatIcon}"></i>
                    </button>
                </td>`;
            usuariosTbody.appendChild(row);

            if (usuariosCards) {
                const card = document.createElement('div');
                card.className = 'card mb-2 border-0 shadow-sm rounded-3 p-3';
                card.innerHTML = `
                    <div class="d-flex justify-content-between align-items-start mb-1">
                        <div class="overflow-hidden me-2">
                            <div class="fw-semibold text-truncate d-flex align-items-center gap-1">${nomeExibido} ${tipoBadge}</div>
                            ${isPJ ? `<div class="text-muted small"><i class="fa-solid fa-user me-1 opacity-50"></i>${u.nome}</div>` : ''}
                            <div class="text-muted small text-truncate">${u.email}</div>
                        </div>
                        ${statusBadge}
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="small">
                            ${nomePlano}
                            <div class="text-muted mt-1" style="font-size:0.72rem;">${dataAcesso}</div>
                        </div>
                        <div class="d-flex gap-1 ms-2 flex-shrink-0">
                            <button class="btn btn-sm btn-outline-info"
                                onclick="abrirModalAgencia(${u.id}, '${(nomeExibido).replace(/'/g,"\\'")}') "
                                title="Ver membros">
                                <i class="fa-solid fa-users"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-primary"
                                onclick="abrirModalMudarPlano(${u.id}, ${u.plano_id || 1})"
                                title="Mudar Plano">
                                <i class="fa-solid fa-gem"></i>
                            </button>
                            <button class="btn btn-sm ${btnDesatClass}"
                                onclick="abrirModalDesativar(${u.id}, '${u.status_conta}')"
                                title="${btnDesatTitle}">
                                <i class="fa-solid ${btnDesatIcon}"></i>
                            </button>
                        </div>
                    </div>`;
                usuariosCards.appendChild(card);
            }
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
        'ativo':      '<span class="badge bg-success">Ativo</span>',
        'aprovado':   '<span class="badge bg-success">Ativo</span>',
        'pendente':   '<span class="badge bg-warning text-dark">Pendente</span>',
        'desativado': '<span class="badge bg-secondary">Desativado</span>',
        'banido':     '<span class="badge bg-danger">Banido</span>'
    };
    return map[status] || '<span class="badge bg-light text-dark border">Desconhecido</span>';
}


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
        const retorno = await ApiClientFlow.post('admin_usuario_atualizar_plano.php', { usuario_id: id, plano_id: planoId });
        if (retorno.status !== 'ok') { Toast.error(retorno.mensagem || 'Erro ao alterar plano'); return; }
        if (modalPlanoInstance) modalPlanoInstance.hide();
        carregarUsuarios(paginaAtual);
    } catch (e) {
        Toast.error('Erro ao conectar com o servidor');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save me-2"></i>Salvar';
    }
}


function abrirModalDesativar(id, statusAtual, callbackAposAcao) {
    document.getElementById('modal-desat-usuario-id').value = id;

    const titulo       = document.getElementById('desativarModalLabel');
    const texto        = document.getElementById('modal-desat-texto');
    const btnConfirmar = document.getElementById('btn-confirmar-desat');

    const estaDesativado = statusAtual === 'desativado' || statusAtual === 'banido';

    if (estaDesativado) {
        titulo.textContent       = 'Ativar Conta';
        titulo.className         = 'modal-title fw-bold text-success';
        texto.textContent        = 'Tem certeza de que deseja ativar esta conta? O usuário poderá acessar a plataforma novamente.';
        btnConfirmar.textContent = 'Sim, Ativar';
        btnConfirmar.className   = 'btn btn-success';
        btnConfirmar.onclick     = () => confirmarStatus(id, 'aprovado', callbackAposAcao);
    } else {
        titulo.textContent       = 'Desativar Conta';
        titulo.className         = 'modal-title fw-bold text-warning';
        texto.textContent        = 'Tem certeza de que deseja desativar esta conta? O acesso será suspenso imediatamente.';
        btnConfirmar.textContent = 'Sim, Desativar';
        btnConfirmar.className   = 'btn btn-warning';
        btnConfirmar.onclick     = () => confirmarStatus(id, 'desativado', callbackAposAcao);
    }

    const el = document.getElementById('desativarModal');
    modalDesatInstance = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
    modalDesatInstance.show();
}

async function confirmarStatus(id, novoStatus, callbackAposAcao) {
    const btn    = document.getElementById('btn-confirmar-desat');
    btn.disabled = true;

    try {
        const retorno = await ApiClientFlow.post('admin_usuario_atualizar_status.php', { usuario_id: id, status: novoStatus });
        if (retorno.status !== 'ok') { Toast.error(retorno.mensagem || 'Erro ao alterar status'); return; }
        if (modalDesatInstance) modalDesatInstance.hide();
        if (typeof callbackAposAcao === 'function') {
            callbackAposAcao();
        } else {
            carregarUsuarios(paginaAtual);
        }
    } catch (e) {
        Toast.error('Erro ao conectar com o servidor');
    } finally {
        btn.disabled = false;
    }
}


async function abrirModalAgencia(usuarioId, nome) {
    agenciaAtualId   = usuarioId;
    agenciaAtualNome = nome;

    document.getElementById('agenciaMembrosModalLabel').textContent = `Membros do Prestador de Serviço`;
    document.getElementById('agenciaNomeLabel').textContent         = nome;
    document.getElementById('membrosLoading').classList.remove('d-none');
    document.getElementById('membrosContent').classList.add('d-none');
    document.getElementById('membrosErro').classList.add('d-none');

    const el = document.getElementById('agenciaMembrosModal');
    modalMembrosInstance = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
    modalMembrosInstance.show();

    await carregarMembrosAgencia();
}

async function carregarMembrosAgencia() {
    document.getElementById('membrosLoading').classList.remove('d-none');
    document.getElementById('membrosContent').classList.add('d-none');
    document.getElementById('membrosErro').classList.add('d-none');

    try {
        const retorno = await ApiClientFlow.get(`admin_agencia_detalhe.php?usuario_id=${agenciaAtualId}`);
        if (retorno.status !== 'ok') throw new Error(retorno.mensagem || 'Erro ao carregar');

        const { clientes, colaboradores } = retorno.data;

        document.getElementById('badgeQtdClientes').textContent      = clientes.length;
        document.getElementById('badgeQtdColaboradores').textContent  = colaboradores.length;

        renderMembrosClientes(clientes);
        renderMembrosColaboradores(colaboradores);

        document.getElementById('membrosLoading').classList.add('d-none');
        document.getElementById('membrosContent').classList.remove('d-none');
        mostrarTabMembros(tabAtiva);

    } catch (e) {
        document.getElementById('membrosLoading').classList.add('d-none');
        document.getElementById('membrosErro').classList.remove('d-none');
        document.getElementById('membrosErroTexto').textContent = e.message || 'Erro ao carregar dados.';
    }
}

function mostrarTabMembros(tab) {
    tabAtiva = tab;
    const btnC  = document.getElementById('btnTabClientes');
    const btnM  = document.getElementById('btnTabColaboradores');
    const divC  = document.getElementById('membrosClientes');
    const divM  = document.getElementById('membrosColaboradores');

    if (tab === 'clientes') {
        btnC.className = 'btn btn-primary';
        btnM.className = 'btn btn-outline-primary';
        divC.classList.remove('d-none');
        divM.classList.add('d-none');
    } else {
        btnC.className = 'btn btn-outline-primary';
        btnM.className = 'btn btn-primary';
        divC.classList.add('d-none');
        divM.classList.remove('d-none');
    }
}

function renderMembrosClientes(clientes) {
    const container = document.getElementById('membrosClientes');
    if (!clientes.length) {
        container.innerHTML = '<div class="text-center py-4 text-muted"><i class="fas fa-users fa-2x mb-2 d-block opacity-25"></i>Nenhum cliente cadastrado.</div>';
        return;
    }

    container.innerHTML = '';
    clientes.forEach(c => {
        const temConta       = c.usuario_id != null;
        const statusAtual    = c.status_conta || 'aprovado';
        const statusBadge    = temConta
            ? getStatusBadge(statusAtual)
            : '<span class="badge bg-light text-dark border">Sem conta</span>';
        const estaDesativado = statusAtual === 'desativado' || statusAtual === 'banido';

        const card = document.createElement('div');
        card.className = 'card mb-2 border-0 shadow-sm rounded-3 p-3';
        card.innerHTML = `
            <div class="d-flex justify-content-between align-items-center gap-2">
                <div class="overflow-hidden flex-grow-1">
                    <div class="fw-semibold text-truncate">${c.nome}</div>
                    <div class="text-muted small text-truncate">${c.email}</div>
                    ${c.empresa ? `<div class="text-muted small"><i class="fa-solid fa-building me-1"></i>${c.empresa}</div>` : ''}
                </div>
                <div class="d-flex align-items-center gap-2 flex-shrink-0">
                    ${statusBadge}
                    ${temConta ? `
                    <button class="btn btn-sm ${estaDesativado ? 'btn-outline-success' : 'btn-outline-warning'} js-toggle-cliente"
                        data-id="${c.usuario_id}" data-status="${statusAtual}"
                        title="${estaDesativado ? 'Ativar conta' : 'Desativar conta'}">
                        <i class="fa-solid ${estaDesativado ? 'fa-check-circle' : 'fa-ban'}"></i>
                    </button>` : ''}
                </div>
            </div>
        `;

        if (temConta) {
            card.querySelector('.js-toggle-cliente').addEventListener('click', (e) => {
                const btn    = e.currentTarget;
                const uid    = parseInt(btn.dataset.id);
                const st     = btn.dataset.status;
                abrirModalDesativar(uid, st, carregarMembrosAgencia);
            });
        }

        container.appendChild(card);
    });
}

function renderMembrosColaboradores(colaboradores) {
    const container = document.getElementById('membrosColaboradores');

    if (!colaboradores.length) {
        container.innerHTML = '<div class="text-center py-4 text-muted"><i class="fas fa-users-cog fa-2x mb-2 d-block opacity-25"></i>Nenhum colaborador cadastrado.</div>';
        return;
    }

    const papelLabel = {
        'admin_agencia': 'Proprietário',
        'gerente':        'Gerente',
        'dev':            'Especialista',
        'gestor_cliente': 'Atendimento',
        'financeiro':     'Financeiro'
    };

    container.innerHTML = '';
    colaboradores.forEach(m => {
        const statusAtual    = m.status_conta || 'aprovado';
        const statusBadge    = getStatusBadge(statusAtual);
        const estaDesativado = statusAtual === 'desativado' || statusAtual === 'banido';
        const papel          = papelLabel[m.papel] || m.papel;

        const card = document.createElement('div');
        card.className = 'card mb-2 border-0 shadow-sm rounded-3 p-3';
        card.innerHTML = `
            <div class="d-flex justify-content-between align-items-center gap-2">
                <div class="overflow-hidden flex-grow-1">
                    <div class="fw-semibold text-truncate">${m.nome}
                        <span class="badge bg-primary-soft text-primary ms-1" style="font-size:0.68rem;">${papel}</span>
                    </div>
                    <div class="text-muted small text-truncate">${m.email}</div>
                </div>
                <div class="d-flex align-items-center gap-2 flex-shrink-0">
                    ${statusBadge}
                    <button class="btn btn-sm ${estaDesativado ? 'btn-outline-success' : 'btn-outline-warning'} js-toggle-colab"
                        data-id="${m.usuario_id}" data-status="${statusAtual}"
                        title="${estaDesativado ? 'Ativar conta' : 'Desativar conta'}">
                        <i class="fa-solid ${estaDesativado ? 'fa-check-circle' : 'fa-ban'}"></i>
                    </button>
                </div>
            </div>
        `;

        card.querySelector('.js-toggle-colab').addEventListener('click', (e) => {
            const btn = e.currentTarget;
            const uid = parseInt(btn.dataset.id);
            const st  = btn.dataset.status;
            abrirModalDesativar(uid, st, carregarMembrosAgencia);
        });

        container.appendChild(card);
    });
}


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
