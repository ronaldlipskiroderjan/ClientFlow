class PlanosManager {
    static async init() {
        try {
            // Validar sessão
            const user = await Auth.validateSession();
            if (!user) {
                window.location.href = 'login.html';
                return;
            }

            // Carregar planos
            await this.carregarPlanos();

            // Bind events
            this.bindEvents();

        } catch (error) {
            console.error('Erro ao inicializar gerenciador de planos:', error);
            alert('Erro ao carregar página de planos. Tente novamente.');
        }
    }

    static async carregarPlanos() {
        try {
            const retorno = await API.get('plano_listar.php');

            if (retorno.status !== 'ok') {
                throw new Error(retorno.mensagem || 'Erro ao carregar planos');
            }

            const { plano_atual, planos_disponiveis, uso_recursos } = retorno.data || {};

            // Renderizar plano atual
            if (plano_atual) {
                this.renderizarPlanoAtual(plano_atual);
            }

            // Renderizar uso de recursos
            if (uso_recursos) {
                this.renderizarUsoRecursos(uso_recursos, plano_atual);
            }

            // Renderizar planos disponíveis
            if (planos_disponiveis && Array.isArray(planos_disponiveis)) {
                this.renderizarPlanosDisponiveis(planos_disponiveis, plano_atual);
            }

        } catch (error) {
            console.error('Erro ao carregar planos:', error);
            alert('Erro ao carregar informações de planos.');
        }
    }

    static renderizarPlanoAtual(plano) {
        const container = document.getElementById('planoAtualContainer');
        if (!container) return;

        const data_renovacao = plano.data_renovacao ? new Date(plano.data_renovacao).toLocaleDateString('pt-BR') : 'Não definido';
        const preco_display = plano.preco_mensal > 0 ? `R$ ${parseFloat(plano.preco_mensal).toFixed(2)}` : 'Gratuito';

        container.innerHTML = `
            <div class="mb-3">
                <h4 class="text-primary fw-bold mb-2">${plano.nome.charAt(0).toUpperCase() + plano.nome.slice(1)}</h4>
                <p class="text-muted mb-2">${plano.descricao || 'Sem descrição'}</p>
            </div>
            <div class="row g-3">
                <div class="col-6">
                    <small class="text-muted">Preço Mensal</small>
                    <div class="fw-bold text-navy-blue">${preco_display}</div>
                </div>
                <div class="col-6">
                    <small class="text-muted">Próxima Renovação</small>
                    <div class="fw-bold text-navy-blue">${data_renovacao}</div>
                </div>
                <div class="col-12">
                    <div class="alert alert-info mb-0" role="alert">
                        <small>
                            <i class="fas fa-info-circle me-2"></i>
                            Renovação: ${plano.tipo_renovacao === 'mensal' ? 'Mensal' : 'Anual'}
                        </small>
                    </div>
                </div>
            </div>
        `;
    }

    static renderizarUsoRecursos(uso, plano_atual) {
        const container = document.getElementById('usoRecursosContainer');
        if (!container || !plano_atual) return;

        const limite_colaboradores = plano_atual.limite_colaboradores;
        const limite_projetos = plano_atual.limite_projetos;
        const percentual_colabs = Math.round((uso.total_colaboradores / limite_colaboradores) * 100);
        const percentual_projetos = Math.round((uso.total_projetos / limite_projetos) * 100);

        const color_colabs = percentual_colabs > 80 ? 'danger' : percentual_colabs > 50 ? 'warning' : 'success';
        const color_projetos = percentual_projetos > 80 ? 'danger' : percentual_projetos > 50 ? 'warning' : 'success';

        container.innerHTML = `
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-2">
                    <small class="text-muted">Colaboradores</small>
                    <small class="fw-bold text-navy-blue">${uso.total_colaboradores}/${limite_colaboradores}</small>
                </div>
                <div class="progress" style="height: 8px;">
                    <div class="progress-bar bg-${color_colabs}" style="width: ${Math.min(percentual_colabs, 100)}%"></div>
                </div>
            </div>
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-2">
                    <small class="text-muted">Projetos</small>
                    <small class="fw-bold text-navy-blue">${uso.total_projetos}/${limite_projetos}</small>
                </div>
                <div class="progress" style="height: 8px;">
                    <div class="progress-bar bg-${color_projetos}" style="width: ${Math.min(percentual_projetos, 100)}%"></div>
                </div>
            </div>
            <div class="mb-0">
                <small class="text-muted">Armazenamento Utilizado</small>
                <div class="fw-bold text-navy-blue">${(uso.armazenamento_usado_mb / 1024).toFixed(2)} GB</div>
            </div>
        `;
    }

    static renderizarPlanosDisponiveis(planos, plano_atual) {
        const container = document.getElementById('planosContainer');
        if (!container) return;

        container.innerHTML = '';

        planos.forEach((plano) => {
            const eh_plano_atual = plano_atual && plano.nome === plano_atual.nome;
            const classe_destaque = eh_plano_atual ? 'border border-primary shadow-lg' : 'border-0 shadow-sm';

            const preco_display = plano.preco_mensal > 0 ? `R$ ${parseFloat(plano.preco_mensal).toFixed(2)}` : 'Gratuito';

            const badge_atual = eh_plano_atual ? `
                <span class="position-absolute top-0 end-0 badge bg-success rounded-pill m-3">
                    <i class="fas fa-check-circle me-1"></i>Plano Atual
                </span>
            ` : '';

            const btn_acao = eh_plano_atual ? `
                <button type="button" class="btn btn-outline-custom w-100" disabled>
                    Plano Atual
                </button>
            ` : `
                <button type="button" class="btn btn-primary-custom w-100 btn-upgrade" data-plano="${plano.nome}">
                    <i class="fas fa-right-left me-2"></i>Alterar Plano
                </button>
            `;

            const card = document.createElement('div');
            card.className = 'col-lg-3 col-md-6';
            card.innerHTML = `
                <div class="card ${classe_destaque} h-100 position-relative rounded-3 overflow-hidden" style="transition: transform 0.2s;">
                    ${badge_atual}
                    <div class="card-body p-4">
                        <h5 class="card-title fw-bold text-primary mb-2">
                            ${plano.nome.charAt(0).toUpperCase() + plano.nome.slice(1)}
                        </h5>
                        <p class="text-muted small mb-3">${plano.descricao || 'Sem descrição'}</p>
                        
                        <div class="mb-3">
                            <h6 class="text-navy-blue fw-bold">${preco_display}<span class="text-muted small">/mês</span></h6>
                        </div>

                        <ul class="list-unstyled small mb-4">
                            <li class="mb-2">
                                <i class="fas fa-check text-success me-2"></i>
                                <strong>${plano.limite_colaboradores >= 999999 ? '∞' : plano.limite_colaboradores}</strong> colaboradores
                            </li>
                            <li class="mb-2">
                                <i class="fas fa-check text-success me-2"></i>
                                <strong>${plano.limite_projetos >= 999999 ? '∞' : plano.limite_projetos}</strong> projetos
                            </li>
                            <li class="mb-2">
                                <i class="fas fa-check text-success me-2"></i>
                                <strong>${plano.limite_armazenamento_gb >= 1000 ? '1TB+' : plano.limite_armazenamento_gb + 'GB'}</strong> armazenamento
                            </li>
                        </ul>

                        ${btn_acao}
                    </div>
                </div>
            `;

            container.appendChild(card);
        });
    }

    static bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-upgrade')) {
                const plano = e.target.dataset.plano;
                this.abrirConfirmacaoUpgrade(plano);
            }
        });

        const btnConfirm = document.getElementById('btnConfirmUpgrade');
        if (btnConfirm) {
            btnConfirm.addEventListener('click', () => {
                this.executarUpgrade();
            });
        }
    }

    static abrirConfirmacaoUpgrade(plano) {
        const texto = `Tem certeza que deseja alterar para o plano <strong>${plano.charAt(0).toUpperCase() + plano.slice(1)}</strong>? A mudanca sera aplicada imediatamente.`;
        document.getElementById('confirmUpgradeText').innerHTML = texto;
        this.planoSelecionado = plano;

        const modal = new bootstrap.Modal(document.getElementById('confirmUpgradeModal'));
        modal.show();
    }

    static async executarUpgrade() {
        if (!this.planoSelecionado) {
            alert('Nenhum plano selecionado.');
            return;
        }

        try {
            const btnConfirm = document.getElementById('btnConfirmUpgrade');
            const textoBkp = btnConfirm.innerHTML;
            btnConfirm.disabled = true;
            btnConfirm.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processando...';

            const retorno = await API.post('plano_fazer_upgrade.php', {
                novo_plano: this.planoSelecionado
            });

            btnConfirm.disabled = false;
            btnConfirm.innerHTML = textoBkp;

            if (retorno.status !== 'ok') {
                alert(retorno.mensagem || 'Erro ao alterar plano');
                return;
            }

            // Mostrar avisos se houver
            if (retorno.data.avisos && retorno.data.avisos.length > 0) {
                alert(retorno.data.avisos.join('\n'));
            }

            // Fechar modal e recarregar
            const modal = bootstrap.Modal.getInstance(document.getElementById('confirmUpgradeModal'));
            modal.hide();

            alert('Plano alterado com sucesso! Sua sessao permanece ativa.');
            this.planoSelecionado = null;

            // Recarregar dados de planos
            await this.carregarPlanos();

        } catch (error) {
            console.error('Erro ao fazer upgrade:', error);
            alert('Erro ao processar upgrade. Tente novamente.');
        }
    }
}

window.PlanosManager = PlanosManager;
