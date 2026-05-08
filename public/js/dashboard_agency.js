document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Verifica sessão ANTES de montar o sidebar para evitar flash indevido
        const sessao = await Auth.validateSession();

        if (!sessao) {
            window.location.href = "login.html";
            return;
        }

        // Admin tem sua própria dashboard — redireciona sem inicializar a página de agência
        if (sessao.tipo === "admin") {
            window.location.href = "dashboard_admin.html";
            return;
        }

        // Clientes não têm acesso à dashboard de agência
        if (sessao.tipo === "client") {
            window.location.href = "login.html";
            return;
        }

        await SidebarManager.init();

        const btnNovoUsuario = document.getElementById('btnNovoUsuarioDash');
        const podeGerenciarEquipe = sessao.tipo !== 'freelancer' && Auth.hasAccess('perm_gerenciar_membros');
        if (btnNovoUsuario) {
            btnNovoUsuario.classList.toggle('d-none', !podeGerenciarEquipe);
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

        function aplicarResumoOnboarding(resumoOnboarding = {}) {
            const finished = Number(resumoOnboarding.finished || 0);
            const pending = Number(resumoOnboarding.pending || 0);
            const review = Number(resumoOnboarding.review || 0);

            document.getElementById("count-finished").textContent = finished;
            document.getElementById("count-pending").textContent = pending;
            document.getElementById("count-review").textContent = review;

            return {
                finished,
                pending,
                review,
                total: finished + pending + review
            };
        }

        const resumoOnboarding = aplicarResumoOnboarding(dados);
        const finished = resumoOnboarding.finished;
        const pending = resumoOnboarding.pending;
        const review = resumoOnboarding.review;

        const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
        
        const kpiClients = document.getElementById("kpi-clients");
        const kpiTeam = document.getElementById("kpi-team");
        const kpiRevenue = document.getElementById("kpi-revenue");
        const kpiOverdue = document.getElementById("kpi-overdue");
        const financeSection = document.getElementById("financeSection");

        const clientes = clientesRes.status === "ok" ? (clientesRes.data || []) : [];
        const membros = membrosRes.status === "ok" ? (membrosRes.data || []) : [];

        if (kpiClients) kpiClients.textContent = clientesRes.status === "ok" ? clientes.length : "--";
        if (kpiTeam) kpiTeam.textContent = membrosRes.status === "ok" ? membros.length : "--";

        if (contratosRes.status === "ok") {
            const contratos = contratosRes.data || [];
            const faturamento = contratos.reduce((totalValor, contrato) => totalValor + Number(contrato.valor_total || 0), 0);
            if (kpiRevenue) kpiRevenue.textContent = brl.format(faturamento);
            if (kpiOverdue) kpiOverdue.textContent = contratosRes.kpis?.inadimplentes ?? 0;
        } else {
            if (kpiRevenue) kpiRevenue.textContent = "Sem acesso";
            if (kpiOverdue) kpiOverdue.textContent = "--";
            if (financeSection) financeSection.classList.add("d-none");
        }

        // --- CHART THEME LOGIC ---
        const getChartThemeColors = () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            return {
                text: isDark ? '#94a3b8' : '#64748b',
                grid: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                empty: isDark ? '#1e2640' : '#E2E8F0'
            };
        };

        let progressChart, clientsChart, financeChart;

        const renderCharts = () => {
            const theme = getChartThemeColors();
            const total = resumoOnboarding.total;

            // 1. Progress Chart
            const ctxProgress = document.getElementById("progressChart").getContext("2d");
            if (progressChart) progressChart.destroy();
            progressChart = new Chart(ctxProgress, {
                type: "doughnut",
                data: {
                    labels: total > 0 ? ["Finalizados", "Aguardando Cliente", "Revisão do Prestador"] : ["Sem Dados"],
                    datasets: [{
                        data: total > 0 ? [finished, pending, review] : [1],
                        backgroundColor: total > 0 ? ["#10B981", "#F59E0B", "#6366f1"] : [theme.empty],
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
                            labels: { usePointStyle: true, padding: 20, color: theme.text }
                        }
                    },
                    cutout: "70%"
                }
            });

            // 2. Clients Chart
            const clientsChartEl = document.getElementById("clientsChart");
            if (clientsChartEl) {
                const { labels, values } = buildMonthlySeries(clientes, "criado_em", 6);
                const hasData = values.some((v) => v > 0);
                if (clientsChart) clientsChart.destroy();
                clientsChart = new Chart(clientsChartEl.getContext("2d"), {
                    type: "bar",
                    data: {
                        labels: hasData ? labels : ["Sem dados"],
                        datasets: [{
                            label: "Novos clientes",
                            data: hasData ? values : [1],
                            backgroundColor: hasData ? "#6366f1" : theme.empty,
                            borderRadius: 6,
                            maxBarThickness: 40
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { 
                                beginAtZero: true, 
                                ticks: { stepSize: 1, color: theme.text },
                                grid: { color: theme.grid }
                            },
                            x: { 
                                grid: { display: false },
                                ticks: { color: theme.text }
                            }
                        }
                    }
                });
            }

            // 3. Finance Chart
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
                if (financeChart) financeChart.destroy();
                financeChart = new Chart(financeChartEl.getContext("2d"), {
                    type: "doughnut",
                    data: {
                        labels: hasData ? Object.values(statusMap).map((s) => s.label) : ["Sem dados"],
                        datasets: [{
                            data: hasData ? valoresPorStatus : [1],
                            backgroundColor: hasData ? Object.values(statusMap).map((s) => s.color) : [theme.empty],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { 
                                position: "bottom", 
                                labels: { usePointStyle: true, padding: 16, color: theme.text } 
                            },
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
        };

        // Render initial charts
        renderCharts();

        // Listen for theme changes to update charts
        window.addEventListener('clientflow:themechange', () => {
            renderCharts();
        });

        let pollingStatusId = null;
        let pollingEmAndamento = false;

        const atualizarStatusTempoReal = async () => {
            if (document.hidden || pollingEmAndamento) {
                return;
            }

            pollingEmAndamento = true;
            try {
                const resumoTempoReal = await API.get("dashboard_agencia_resumo.php");
                if (resumoTempoReal && resumoTempoReal.status === "ok") {
                    aplicarResumoOnboarding(resumoTempoReal.data || {});
                }
            } catch (error) {
                console.error("Erro ao atualizar status em tempo real:", error);
            } finally {
                pollingEmAndamento = false;
            }
        };

        pollingStatusId = window.setInterval(atualizarStatusTempoReal, 5000);

        document.addEventListener("visibilitychange", () => {
            if (!document.hidden) {
                atualizarStatusTempoReal();
            }
        });

        window.addEventListener("beforeunload", () => {
            if (pollingStatusId) {
                window.clearInterval(pollingStatusId);
                pollingStatusId = null;
            }
        }, { once: true });

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
