document.addEventListener('DOMContentLoaded', async () => {
    await SidebarManager.init();

    if (!Auth.hasAccess('perm_financeiro')) {
        alert('Você não tem permissão para acessar o Financeiro/Contratos.');
        window.location.href = 'dashboard_agency.html';
        return;
    }

    let contratosTotais = [];
    let modalStatus = new bootstrap.Modal(document.getElementById('modalEditarStatus'));
    
    // Filtros
    const filterPgmt = document.getElementById('filterStatusPgmt');
    const filterProj = document.getElementById('filterStatusProj');
    
    filterPgmt.addEventListener('change', renderizarTabela);
    filterProj.addEventListener('change', renderizarTabela);

    async function loadContratos() {
        const tbody = document.getElementById('tabelaContratosBody');
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">Carregando dados...</td></tr>';
        
        const res = await API.get('contrato_listar.php');
        if (res && res.status === 'ok') {
            contratosTotais = res.data;
            
            // Render KPIs
            document.getElementById('kpi-ativos').textContent = res.kpis.ativos;
            document.getElementById('kpi-concluidos').textContent = res.kpis.concluidos;
            document.getElementById('kpi-inadimplentes').textContent = res.kpis.inadimplentes;
            
            // Format BRL
            const brlProg = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
            document.getElementById('kpi-valor-aberto').textContent = brlProg.format(res.kpis.valor_aberto);
            
            renderizarTabela();
        } else {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger py-4">Erro ao carregar dados.</td></tr>';
        }
    }

    function renderizarTabela() {
        const tbody = document.getElementById('tabelaContratosBody');
        tbody.innerHTML = '';
        
        const fP = filterPgmt.value;
        const fPr = filterProj.value;
        
        const filtrados = contratosTotais.filter(c => {
            if (fP && c.status_pagamento !== fP) return false;
            if (fPr && c.status_projeto !== fPr) return false;
            return true;
        });
        
        if (filtrados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-5 text-muted">Nenhum contrato encontrado.</td></tr>';
            return;
        }

        const brlProg = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

        filtrados.forEach(c => {
            
            const badgePgmt = `status-pagamento-${c.status_pagamento}`;
            const labelPgmt = c.status_pagamento.toUpperCase();
            
            const badgeProj = `status-projeto-${c.status_projeto}`;
            const labelProj = c.status_projeto.replace('_', ' ').toUpperCase();
            
            // Ações: Editar e Excluir
            let btnAcoes = `
                <button class="btn btn-sm btn-light btn-outline-secondary me-1" onclick="abrirModalStatus(${c.id})" title="Atualizar Status">
                    <i class="fas fa-edit"></i>
                </button>
            `;
            
            // Somente admin_agencia pode excluir contratos
            if (Auth.get('papel_agencia') === 'admin_agencia') {
                btnAcoes += `
                    <button class="btn btn-sm btn-light btn-outline-danger" onclick="excluirContrato(${c.id})" title="Excluir Contrato">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                `;
            }

            tbody.innerHTML += `
             <tr>
                <td class="ps-4">
                    <div class="fw-bold">${c.titulo}</div>
                    <div class="small text-muted">${c.cliente_nome}</div>
                </td>
                <td class="fw-bold">${brlProg.format(c.valor_total)}</td>
                <td>${c.qtd_parcelas}x</td>
                <td><i class="far fa-calendar-alt text-muted me-1"></i>${formatDate(c.data_prazo)}</td>
                <td><i class="far fa-calendar-alt text-muted me-1"></i>${formatDate(c.data_vencimento_pagamento)}</td>
                <td><span class="badge rounded-pill ${badgePgmt}">${labelPgmt}</span></td>
                <td><span class="badge rounded-pill ${badgeProj}">${labelProj}</span></td>
                <td class="text-end pe-4">${btnAcoes}</td>
             </tr>
            `;
        });
    }

    function formatDate(dateString) {
        if (!dateString) return '-';
        const p = dateString.split('-');
        if(p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
        return dateString;
    }

    window.abrirModalStatus = function(id) {
        const c = contratosTotais.find(x => x.id == id);
        if(!c) return;
        
        document.getElementById('edit_contrato_id').value = c.id;
        document.getElementById('edit_status_pagamento').value = c.status_pagamento;
        document.getElementById('edit_status_projeto').value = c.status_projeto;
        
        modalStatus.show();
    };

    document.getElementById('formAtualizarStatus').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnSalvarStatus');
        btn.disabled = true;
        btn.textContent = 'Salvando...';
        
        const params = new URLSearchParams();
        params.append('id', document.getElementById('edit_contrato_id').value);
        params.append('status_pagamento', document.getElementById('edit_status_pagamento').value);
        params.append('status_projeto', document.getElementById('edit_status_projeto').value);
        
        const res = await API.post('contrato_atualizar.php', params);
        
        if(res && res.status === 'ok') {
            modalStatus.hide();
            await loadContratos();
        } else {
            alert(res ? res.mensagem : 'Erro ao atualizar.');
        }
        
        btn.disabled = false;
        btn.textContent = 'Salvar Alterações';
    });

    window.excluirContrato = async function(id) {
        if(!confirm('Tem certeza? Esta ação removerá o contrato e não pode ser desfeita.')) return;
        
        const params = new URLSearchParams();
        params.append('id', id);
        
        const res = await API.post('contrato_excluir.php', params);
        if(res && res.status === 'ok') {
            await loadContratos();
        } else {
            alert(res ? res.mensagem : 'Erro ao excluir.');
        }
    };

    loadContratos();
});
