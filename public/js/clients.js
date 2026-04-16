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

    function montarLinhaCliente(cliente) {
        const row = document.createElement("tr");
        const dataCadastro = cliente.criado_em ? new Date(cliente.criado_em).toLocaleDateString() : "-";
        
        let actionBtns = `<a href="#" class="btn btn-sm btn-outline-custom p-1 px-2" title="Projetos do Cliente"><i class="fa-solid fa-folder-open"></i></a>`;
        
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

        return row;
    }

    function bindDeleteEvents() {
        document.querySelectorAll(".js-delete-client").forEach((button) => {
            button.addEventListener("click", async () => {
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
        tableBody.innerHTML = "";

        try {
            const retorno = await API.get("cliente_listar.php");
            if (retorno.status !== "ok") {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Nenhum cliente cadastrado ainda.</td></tr>';
                return;
            }

            const clientes = retorno.data || [];
            if (!clientes.length) {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Nenhum cliente cadastrado ainda.</td></tr>';
                return;
            }

            clientes.forEach((cliente) => {
                tableBody.appendChild(montarLinhaCliente(cliente));
            });

            bindDeleteEvents();

        } catch (error) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Erro ao carregar clientes.</td></tr>';
        }
    }

    carregarClientes();
});
