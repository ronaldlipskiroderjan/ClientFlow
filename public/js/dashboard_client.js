document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("tasks-container");
    const emptyState = document.getElementById("empty-tasks");

    function buildConstraintHint(tarefa) {
        const parts = [];

        if (tarefa.min_chars || tarefa.max_chars) {
            parts.push(`Caracteres: ${tarefa.min_chars || 0} a ${tarefa.max_chars || "sem limite"}`);
        }

        if (tarefa.allowed_extensions) {
            parts.push(`Extensões: ${tarefa.allowed_extensions}`);
        }

        if (tarefa.max_file_size_kb) {
            parts.push(`Tamanho máx: ${tarefa.max_file_size_kb} KB`);
        }

        if (tarefa.type === "image") {
            const largura = `${tarefa.min_width || 0}-${tarefa.max_width || "inf"}`;
            const altura = `${tarefa.min_height || 0}-${tarefa.max_height || "inf"}`;
            parts.push(`Resolução (px): ${largura} x ${altura}`);
        }

        return parts.length ? `<div class="text-muted small mb-2">${parts.join(" | ")}</div>` : "";
    }

    function buildAccept(tarefa) {
        if (!tarefa.allowed_extensions) {
            return "";
        }

        return tarefa.allowed_extensions
            .split(",")
            .map((ext) => ext.trim().toLowerCase())
            .filter(Boolean)
            .map((ext) => `.${ext}`)
            .join(",");
    }

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
        } else if (tarefa.status === "rejected") {
            badgeClass = "bg-danger";
            statusText = "Reprovado - Reenviar";
            borderClass = "border-danger";
            icon = "fa-triangle-exclamation";
        }

        const accept = buildAccept(tarefa);
        const constraintHint = buildConstraintHint(tarefa);

        card.className = `card card-custom p-4 mb-3 border-0 shadow-sm border-start border-4 ${borderClass}`;
        card.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="badge ${badgeClass} rounded-pill">
                    <i class="fa-solid ${icon} me-1"></i> ${statusText}
                </span>
                <small class="text-muted fw-bold">${tarefa.checklist_name || "Projeto"}</small>
            </div>
            <h5 class="fw-bold mb-1">${tarefa.title}</h5>
            ${tarefa.description ? `<p class="text-muted mb-2">${tarefa.description}</p>` : ""}
            ${tarefa.feedback ? `
                <div class="alert alert-danger mt-2 mb-2 p-2 px-3 text-sm">
                    <strong><i class="fa-solid fa-comment-dots"></i> Feedback da Agência:</strong> ${tarefa.feedback}
                </div>
            ` : ""}
            ${constraintHint}
            <div class="mt-3">
                ${tarefa.status === "approved" || tarefa.status === "review" ? `
                    <p class="text-muted small"><i class="fa-solid fa-lock"></i> Item enviado e travado para edição.</p>
                    <div class="bg-light p-2 rounded text-muted">${tarefa.type === "image" || tarefa.type === "file" ? (tarefa.value || "Arquivo enviado") : (tarefa.value || "-")}</div>
                ` : `
                    <form class="task-form d-flex flex-column gap-2" data-id="${tarefa.id}" data-type="${tarefa.type}">
                        <div class="input-group">
                            ${tarefa.type === "image" || tarefa.type === "file" ? `
                                <input type="file" class="form-control" ${accept ? `accept="${accept}"` : ""} required>
                            ` : tarefa.type === "long_text" ? `
                                <textarea class="form-control" ${tarefa.min_chars ? `minlength="${tarefa.min_chars}"` : ""} ${tarefa.max_chars ? `maxlength="${tarefa.max_chars}"` : ""} required placeholder="Digite sua resposta..."></textarea>
                            ` : `
                                <input type="${tarefa.type === "color" ? "color" : tarefa.type === "url" ? "url" : "text"}" class="form-control" ${tarefa.min_chars ? `minlength="${tarefa.min_chars}"` : ""} ${tarefa.max_chars ? `maxlength="${tarefa.max_chars}"` : ""} required placeholder="Digite aqui...">
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

                try {
                    let retorno;

                    if (tipo === "image" || tipo === "file") {
                        const arquivo = form.querySelector("input[type='file']");
                        if (!arquivo || !arquivo.files || !arquivo.files[0]) {
                            alert("Selecione um arquivo antes de enviar.");
                            return;
                        }

                        const formData = new FormData();
                        formData.append("item_id", itemId);
                        formData.append("arquivo", arquivo.files[0]);
                        retorno = await ApiClientFlow.postForm("cliente_tarefa_enviar.php", formData);
                    } else {
                        const input = form.querySelector("input, textarea");
                        const valor = input ? input.value.trim() : "";

                        if (!valor) {
                            alert("Preencha o valor antes de enviar.");
                            return;
                        }

                        retorno = await ApiClientFlow.post("cliente_tarefa_enviar.php", {
                            item_id: itemId,
                            valor
                        });
                    }

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
