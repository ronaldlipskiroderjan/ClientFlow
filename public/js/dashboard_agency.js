document.addEventListener("DOMContentLoaded", async () => {
    try {
        const sessao = await ApiClientFlow.get("valida_sessao_logado.php");
        if (sessao.status !== "ok") {
            window.location.href = "login.html";
            return;
        }

        if (sessao.data && sessao.data.tipo === "client") {
            window.location.href = "dashboard_client.html";
            return;
        }

        const nomeUsuario = sessao.data && sessao.data.nome ? sessao.data.nome : "Usuário";

        document.querySelectorAll(".text-navy-blue.fw-bold").forEach((el) => {
            if (el.textContent.includes("Olá,")) {
                el.innerHTML = `Olá, <span class="fw-bold text-navy-blue">${nomeUsuario}</span>`;
            }
        });

        const nomeSidebar = document.querySelector(".dropdown strong");
        if (nomeSidebar) {
            nomeSidebar.textContent = nomeUsuario;
        }

        const avatar = document.querySelector(".dropdown img");
        if (avatar) {
            avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeUsuario)}&background=0D8ABC&color=fff`;
        }

        const resumo = await ApiClientFlow.get("dashboard_agencia_resumo.php");
        const dados = resumo.status === "ok" ? (resumo.data || {}) : {};

        const finished = Number(dados.finished || 0);
        const pending = Number(dados.pending || 0);
        const review = Number(dados.review || 0);

        document.getElementById("count-finished").textContent = finished;
        document.getElementById("count-pending").textContent = pending;
        document.getElementById("count-review").textContent = review;

        const ctx = document.getElementById("progressChart").getContext("2d");
        const total = finished + pending + review;

        new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: total > 0 ? ["Finalizados", "Aguardando Cliente", "Revisão da Agência"] : ["Sem Dados"],
                datasets: [{
                    data: total > 0 ? [finished, pending, review] : [1],
                    backgroundColor: total > 0 ? ["#10B981", "#F59E0B", "#2563EB"] : ["#E2E8F0"],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    }
                },
                cutout: "70%"
            }
        });

        document.querySelector(".dropdown-item.text-danger").addEventListener("click", async (event) => {
            event.preventDefault();

            await ApiClientFlow.post("usuario_logoff.php");
            window.location.href = "../../index.html";
        });
    } catch (error) {
        window.location.href = "login.html";
    }
});
