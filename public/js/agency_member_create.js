document.addEventListener('DOMContentLoaded', async () => {
    await SidebarManager.init();

    if (!Auth.hasAccess('perm_gerenciar_membros')) {
        alert('Você não tem permissão para cadastrar membros.');
        window.location.href = 'agency_team.html';
        return;
    }

    const form = document.getElementById('formNovoMembro');
    const containerProjetos = document.getElementById('containerProjetos');
    const btnSalvar = document.getElementById('btnSalvar');
    const alertFeedback = document.getElementById('alertFeedback');
    const roleSelect = document.getElementById('membro_papel');
    
    let checklists = [];

    // Pre-sets de perfis
    roleSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        const p_ver_proj = document.getElementById('perm_ver_projetos');
        const p_criar_proj = document.getElementById('perm_criar_projetos');
        const p_ver_cli = document.getElementById('perm_ver_clientes');
        const p_criar_cli = document.getElementById('perm_criar_clientes');
        const p_des_proj = document.getElementById('perm_designar_projetos');
        const p_fin = document.getElementById('perm_financeiro');
        const p_ger_mem = document.getElementById('perm_gerenciar_membros');

        // Reset
        p_ver_proj.checked = false;
        p_criar_proj.checked = false;
        p_ver_cli.checked = false;
        p_criar_cli.checked = false;
        p_des_proj.checked = false;
        p_fin.checked = false;
        p_ger_mem.checked = false;

        if (val === 'dev') {
            p_ver_proj.checked = true;
        } else if (val === 'gestor_cliente') {
            p_ver_proj.checked = true;
            p_ver_cli.checked = true;
        } else if (val === 'financeiro') {
            p_ver_cli.checked = true;
            p_fin.checked = true;
        } else if (val === 'gerente') {
            p_ver_proj.checked = true;
            p_criar_proj.checked = true;
            p_ver_cli.checked = true;
            p_criar_cli.checked = true;
            p_des_proj.checked = true;
            p_fin.checked = true;
        }
    });

    // Load available projects
    async function loadProjetos() {
        if (!Auth.hasAccess('perm_designar_projetos')) {
            containerProjetos.innerHTML = '<div class="alert alert-warning">Você não pode atribuir projetos pois não tem permissão.</div>';
            return;
        }
        
        const res = await API.get('checklist_listar_agencia.php');
        if (res && res.status === 'ok') {
            checklists = res.data;
            if (checklists.length === 0) {
                containerProjetos.innerHTML = '<div class="text-muted"><small>A agência não possui projetos criados ainda.</small></div>';
            } else {
                containerProjetos.innerHTML = '';
                checklists.forEach(c => {
                    containerProjetos.innerHTML += `
                    <div class="col-md-6 col-lg-4">
                        <div class="form-check p-2 border rounded">
                            <input class="form-check-input ms-1 shadow-none checklist-checkbox" type="checkbox" value="${c.id}" id="chk_${c.id}">
                            <label class="form-check-label ps-2 ms-1 w-100 cursor-pointer" for="chk_${c.id}">
                                <div class="text-truncate fw-bold" style="font-size: 0.9rem;">${c.titulo}</div>
                                <div class="text-truncate text-muted" style="font-size: 0.75rem;">Cliente: ${c.cliente_nome || 'Não vinculado'}</div>
                            </label>
                        </div>
                    </div>`;
                });
            }
        } else {
            containerProjetos.innerHTML = '<div class="text-danger">Erro ao carregar projetos.</div>';
        }
    }

    loadProjetos();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        btnSalvar.disabled = true;
        btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando...';
        alertFeedback.classList.add('d-none');
        
        const projetos_selecionados = [];
        document.querySelectorAll('.checklist-checkbox:checked').forEach(cb => {
            projetos_selecionados.push(cb.value);
        });

        const formData = new URLSearchParams();
        formData.append('nome', document.getElementById('membro_nome').value);
        formData.append('email', document.getElementById('membro_email').value);
        formData.append('telefone', document.getElementById('membro_telefone').value);
        formData.append('senha', document.getElementById('membro_senha').value);
        formData.append('papel', document.getElementById('membro_papel').value);
        
        formData.append('perm_ver_projetos', document.getElementById('perm_ver_projetos').checked ? 1 : 0);
        formData.append('perm_criar_projetos', document.getElementById('perm_criar_projetos').checked ? 1 : 0);
        formData.append('perm_ver_clientes', document.getElementById('perm_ver_clientes').checked ? 1 : 0);
        formData.append('perm_criar_clientes', document.getElementById('perm_criar_clientes').checked ? 1 : 0);
        formData.append('perm_designar_projetos', document.getElementById('perm_designar_projetos').checked ? 1 : 0);
        formData.append('perm_financeiro', document.getElementById('perm_financeiro').checked ? 1 : 0);
        formData.append('perm_gerenciar_membros', document.getElementById('perm_gerenciar_membros').checked ? 1 : 0);
        
        if (projetos_selecionados.length > 0) {
            formData.append('projetos_designados', projetos_selecionados.join(','));
        }
        
        const res = await API.post('membro_cadastrar.php', formData);
        
        if (res && res.status === 'ok') {
            alertFeedback.className = "alert alert-success mt-3";
            alertFeedback.innerHTML = `<i class="fas fa-check-circle me-2"></i> ${res.mensagem} Redirecionando...`;
            alertFeedback.classList.remove('d-none');
            
            setTimeout(() => {
                window.location.href = 'agency_team.html';
            }, 1500);
        } else {
            alertFeedback.className = "alert alert-danger mt-3";
            alertFeedback.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i> ${res ? res.mensagem : 'Erro ao processar.'}`;
            alertFeedback.classList.remove('d-none');
            
            btnSalvar.disabled = false;
            btnSalvar.innerHTML = '<i class="fas fa-save me-2"></i> Criar Membro';
        }
    });
});
