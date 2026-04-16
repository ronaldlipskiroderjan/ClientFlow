document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar o Sidebar
    await SidebarManager.init();

    // Validar permissões para esta tela
    if (!Auth.hasAccess('perm_gerenciar_membros')) {
        alert('Você não tem permissão para acessar esta área.');
        window.location.href = 'dashboard_agency.html';
        return;
    }

    document.getElementById('btnNovoMembro').classList.remove('d-none');

    // Variáveis globais para os modais
    let modalEditar = new bootstrap.Modal(document.getElementById('modalEditarPermissoes'));
    let modalDesignar = new bootstrap.Modal(document.getElementById('modalDesignarProjeto'));
    let membrosAgencia = [];
    let checklistsAgencia = [];

    // ====== LOADER & INIT ======
    async function init() {
        await carregarMembros();
        await carregarChecklists();
    }

    async function carregarMembros() {
        const teamContainer = document.getElementById('teamContainer');
        const loading = document.getElementById('loadingTeam');
        const empty = document.getElementById('emptyTeam');
        
        teamContainer.innerHTML = '';
        loading.classList.remove('d-none');
        empty.classList.add('d-none');
        
        const response = await API.get('membro_listar.php');
        loading.classList.add('d-none');
        
        if (response && response.status === 'ok') {
            membrosAgencia = response.data;
            
            if (membrosAgencia.length === 0) {
                empty.classList.remove('d-none');
            } else {
                renderizarMembros(membrosAgencia);
            }
        } else {
            console.error("Erro ao carregar membros", response);
            alert("Não foi possível carregar a equipe.");
        }
    }

    async function carregarChecklists() {
        // Aproveitar a API existente que lista os projetos da agencia (todos)
        if (Auth.hasAccess('perm_designar_projetos')) {
            const res = await API.get('checklist_listar_agencia.php');
            if (res && res.status === 'ok') {
                checklistsAgencia = res.data;
                popularSelectChecklists();
            }
        }
    }

    function popularSelectChecklists() {
        const select = document.getElementById('select_projetos');
        select.innerHTML = '<option value="">-- Selecione um projeto --</option>';
        checklistsAgencia.forEach(chk => {
            select.innerHTML += `<option value="${chk.id}">${chk.titulo}</option>`;
        });
    }

    // ====== RENDER =======
    function renderizarMembros(membros) {
        const container = document.getElementById('teamContainer');
        container.innerHTML = '';
        
        membros.forEach(m => {
            const roleNome = getRoleName(m.papel);
            const inativoClass = m.ativo ? '' : 'inactive-member';
            
            const p = m.permissoes;
            const pVerProj = p.ver_projetos ? 'perm-active' : 'perm-inactive';
            const pCriarProj = p.criar_projetos ? 'perm-active' : 'perm-inactive';
            const pVerCli = p.ver_clientes ? 'perm-active' : 'perm-inactive';
            const pFin = p.financeiro ? 'perm-active' : 'perm-inactive';
            
            // Botões de ação (escondemos se for admin principal ou inativo, ou se usuário não puder)
            let actBtnHtml = '';
            if (m.papel !== 'admin_agencia') {
                if (m.ativo) {
                    actBtnHtml = `
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="abrirModalEditar(${m.id})" title="Editar Permissões">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${Auth.hasAccess('perm_designar_projetos') ? 
                        `<button class="btn btn-sm btn-outline-success me-1" onclick="abrirModalDesignar(${m.id})" title="Atribuir Projetos">
                            <i class="fas fa-project-diagram"></i>
                        </button>` : ''}
                    <button class="btn btn-sm btn-outline-danger" onclick="desativarMembro(${m.id})" title="Desativar Membro">
                        <i class="fas fa-user-slash"></i>
                    </button>
                    `;
                } else {
                    actBtnHtml = `<span class="badge bg-secondary">Inativo</span>`;
                }
            } else {
                actBtnHtml = `<span class="badge bg-primary">Owner</span>`;
            }

            container.innerHTML += `
            <div class="col-md-6 col-lg-4">
                <div class="member-card p-4 h-100 d-flex flex-column ${inativoClass}">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div class="d-flex align-items-center">
                            <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width:48px;height:48px;font-size:1.2rem;">
                                ${m.nome.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h6 class="mb-0 fw-bold">${m.nome}</h6>
                                <small class="text-muted">${m.email}</small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <span class="badge role-badge badge-${m.papel} mb-2">${roleNome}</span>
                        <div class="small">
                            <div class="mb-1"><i class="fas fa-check-circle perm-icon ${pVerProj}"></i> Ver Projetos</div>
                            <div class="mb-1"><i class="fas fa-plus-circle perm-icon ${pCriarProj}"></i> Criar Formulários</div>
                            <div class="mb-1"><i class="fas fa-users perm-icon ${pVerCli}"></i> Ver Clientes Base</div>
                            <div class="mb-1"><i class="fas fa-dollar-sign perm-icon ${pFin}"></i> Financeiro</div>
                        </div>
                    </div>
                    
                    <div class="mt-auto">
                        <hr class="my-2">
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted"><i class="fas fa-folder me-1"></i> ${m.projetos_qtd} Projetos Atribuídos</small>
                            <div class="btn-group">
                                ${actBtnHtml}
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        });
    }

    function getRoleName(role) {
         const roles = {
             'admin_agencia': 'Admin/Dono',
             'gerente': 'Gerente',
             'dev': 'Dev/Designer',
             'gestor_cliente': 'Atendimento',
             'financeiro': 'Financeiro'
         };
         return roles[role] || role;
    }

    // ====== EDITAR ======
    window.abrirModalEditar = function(uaId) {
        const membro = membrosAgencia.find(m => m.id === uaId);
        if (!membro) return;
        
        document.getElementById('edit_ua_id').value = membro.id;
        document.getElementById('edit_nome').value = membro.nome;
        document.getElementById('edit_papel').value = membro.papel;
        
        const p = membro.permissoes;
        document.getElementById('edit_perm_ver_projetos').checked = p.ver_projetos;
        document.getElementById('edit_perm_criar_projetos').checked = p.criar_projetos;
        document.getElementById('edit_perm_ver_clientes').checked = p.ver_clientes;
        document.getElementById('edit_perm_criar_clientes').checked = p.criar_clientes;
        document.getElementById('edit_perm_designar_projetos').checked = p.designar_projetos;
        document.getElementById('edit_perm_financeiro').checked = p.financeiro;
        document.getElementById('edit_perm_gerenciar_membros').checked = p.gerenciar_membros;
        
        document.getElementById('alertEditar').classList.add('d-none');
        modalEditar.show();
    };

    document.getElementById('formEditarPermissoes').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnSalvarPermissoes');
        btn.disabled = true;
        btn.innerHTML = 'Salvando...';
        const alertBox = document.getElementById('alertEditar');
        alertBox.classList.add('d-none');
        
        const formData = new URLSearchParams();
        formData.append('ua_id', document.getElementById('edit_ua_id').value);
        formData.append('papel', document.getElementById('edit_papel').value);
        formData.append('perm_ver_projetos', document.getElementById('edit_perm_ver_projetos').checked ? 1 : 0);
        formData.append('perm_criar_projetos', document.getElementById('edit_perm_criar_projetos').checked ? 1 : 0);
        formData.append('perm_ver_clientes', document.getElementById('edit_perm_ver_clientes').checked ? 1 : 0);
        formData.append('perm_criar_clientes', document.getElementById('edit_perm_criar_clientes').checked ? 1 : 0);
        formData.append('perm_designar_projetos', document.getElementById('edit_perm_designar_projetos').checked ? 1 : 0);
        formData.append('perm_financeiro', document.getElementById('edit_perm_financeiro').checked ? 1 : 0);
        formData.append('perm_gerenciar_membros', document.getElementById('edit_perm_gerenciar_membros').checked ? 1 : 0);
        
        const res = await API.post('membro_atualizar.php', formData);
        btn.disabled = false;
        btn.innerHTML = 'Salvar Alterações';
        
        if (res && res.status === 'ok') {
            modalEditar.hide();
            carregarMembros(); // recarrega a grid
        } else {
            alertBox.textContent = res ? res.mensagem : 'Erro na requisição.';
            alertBox.classList.remove('d-none');
        }
    });

    // ====== DESATIVAR ======
    window.desativarMembro = async function(uaId) {
        if (!confirm('Tem certeza? Este usuário perderá acesso imediato aos projetos da agência e sairá de todas as suas designações.')) {
            return;
        }
        
        const formData = new URLSearchParams();
        formData.append('ua_id', uaId);
        
        const res = await API.post('membro_excluir.php', formData);
        if (res && res.status === 'ok') {
            carregarMembros();
        } else {
            alert(res ? res.mensagem : 'Erro ao desativar.');
        }
    };

    // ====== DESIGNAR PROJETOS ======
    window.abrirModalDesignar = function(uaId) {
        if (!Auth.hasAccess('perm_designar_projetos')) {
            alert("Acesso negado.");
            return;
        }
        
        const membro = membrosAgencia.find(m => m.id === uaId);
        if (!membro) return;
        
        document.getElementById('designar_ua_id').value = membro.id;
        document.getElementById('designarNome').textContent = membro.nome;
        document.getElementById('select_projetos').value = '';
        document.getElementById('alertDesignar').classList.add('d-none');
        
        renderizarProjetosAtribuidos(membro);
        modalDesignar.show();
    };

    function renderizarProjetosAtribuidos(membro) {
        const lista = document.getElementById('lista_projetos_membro');
        lista.innerHTML = '';
        
        if (!membro.projetos || membro.projetos.length === 0) {
            lista.innerHTML = '<li class="list-group-item text-muted text-center"><small>Nenhum projeto atribuído.</small></li>';
            return;
        }
        
        membro.projetos.forEach(p => {
            lista.innerHTML += `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                ${p.titulo}
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="removerDesignacao(${membro.id}, ${p.id})">
                    <i class="fas fa-times"></i>
                </button>
            </li>`;
        });
    }

    document.getElementById('formDesignarProjeto').addEventListener('submit', async (e) => {
        e.preventDefault();
        const uaId = document.getElementById('designar_ua_id').value;
        const chkId = document.getElementById('select_projetos').value;
        const alertBox = document.getElementById('alertDesignar');
        const btn = document.getElementById('btnSalvarDesignacao');
        
        if (!chkId) {
            alertBox.textContent = "Selecione um projeto.";
            alertBox.className = "alert alert-danger";
            return;
        }
        
        btn.disabled = true;
        btn.innerHTML = '...';
        
        const formData = new URLSearchParams();
        formData.append('ua_id', uaId);
        formData.append('checklist_id', chkId);
        formData.append('acao', 'vincular');
        
        const res = await API.post('projeto_designar.php', formData);
        
        if (res && res.status === 'ok') {
            await carregarMembros(); // update state
            const membroAtualizado = membrosAgencia.find(m => m.id == uaId);
            renderizarProjetosAtribuidos(membroAtualizado);
            
            alertBox.textContent = "Projeto designado!";
            alertBox.className = "alert alert-success";
            document.getElementById('select_projetos').value = '';
        } else {
            alertBox.textContent = res ? res.mensagem : 'Erro ao designar.';
            alertBox.className = "alert alert-danger";
        }
        
        alertBox.classList.remove('d-none');
        btn.disabled = false;
        btn.innerHTML = 'Designar';
    });

    window.removerDesignacao = async function(uaId, chkId) {
        if (!confirm('Remover o acesso deste membro a este projeto?')) return;
        
        const formData = new URLSearchParams();
        formData.append('ua_id', uaId);
        formData.append('checklist_id', chkId);
        formData.append('acao', 'remover');
        
        const res = await API.post('projeto_designar.php', formData);
        if (res && res.status === 'ok') {
            await carregarMembros();
            const membroAtualizado = membrosAgencia.find(m => m.id == uaId);
            renderizarProjetosAtribuidos(membroAtualizado);
        } else {
            alert(res ? res.mensagem : 'Erro.');
        }
    };

    // Go
    init();
});
