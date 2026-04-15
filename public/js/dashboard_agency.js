document.addEventListener("DOMContentLoaded", async () => {
    try {
        await SidebarManager.init();
        
        const sessao = await Auth.validateSession();
        if (!sessao || sessao.tipo === "client") {
            window.location.href = "login.html";
            return;
        }

        // Show "Novo Membro" button if user has permission to manage members
        if (Auth.hasAccess('perm_gerenciar_membros')) {
            const btnNovoUsuario = document.getElementById('btnNovoUsuarioDash');
            if (btnNovoUsuario) {
                btnNovoUsuario.classList.remove('d-none');
            }
        }

        if (window.ClientFlowIdentity) {
            window.ClientFlowIdentity.apply(sessao, {
                avatarBackground: "0D8ABC"
            });
        }

        const [resResumo, resClientes, resMembros, resContratos] = await Promise.allSettled([
            API.get("dashboard_agencia_resumo.php"),
            API.get("cliente_listar.php"),
            API.get("membro_listar.php"),
            API.get("contrato_listar.php")
        ]);

        const resumo = resResumo.status === "fulfilled" ? resResumo.value : { status: "nok" };
        const clientesRes = resClientes.status === "fulfilled" ? resClientes.value : { status: "nok" };
        const membrosRes = resMembros.status === "fulfilled" ? resMembros.value : { status: "nok" };
        const contratosRes = resContratos.status === "fulfilled" ? resContratos.value : { status: "nok" };

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

        const kpiClients = document.getElementById("kpi-clients");
        const kpiTeam = document.getElementById("kpi-team");
        const kpiRevenue = document.getElementById("kpi-revenue");
        const kpiOverdue = document.getElementById("kpi-overdue");
        const financeSection = document.getElementById("financeSection");

        const clientes = clientesRes.status === "ok" ? (clientesRes.data || []) : [];
        const membros = membrosRes.status === "ok" ? (membrosRes.data || []) : [];

        kpiClients.textContent = clientesRes.status === "ok" ? clientes.length : "--";
        kpiTeam.textContent = membrosRes.status === "ok" ? membros.length : "--";

        const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
        if (contratosRes.status === "ok") {
            const contratos = contratosRes.data || [];
            const faturamento = contratos.reduce((totalValor, contrato) => totalValor + Number(contrato.valor_total || 0), 0);
            kpiRevenue.textContent = brl.format(faturamento);
            kpiOverdue.textContent = contratosRes.kpis?.inadimplentes ?? 0;
        } else {
            kpiRevenue.textContent = "Sem acesso";
            kpiOverdue.textContent = "--";
            if (financeSection) financeSection.classList.add("d-none");
        }

        const clientsChartEl = document.getElementById("clientsChart");
        if (clientsChartEl) {
            const { labels, values } = buildMonthlySeries(clientes, "criado_em", 6);
            const hasData = values.some((v) => v > 0);
            new Chart(clientsChartEl.getContext("2d"), {
                type: "bar",
                data: {
                    labels: hasData ? labels : ["Sem dados"],
                    datasets: [{
                        label: "Novos clientes",
                        data: hasData ? values : [1],
                        backgroundColor: hasData ? "#2563EB" : "#E2E8F0",
                        borderRadius: 6,
                        maxBarThickness: 40
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1 } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }

        const financeChartEl = document.getElementById("financeChart");
        if (financeChartEl && contratosRes.status === "ok") {
            const contratos = contratosRes.data || [];
            const statusMap = {
                pago: { label: "Pago", color: "#10B981" },
                pendente: { label: "Pendente", color: "#F59E0B" },
                atrasado: { label: "Atrasado", color: "#EF4444" },
                cancelado: { label: "Cancelado", color: "#94A3B8" }
            };
            const valoresPorStatus = Object.keys(statusMap).map((key) =>
                contratos.reduce((acc, c) => acc + (c.status_pagamento === key ? Number(c.valor_total || 0) : 0), 0)
            );
            const hasData = valoresPorStatus.some((v) => v > 0);
            new Chart(financeChartEl.getContext("2d"), {
                type: "doughnut",
                data: {
                    labels: hasData ? Object.values(statusMap).map((s) => s.label) : ["Sem dados"],
                    datasets: [{
                        data: hasData ? valoresPorStatus : [1],
                        backgroundColor: hasData ? Object.values(statusMap).map((s) => s.color) : ["#E2E8F0"],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: "bottom", labels: { usePointStyle: true, padding: 16 } },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => hasData ? `${ctx.label}: ${brl.format(ctx.parsed)}` : ctx.label
                            }
                        }
                    },
                    cutout: "68%"
                }
            });
        }

    } catch (error) {
        window.location.href = "login.html";
    }
});

function buildMonthlySeries(items, field, monthsBack = 6) {
    const now = new Date();
    const labels = [];
    const keys = [];
    for (let i = monthsBack - 1; i >= 0; i -= 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        keys.push(key);
        labels.push(d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }));
    }

    const counts = Object.fromEntries(keys.map((k) => [k, 0]));
    items.forEach((item) => {
        const raw = item[field];
        if (!raw) return;
        const date = new Date(String(raw).replace(" ", "T"));
        if (Number.isNaN(date.getTime())) return;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (counts[key] !== undefined) {
            counts[key] += 1;
        }
    });

    return {
        labels,
        values: keys.map((k) => counts[k])
    };
}
