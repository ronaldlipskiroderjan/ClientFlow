document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("tasks-container");
    const emptyState = document.getElementById("empty-tasks");

    function criarCardTarefa(tarefa) {
        const card = document.createElement("div");

        let badgeClass = "bg-warning text-dark";
        let statusText = "Pendente";
        let borderClass = "border-warning";
        let icon = "fa-clock-rotate-left";

        if (tarefa.status === "approved") {
            badgeClass = "bg-success";
            statusText = "Concluído (Aprovado)";
            borderClass = "border-success";
            icon = "fa-check";
        } else if (tarefa.status === "review") {
            badgeClass = "bg-primary";
            statusText = "Em Revisão";
            borderClass = "border-primary";
            icon = "fa-eye";
        } else if (tarefa.feedback) {
            badgeClass = "bg-danger";
            statusText = "Reprovado - Necessita Correção";
            borderClass = "border-danger";
            icon = "fa-triangle-exclamation";
        }

        card.className = `card card-custom p-4 mb-3 border-0 shadow-sm border-start border-4 ${borderClass}`;
        card.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="badge ${badgeClass} rounded-pill">
                    <i class="fa-solid ${icon} me-1"></i> ${statusText}
                </span>
                <small class="text-muted fw-bold">${tarefa.checklist_name || "Projeto"}</small>
            </div>
            <h5 class="fw-bold mb-1">${tarefa.title}</h5>
            ${tarefa.feedback ? `
                <div class="alert alert-danger mt-3 mb-2 p-2 px-3 text-sm">
                    <strong><i class="fa-solid fa-comment-dots"></i> Feedback da Agência:</strong> ${tarefa.feedback}
                </div>
            ` : ""}
            <div class="mt-3">
                ${tarefa.status === "approved" || tarefa.status === "review" ? `
                    <p class="text-muted small"><i class="fa-solid fa-lock"></i> Item enviado e travado para edição.</p>
                    <div class="bg-light p-2 rounded text-muted">${tarefa.type === "image" || tarefa.type === "file" ? "Arquivo enviado" : (tarefa.value || "-")}</div>
                ` : `
                    <form class="task-form d-flex flex-column gap-2" data-id="${tarefa.id}" data-type="${tarefa.type}">
                        <div class="input-group">
                            ${tarefa.type === "image" || tarefa.type === "file" ? `
                                <input type="file" class="form-control" required>
                            ` : tarefa.type === "long_text" ? `
                                <textarea class="form-control" required placeholder="Digite sua resposta..."></textarea>
                            ` : `
                                <input type="${tarefa.type === "color" ? "color" : tarefa.type === "url" ? "url" : "text"}" class="form-control" required placeholder="Digite aqui...">
                            `}
                            ${tarefa.type !== "long_text" ? '<button class="btn btn-primary-custom" type="submit">Enviar</button>' : ""}
                        </div>
                        ${tarefa.type === "long_text" ? '<div class="text-end"><button class="btn btn-primary-custom px-4" type="submit">Enviar</button></div>' : ""}
                    </form>
                `}
            </div>
        `;

        return card;
    }

    async function bindFormTarefas() {
        document.querySelectorAll(".task-form").forEach((form) => {
            form.addEventListener("submit", async (event) => {
                event.preventDefault();

                const itemId = form.getAttribute("data-id");
                const tipo = form.getAttribute("data-type");
                let valor = "";
                let tipoEnvio = "texto";

                if (tipo === "image" || tipo === "file") {
                    tipoEnvio = "arquivo";
                    const arquivo = form.querySelector("input[type='file']");
                    valor = arquivo && arquivo.files && arquivo.files[0] ? arquivo.files[0].name : "arquivo_enviado";
                } else {
                    const input = form.querySelector("input, textarea");
                    valor = input ? input.value : "";
                }

                if (!valor) {
                    alert("Preencha o valor antes de enviar.");
                    return;
                }

                try {
                    const retorno = await ApiClientFlow.post("cliente_tarefa_enviar.php", {
                        item_id: itemId,
                        valor,
                        tipo_envio: tipoEnvio
                    });

                    if (retorno.status !== "ok") {
                        alert(retorno.mensagem || "Erro ao enviar item.");
                        return;
                    }

                    alert("Item enviado com sucesso!");
                    await carregarTarefas();
                } catch (error) {
                    alert("Erro ao conectar com o servidor.");
                }
            });
        });
    }

    async function carregarTarefas() {
        container.querySelectorAll(".card-custom").forEach((el) => el.remove());

        const retorno = await ApiClientFlow.get("cliente_tarefas_listar.php");
        if (retorno.status !== "ok") {
            emptyState.style.display = "block";
            return;
        }

        const tarefas = retorno.data || [];
        if (!tarefas.length) {
            emptyState.style.display = "block";
            return;
        }

        emptyState.style.display = "none";
        tarefas.forEach((tarefa) => {
            container.appendChild(criarCardTarefa(tarefa));
        });

        await bindFormTarefas();
    }

    try {
        const sessao = await ApiClientFlow.get("valida_sessao_logado.php");
        if (sessao.status !== "ok") {
            window.location.href = "login.html";
            return;
        }

        if (!sessao.data || sessao.data.tipo !== "client") {
            window.location.href = "dashboard_agency.html";
            return;
        }

        if (window.ClientFlowIdentity) {
            window.ClientFlowIdentity.apply(sessao.data, {
                avatarBackground: "E63946"
            });
        }

        await carregarTarefas();

        const logoutLink = document.querySelector(".js-logout-link");
        if (logoutLink) {
            logoutLink.addEventListener("click", async (event) => {
                event.preventDefault();
                await ApiClientFlow.post("usuario_logoff.php");
                window.location.href = "../../index.html";
            });
        }
    } catch (error) {
        window.location.href = "login.html";
    }
});
