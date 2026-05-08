document.addEventListener("DOMContentLoaded", async () => {
    await SidebarManager.init();
    
    if (!Auth.hasAccess('perm_ver_clientes') && !Auth.hasAccess('perm_criar_clientes')) {
         alert('Você não tem permissão para visualizar clientes.');
         window.location.href = "dashboard_agency.html";
         return;
    }
    
    const btnNovo = document.getElementById("btnNovoCliente");
    if(btnNovo && !Auth.hasAccess('perm_criar_clientes')){
        btnNovo.classList.add('d-none');
    }

    const tableBody = document.getElementById("clientsTableBody");

    function montarCardCliente(cliente) {
        const dataCadastro = cliente.criado_em ? new Date(cliente.criado_em).toLocaleDateString('pt-BR') : '-';
        const canDelete = Auth.get('papel_agencia') === 'admin_agencia' || Auth.getTipo() === 'freelancer' || Auth.getTipo() === 'admin';

        const card = document.createElement('div');
        card.className = 'card mb-2 border-0 shadow-sm rounded-3 p-3';
        card.style.cursor = 'pointer';
        card.innerHTML = `
            <div class="d-flex justify-content-between align-items-start mb-1">
                <div class="overflow-hidden me-2">
                    <div class="fw-bold text-truncate">${cliente.nome}</div>
                    <div class="text-muted small text-truncate">${cliente.email}</div>
                </div>
                <div class="d-flex gap-1 flex-shrink-0">
                    <button type="button" class="btn btn-sm btn-outline-custom p-1 px-2 js-view-client" data-id="${cliente.id}" title="Ver Detalhes">
                        <i class="fa-solid fa-folder-open"></i>
                    </button>
                    ${canDelete ? `<button type="button" class="btn btn-sm btn-outline-danger p-1 px-2 js-delete-client" data-id="${cliente.id}"><i class="fa-solid fa-trash"></i></button>` : ''}
                </div>
            </div>
            ${cliente.empresa ? `<div class="text-muted small"><i class="fa-solid fa-building me-1"></i>${cliente.empresa}</div>` : ''}
            <div class="text-muted mt-1" style="font-size:0.72rem;"><i class="fa-solid fa-calendar me-1"></i>Cliente desde ${dataCadastro}</div>
        `;
        card.addEventListener('click', (e) => {
            if (!e.target.closest('button')) abrirModalDetalhesCliente(cliente.id);
        });
        return card;
    }

    function montarLinhaCliente(cliente) {
        const row = document.createElement("tr");
        row.style.cursor = "pointer";
        row.classList.add("client-row");
        const dataCadastro = cliente.criado_em ? new Date(cliente.criado_em).toLocaleDateString() : "-";
        
        let actionBtns = `<button type="button" class="btn btn-sm btn-outline-custom p-1 px-2 js-view-client" data-id="${cliente.id}" title="Ver Detalhes do Cliente"><i class="fa-solid fa-folder-open"></i></button>`;
        
        if (Auth.get('papel_agencia') === 'admin_agencia' || Auth.getTipo() === 'freelancer' || Auth.getTipo() === 'admin') {
            actionBtns += ` <button type="button" class="btn btn-sm btn-outline-danger p-1 px-2 js-delete-client" data-id="${cliente.id}"><i class="fa-solid fa-trash"></i></button>`;
        }

        row.innerHTML = `
            <td class="fw-bold">${cliente.nome}</td>
            <td>${cliente.empresa || "-"}</td>
            <td>${cliente.email}</td>
            <td>${dataCadastro}</td>
            <td class="text-end">
                ${actionBtns}
            </td>
        `;

        row.addEventListener("click", (e) => {
            if (!e.target.closest('button')) {
                abrirModalDetalhesCliente(cliente.id);
            }
        });

        return row;
    }

    let modalDetalhes = null;

    async function abrirModalDetalhesCliente(id) {
        const modalEl = document.getElementById('modalClienteDetalhes');
        if (!modalDetalhes) {
            modalDetalhes = new bootstrap.Modal(modalEl);
        }
        
        document.getElementById('modal-cliente-loading').classList.remove('d-none');
        document.getElementById('modal-cliente-content').classList.add('d-none');
        modalDetalhes.show();

        try {
            const retorno = await API.get(`cliente_detalhes.php?id=${id}`);
            if (retorno.status !== 'ok') throw new Error(retorno.mensagem);
            
            const c = retorno.data;
            document.getElementById('detalhe-nome').innerText = c.nome || '-';
            document.getElementById('detalhe-empresa').innerText = c.empresa || '-';
            document.getElementById('detalhe-email').innerText = c.email || '-';
            document.getElementById('detalhe-telefone').innerText = c.telefone || '-';
            document.getElementById('detalhe-cadastro').innerText = c.criado_em ? new Date(c.criado_em).toLocaleDateString() : '-';
            
            document.getElementById('badge-projetos').innerText = c.projetos.length;
            document.getElementById('badge-contratos').innerText = c.contratos.length;

            const listaProjetos = document.getElementById('lista-projetos');
            const emptyProjetos = document.getElementById('empty-projetos');
            listaProjetos.innerHTML = '';
            if (c.projetos.length === 0) {
                listaProjetos.classList.add('d-none');
                emptyProjetos.classList.remove('d-none');
            } else {
                listaProjetos.classList.remove('d-none');
                emptyProjetos.classList.add('d-none');
                c.projetos.forEach(p => {
                    listaProjetos.innerHTML += `
                        <div class="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-1">${p.titulo}</h6>
                                <small class="text-muted">Criado em: ${new Date(p.criado_em).toLocaleDateString()}</small>
                            </div>
                            <span class="badge bg-${p.status === 'Encerrado' ? 'success' : 'primary'} rounded-pill">${p.status}</span>
                        </div>
                    `;
                });
            }

            const listaContratos = document.getElementById('lista-contratos');
            const emptyContratos = document.getElementById('empty-contratos');
            listaContratos.innerHTML = '';
            if (c.contratos.length === 0) {
                listaContratos.classList.add('d-none');
                emptyContratos.classList.remove('d-none');
            } else {
                listaContratos.classList.remove('d-none');
                emptyContratos.classList.add('d-none');
                c.contratos.forEach(cont => {
                    listaContratos.innerHTML += `
                        <div class="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="mb-1">${cont.titulo}</h6>
                                <span class="badge bg-${cont.status_pagamento === 'pago' ? 'success' : (cont.status_pagamento === 'atrasado' ? 'danger' : 'warning text-dark')}">${cont.status_pagamento}</span>
                                <span class="badge bg-light text-dark border ms-1">${cont.status_projeto}</span>
                            </div>
                            <div class="text-end fw-bold text-success">
                                R$ ${parseFloat(cont.valor_total).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                            </div>
                        </div>
                    `;
                });
            }

            document.getElementById('modal-cliente-loading').classList.add('d-none');
            document.getElementById('modal-cliente-content').classList.remove('d-none');
            
        } catch (error) {
            modalDetalhes.hide();
            alert('Erro ao carregar detalhes do cliente: ' + error.message);
        }
    }

    function bindEvents() {
        document.querySelectorAll(".js-view-client").forEach((button) => {
            button.addEventListener("click", (e) => {
                e.stopPropagation();
                const clienteId = button.getAttribute("data-id");
                if (clienteId) abrirModalDetalhesCliente(clienteId);
            });
        });

        document.querySelectorAll(".js-delete-client").forEach((button) => {
            button.addEventListener("click", async (e) => {
                e.stopPropagation();
                const clienteId = button.getAttribute("data-id");
                if (!clienteId) return;

                const confirma = window.confirm("Deseja realmente excluir este cliente?");
                if (!confirma) return;

                try {
                    const retorno = await API.post("cliente_excluir.php", { cliente_id: clienteId });
                    if (retorno.status !== "ok") {
                        alert(retorno.mensagem || "Não foi possível excluir o cliente.");
                        return;
                    }
                    await carregarClientes();
                } catch (error) {
                    alert("Erro ao conectar com o servidor.");
                }
            });
        });
    }

    async function carregarClientes() {
        const cardContainer = document.getElementById('clientsCardContainer');
        tableBody.innerHTML = "";
        if (cardContainer) cardContainer.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';

        try {
            const retorno = await API.get("cliente_listar.php");
            const vazio = '<tr><td colspan="5" class="py-3"><div class="empty-state-alert"><i class="fas fa-info-circle"></i>Nenhum cliente cadastrado ainda.</div></td></tr>';
            const vazioCard = '<div class="empty-state-alert m-2"><i class="fas fa-info-circle"></i>Nenhum cliente cadastrado ainda.</div>';

            if (retorno.status !== "ok") {
                tableBody.innerHTML = vazio;
                if (cardContainer) cardContainer.innerHTML = vazioCard;
                return;
            }

            const clientes = retorno.data || [];
            if (!clientes.length) {
                tableBody.innerHTML = vazio;
                if (cardContainer) cardContainer.innerHTML = vazioCard;
                return;
            }

            if (cardContainer) cardContainer.innerHTML = '';
            clientes.forEach((cliente) => {
                tableBody.appendChild(montarLinhaCliente(cliente));
                if (cardContainer) cardContainer.appendChild(montarCardCliente(cliente));
            });

            bindEvents();

        } catch (error) {
            tableBody.innerHTML = '<tr><td colspan="5" class="py-3"><div class="empty-state-alert"><i class="fas fa-info-circle"></i>Erro ao carregar clientes.</div></td></tr>';
            if (cardContainer) cardContainer.innerHTML = '<div class="empty-state-alert m-2"><i class="fas fa-info-circle"></i>Erro ao carregar clientes.</div>';
        }
    }

    carregarClientes();
});
