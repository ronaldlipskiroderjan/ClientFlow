let usuarioSelecionado = null;
let paginaAtual = 1;

async function carregarUsuarios(pagina = 1) {
    paginaAtual = pagina;
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const emptyState = document.getElementById('empty-state');
    const usuariosContainer = document.getElementById('usuarios-container');
    const usuariosTbody = document.getElementById('usuarios-tbody');
    const paginationContainer = document.getElementById('pagination-container');
    
    const filtroStatus = document.getElementById('filtro-status').value;
    const filtroPlano = document.getElementById('filtro-plano').value;

    loadingState.classList.remove('d-none');
    errorState.classList.add('d-none');
    emptyState.classList.add('d-none');
    usuariosContainer.classList.add('d-none');
    paginationContainer.classList.add('d-none');

    try {
        const queryParams = new URLSearchParams({
            page: paginaAtual,
            limit: 10
        });
        
        if (filtroStatus) queryParams.append('status', filtroStatus);
        if (filtroPlano) queryParams.append('plano_id', filtroPlano);

        const retorno = await ApiClientFlow.get(`admin_usuarios_listar.php?${queryParams.toString()}`);

        if (retorno.status !== 'ok') {
            throw new Error(retorno.mensagem || 'Erro ao carregar usuários');
        }

        const usuarios = Array.isArray(retorno.data) ? retorno.data : [];

        if (usuarios.length === 0) {
            loadingState.classList.add('d-none');
            emptyState.classList.remove('d-none');
            return;
        }

        usuariosTbody.innerHTML = '';
        usuarios.forEach(usuario => {
            const row = document.createElement('tr');
            const statusBadge = getStatusBadge(usuario.status_conta);
            const dataAcesso = usuario.data_ultimo_acesso 
                ? new Date(usuario.data_ultimo_acesso).toLocaleString('pt-BR') 
                : '<span class="text-muted">Nunca acessou</span>';
            const nomePlano = usuario.nome_plano ? `<span class="badge bg-secondary">${usuario.nome_plano}</span>` : '<span class="badge bg-light text-dark">Nenhum</span>';

            row.innerHTML = `
                <td class="fw-semibold">${usuario.nome}</td>
                <td>${usuario.email}</td>
                <td>${nomePlano}</td>
                <td>${dataAcesso}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="abrirModalMudarPlano(${usuario.id}, ${usuario.plano_id || 1})" title="Mudar Plano">
                        <i class="fa-solid fa-gem"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="abrirModalBanir(${usuario.id}, '${usuario.status_conta}')" title="${usuario.status_conta === 'banido' ? 'Desbanir' : 'Banir'}">
                        <i class="fa-solid fa-ban"></i>
                    </button>
                </td>
            `;
            usuariosTbody.appendChild(row);
        });

        if (retorno.pagination && retorno.pagination.pages > 1) {
            renderizarPaginacao(retorno.pagination);
            paginationContainer.classList.remove('d-none');
        }

        loadingState.classList.add('d-none');
        usuariosContainer.classList.remove('d-none');

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
    const statusMap = {
        'ativo': '<span class="badge bg-success">Ativo</span>',
        'aprovado': '<span class="badge bg-success">Ativo</span>',
        'pendente': '<span class="badge bg-warning text-dark">Pendente</span>',
        'banido': '<span class="badge bg-danger">Banido</span>'
    };
    return statusMap[status] || '<span class="badge bg-secondary">Desconhecido</span>';
}

let modalPlanoInstance = null;
function abrirModalMudarPlano(id, planoAtualId) {
    document.getElementById('modal-plano-usuario-id').value = id;
    document.getElementById('modal-plano-select').value = planoAtualId;
    const el = document.getElementById('mudarPlanoModal');
    modalPlanoInstance = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
    modalPlanoInstance.show();
}

async function salvarNovoPlano() {
    const id = document.getElementById('modal-plano-usuario-id').value;
    const planoId = document.getElementById('modal-plano-select').value;
    const btn = document.getElementById('btn-salvar-plano');
    btn.disabled = true;

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
        alert("Admin: Mudança de plano com sucesso");
    } catch (error) {
        alert('Erro ao conectar com o servidor');
        console.error(error);
    } finally {
        btn.disabled = false;
    }
}

let modalBanInstance = null;
function abrirModalBanir(id, statusAtual) {
    document.getElementById('modal-ban-usuario-id').value = id;
    
    const titulo = document.getElementById('banirUsuarioModalLabel');
    const texto = document.querySelector('#banirUsuarioModal .modal-body p');
    const btnConfirmar = document.getElementById('btn-confirmar-ban');

    if (statusAtual === 'banido') {
        titulo.innerText = 'Confirmar Desbanimento';
        titulo.className = 'modal-title fw-bold text-success';
        texto.innerText = 'Tem certeza de que deseja desbanir este usuário? Ele poderá acessar a plataforma novamente.';
        btnConfirmar.innerText = 'Sim, Desbanir';
        btnConfirmar.className = 'btn btn-success';
        btnConfirmar.onclick = () => confirmarStatus(id, 'aprovado');
    } else {
        titulo.innerText = 'Confirmar Banimento';
        titulo.className = 'modal-title fw-bold text-danger';
        texto.innerText = 'Tem certeza de que deseja banir este usuário? Sua sessão será imediatamente invalidada.';
        btnConfirmar.innerText = 'Sim, Banir';
        btnConfirmar.className = 'btn btn-danger';
        btnConfirmar.onclick = () => confirmarStatus(id, 'banido');
    }

    const el = document.getElementById('banirUsuarioModal');
    modalBanInstance = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
    modalBanInstance.show();
}

async function confirmarStatus(id, novoStatus) {
    const btn = document.getElementById('btn-confirmar-ban');
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

        if (modalBanInstance) modalBanInstance.hide();
        carregarUsuarios(paginaAtual);
    } catch (error) {
        alert('Erro ao conectar com o servidor');
        console.error(error);
    } finally {
        btn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const sessao = await Auth.validateSession();
    if (!sessao || sessao.tipo !== 'admin') {
        window.location.href = 'login_admin.html';
        return;
    }

    carregarUsuarios(1);
});
