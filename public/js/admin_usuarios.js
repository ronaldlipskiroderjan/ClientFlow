let usuarioSelecionado = null;

async function carregarUsuarios() {
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const emptyState = document.getElementById('empty-state');
    const usuariosContainer = document.getElementById('usuarios-container');
    const usuariosTbody = document.getElementById('usuarios-tbody');

    loadingState.classList.remove('d-none');
    errorState.classList.add('d-none');
    emptyState.classList.add('d-none');
    usuariosContainer.classList.add('d-none');

    try {
        const retorno = await ApiClientFlow.get('admin_usuarios_listar.php');

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
            const tipoBadge = getTipoBadge(usuario.tipo);
            const data = new Date(usuario.criado_em).toLocaleDateString('pt-BR');

            row.innerHTML = `
                <td class="fw-semibold">${usuario.nome}</td>
                <td>${usuario.email}</td>
                <td>${tipoBadge}</td>
                <td>${statusBadge}</td>
                <td class="text-muted small">${data}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="abrirModalUsuario(${usuario.id}, '${usuario.nome}', '${usuario.email}', '${usuario.tipo}', '${usuario.status_conta}')">
                        <i class="fa-solid fa-eye me-1"></i>Ver
                    </button>
                </td>
            `;
            usuariosTbody.appendChild(row);
        });

        loadingState.classList.add('d-none');
        usuariosContainer.classList.remove('d-none');

    } catch (error) {
        loadingState.classList.add('d-none');
        errorState.classList.remove('d-none');
        console.error(error);
    }
}

function getStatusBadge(status) {
    const statusMap = {
        'aprovado': '<span class="badge bg-success">Aprovado</span>',
        'pendente': '<span class="badge bg-warning text-dark">Pendente</span>',
        'banido': '<span class="badge bg-danger">Banido</span>'
    };
    return statusMap[status] || '<span class="badge bg-secondary">Desconhecido</span>';
}

function getTipoBadge(tipo) {
    const tipoMap = {
        'admin': '<span class="badge bg-primary">Admin</span>',
        'client': '<span class="badge bg-info">Cliente</span>',
        'agency': '<span class="badge bg-success">Agência</span>',
        'agency_member': '<span class="badge bg-warning text-dark">Membro Agência</span>'
    };
    return tipoMap[tipo] || '<span class="badge bg-secondary">Desconhecido</span>';
}

function abrirModalUsuario(id, nome, email, tipo, status) {
    usuarioSelecionado = { id, nome, email, tipo, status };

    const modalInfo = document.getElementById('modal-usuario-info');
    modalInfo.innerHTML = `
        <div class="mb-3">
            <label class="form-label text-muted fw-semibold">Nome</label>
            <p class="form-control-plaintext">${nome}</p>
        </div>
        <div class="mb-3">
            <label class="form-label text-muted fw-semibold">E-mail</label>
            <p class="form-control-plaintext">${email}</p>
        </div>
        <div class="mb-3">
            <label class="form-label text-muted fw-semibold">Tipo de Usuário</label>
            <p class="form-control-plaintext">${getTipoBadge(tipo)}</p>
        </div>
        <div class="mb-3">
            <label class="form-label text-muted fw-semibold">Status da Conta</label>
            <p class="form-control-plaintext">${getStatusBadge(status)}</p>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('usuarioModal'));
    modal.show();
}

async function deletarUsuario() {
    if (!usuarioSelecionado) return;

    if (!confirm(`Tem certeza que deseja deletar o usuário "${usuarioSelecionado.nome}"? Esta ação não pode ser desfeita.`)) {
        return;
    }

    try {
        const retorno = await ApiClientFlow.post('admin_usuario_deletar.php', {
            usuario_id: usuarioSelecionado.id
        });

        if (retorno.status !== 'ok') {
            alert(retorno.mensagem || 'Erro ao deletar usuário');
            return;
        }

        alert('Usuário deletado com sucesso');
        bootstrap.Modal.getInstance(document.getElementById('usuarioModal')).hide();
        carregarUsuarios();
        usuarioSelecionado = null;

    } catch (error) {
        alert('Erro ao conectar com o servidor');
        console.error(error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const sessao = await Auth.validateSession();
    if (!sessao || sessao.tipo !== 'admin') {
        window.location.href = 'login_admin.html';
        return;
    }

    document.getElementById('btn-deletar-usuario').addEventListener('click', deletarUsuario);
    carregarUsuarios();
});
