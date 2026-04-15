document.addEventListener('DOMContentLoaded', async () => {
    await SidebarManager.init();

    if (!Auth.hasAccess('perm_financeiro')) {
        alert('Acesso negado ao módulo financeiro.');
        window.location.href = 'financeiro.html';
        return;
    }

    const form = document.getElementById('formNovoContrato');
    const selCliente = document.getElementById('contrato_cliente_id');
    const selChecklist = document.getElementById('contrato_checklist_id');
    const btnSalvar = document.getElementById('btnSalvar');
    const alertFeedback = document.getElementById('alertFeedback');

    // Mácara simples dinheiro (não muito robusta, mas serve p/ MVP)
    const valInput = document.getElementById('contrato_valor');
    valInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = (value / 100).toFixed(2) + '';
        value = value.replace(".", ",");
        value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
        e.target.value = value;
    });

    // Populate selects
    async function loadSelects() {
        // Clientes
        const rCli = await API.get('cliente_listar.php');
        if (rCli && rCli.status === 'ok') {
            selCliente.innerHTML = '<option value="">Selecione o Cliente</option>';
            rCli.data.forEach(c => {
                 selCliente.innerHTML += `<option value="${c.id}">${c.nome} ${c.empresa ? `(${c.empresa})` : ''}</option>`;
            });
        }
        
        // Projetos (Checklists) - Apenas para referência no contrato
        // Se a pessoa tiver perm_ver_projetos, ela pode listar. Senão, fica off.
        if (Auth.hasAccess('perm_ver_projetos')) {
             const rProj = await API.get('checklist_listar_agencia.php');
             if (rProj && rProj.status === 'ok') {
                 rProj.data.forEach(c => {
                     let cliNome = c.cliente_nome ? ` (Cli: ${c.cliente_nome})` : '';
                     selChecklist.innerHTML += `<option value="${c.id}">${c.titulo}${cliNome}</option>`;
                 });
             }
        }
    }

    loadSelects();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        btnSalvar.disabled = true;
        btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        alertFeedback.classList.add('d-none');
        
        const formData = new URLSearchParams();
        formData.append('cliente_id', selCliente.value);
        formData.append('checklist_id', selChecklist.value);
        formData.append('titulo', document.getElementById('contrato_titulo').value);
        formData.append('descricao_servico', document.getElementById('contrato_descricao').value);
        formData.append('valor_total', valInput.value);
        formData.append('qtd_parcelas', document.getElementById('contrato_parcelas').value);
        formData.append('forma_pagamento', document.getElementById('contrato_forma_pagamento').value);
        formData.append('data_inicio', document.getElementById('contrato_data_inicio').value);
        formData.append('data_prazo', document.getElementById('contrato_data_prazo').value);
        formData.append('data_vencimento_pagamento', document.getElementById('contrato_data_vencimento').value);
        formData.append('status_pagamento', document.getElementById('contrato_status_pagamento').value);
        formData.append('status_projeto', document.getElementById('contrato_status_projeto').value);
        formData.append('observacoes', document.getElementById('contrato_observacoes').value);
        
        const res = await API.post('contrato_cadastrar.php', formData);
        
        if (res && res.status === 'ok') {
            alertFeedback.className = "alert alert-success mt-3";
            alertFeedback.innerHTML = `<i class="fas fa-check-circle me-2"></i> ${res.mensagem}`;
            alertFeedback.classList.remove('d-none');
            
            setTimeout(() => {
                window.location.href = 'financeiro.html';
            }, 1000);
        } else {
            alertFeedback.className = "alert alert-danger mt-3";
            alertFeedback.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i> ${res ? res.mensagem : 'Erro ao cadstrar.'}`;
            alertFeedback.classList.remove('d-none');
            
            btnSalvar.disabled = false;
            btnSalvar.innerHTML = '<i class="fas fa-save me-2"></i> Registrar Contrato';
        }
    });
});
