// Carregar atestados do localStorage
let atestados = [];

function loadAtestados() {
    const stored = localStorage.getItem('atestados');
    if (stored) {
        atestados = JSON.parse(stored);
    } else {
        // Dados de exemplo
        atestados = [
            {
                id: 1,
                nome: "Ana Carolina Silva",
                tipo: "aluno",
                turma: "2º MATUTINO",
                dataInicio: "2024-03-10",
                dataFim: "2024-03-15",
                motivo: "Gripe",
                observacoes: "Necessita de atividades domiciliares",
                anexo: null,
                anexoNome: null,
                dataCadastro: "2024-03-10"
            },
            {
                id: 2,
                nome: "Marcos Antonio Ferreira",
                tipo: "funcionario",
                funcao: "Professor de Matemática",
                dataInicio: "2024-03-05",
                dataFim: "2024-03-12",
                motivo: "Cirurgia",
                observacoes: "Atestado entregue na secretaria",
                anexo: null,
                anexoNome: null,
                dataCadastro: "2024-03-05"
            }
        ];
        saveAtestados();
    }
    renderAtestados();
}

function saveAtestados() {
    localStorage.setItem('atestados', JSON.stringify(atestados));
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function getStatusIcon(dataInicio, dataFim) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    
    if (hoje < inicio) {
        return '<span class="status-badge status-future"><i class="fas fa-clock"></i> Agendado</span>';
    } else if (hoje >= inicio && hoje <= fim) {
        return '<span class="status-badge status-active"><i class="fas fa-check-circle"></i> Em andamento</span>';
    } else {
        return '<span class="status-badge status-finished"><i class="fas fa-check-double"></i> Concluído</span>';
    }
}

function renderAtestados() {
    const container = document.getElementById('cardsAtestados');
    const filtroTipo = document.getElementById('filtroTipo')?.value || 'todos';
    const buscaTermo = document.getElementById('buscaAtestado')?.value.toLowerCase() || '';
    
    let filtered = atestados;
    
    if (filtroTipo !== 'todos') {
        filtered = filtered.filter(a => a.tipo === filtroTipo);
    }
    
    if (buscaTermo) {
        filtered = filtered.filter(a => a.nome.toLowerCase().includes(buscaTermo));
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-notes-medical"></i>
                <p>Nenhum atestado encontrado.</p>
                <button class="btn-primary btn-empty" id="btnEmptyNovoAtestado">
                    <i class="fas fa-plus"></i> Cadastrar atestado
                </button>
            </div>
        `;
        const emptyBtn = document.getElementById('btnEmptyNovoAtestado');
        if (emptyBtn) {
            emptyBtn.addEventListener('click', () => openModal());
        }
        return;
    }
    
    container.innerHTML = filtered.map(atestado => {
        const tipoLabel = atestado.tipo === 'aluno' ? '🎓 Aluno' : '👔 Funcionário';
        const infoExtra = atestado.tipo === 'aluno' 
            ? `<span class="info-extra"><i class="fas fa-users"></i> ${atestado.turma || 'Não informada'}</span>`
            : `<span class="info-extra"><i class="fas fa-briefcase"></i> ${atestado.funcao || 'Não informado'}</span>`;
        
        const anexoHtml = atestado.anexo 
            ? `<button class="btn-anexo" data-id="${atestado.id}"><i class="fas fa-paperclip"></i> Ver anexo</button>`
            : '';
        
        return `
            <div class="atestado-card" data-id="${atestado.id}">
                <div class="card-header">
                    <div class="card-title">
                        <h3><i class="fas fa-user-circle"></i> ${atestado.nome}</h3>
                        ${getStatusIcon(atestado.dataInicio, atestado.dataFim)}
                    </div>
                    <span class="tipo-badge tipo-${atestado.tipo}">${tipoLabel}</span>
                </div>
                <div class="card-info">
                    ${infoExtra}
                    <span class="info-datas">
                        <i class="fas fa-calendar-alt"></i> ${formatDate(atestado.dataInicio)} → ${formatDate(atestado.dataFim)}
                    </span>
                    <span class="info-motivo">
                        <i class="fas fa-stethoscope"></i> ${atestado.motivo}
                    </span>
                    ${atestado.observacoes ? `
                        <span class="info-obs">
                            <i class="fas fa-comment"></i> ${atestado.observacoes}
                        </span>
                    ` : ''}
                </div>
                <div class="card-actions">
                    ${anexoHtml}
                    <button class="btn-delete" data-id="${atestado.id}">
                        <i class="fas fa-trash-alt"></i> Excluir
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Adicionar eventos aos botões de anexo
    document.querySelectorAll('.btn-anexo').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            const atestado = atestados.find(a => a.id === id);
            if (atestado && atestado.anexo) {
                showAnexoModal(atestado);
            }
        });
    });
    
    // Adicionar eventos aos botões de excluir
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            if (confirm('Tem certeza que deseja excluir este atestado?')) {
                atestados = atestados.filter(a => a.id !== id);
                saveAtestados();
                renderAtestados();
            }
        });
    });
}

function showAnexoModal(atestado) {
    const modal = document.getElementById('modalAnexo');
    const content = document.getElementById('anexoContent');
    
    if (atestado.anexo && atestado.anexo.startsWith('data:')) {
        if (atestado.anexo.includes('pdf')) {
            content.innerHTML = `
                <div class="anexo-preview">
                    <p><strong>Documento:</strong> ${atestado.anexoNome || 'anexo.pdf'}</p>
                    <embed src="${atestado.anexo}" type="application/pdf" width="100%" height="500px">
                    <a href="${atestado.anexo}" download="${atestado.anexoNome}" class="btn-submit" style="display: inline-block; margin-top: 1rem;">
                        <i class="fas fa-download"></i> Baixar PDF
                    </a>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div class="anexo-preview">
                    <p><strong>Imagem:</strong> ${atestado.anexoNome || 'anexo.jpg'}</p>
                    <img src="${atestado.anexo}" alt="Anexo" style="max-width: 100%; border-radius: 8px;">
                    <a href="${atestado.anexo}" download="${atestado.anexoNome}" class="btn-submit" style="display: inline-block; margin-top: 1rem;">
                        <i class="fas fa-download"></i> Baixar imagem
                    </a>
                </div>
            `;
        }
    } else {
        content.innerHTML = `<p>Não foi possível carregar o anexo.</p>`;
    }
    
    modal.classList.add('active');
    
    const closeBtn = document.getElementById('btnCloseAnexoModal');
    const closeHandler = () => {
        modal.classList.remove('active');
        closeBtn.removeEventListener('click', closeHandler);
    };
    closeBtn.addEventListener('click', closeHandler);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

function openModal() {
    const modal = document.getElementById('modalAtestado');
    const form = document.getElementById('formAtestado');
    form.reset();
    document.getElementById('grupoTurma').style.display = 'none';
    document.getElementById('grupoFuncao').style.display = 'none';
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('modalAtestado');
    modal.classList.remove('active');
}

function salvarAtestado(tipo, nome, dataInicio, dataFim, motivo, observacoes, anexo, anexoNome) {
    const turma = document.getElementById('turma').value;
    const funcao = document.getElementById('funcao').value;
    
    const novoAtestado = {
        id: Date.now(),
        nome: nome,
        tipo: tipo,
        turma: tipo === 'aluno' ? turma : undefined,
        funcao: tipo === 'funcionario' ? funcao : undefined,
        dataInicio: dataInicio,
        dataFim: dataFim,
        motivo: motivo,
        observacoes: observacoes,
        anexo: anexo,
        anexoNome: anexoNome,
        dataCadastro: new Date().toISOString().split('T')[0]
    };
    
    atestados.unshift(novoAtestado);
    saveAtestados();
    renderAtestados();
    closeModal();
}

// Configurar eventos do formulário
function setupFormEvents() {
    const tipoSelect = document.getElementById('tipo');
    if (tipoSelect) {
        tipoSelect.addEventListener('change', function() {
            const grupoTurma = document.getElementById('grupoTurma');
            const grupoFuncao = document.getElementById('grupoFuncao');
            
            if (this.value === 'aluno') {
                grupoTurma.style.display = 'block';
                grupoFuncao.style.display = 'none';
                document.getElementById('funcao').required = false;
                document.getElementById('turma').required = true;
            } else if (this.value === 'funcionario') {
                grupoTurma.style.display = 'none';
                grupoFuncao.style.display = 'block';
                document.getElementById('turma').required = false;
                document.getElementById('funcao').required = true;
            } else {
                grupoTurma.style.display = 'none';
                grupoFuncao.style.display = 'none';
            }
        });
    }
    
    const form = document.getElementById('formAtestado');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const tipo = document.getElementById('tipo').value;
            const nome = document.getElementById('nome').value;
            const dataInicio = document.getElementById('dataInicio').value;
            const dataFim = document.getElementById('dataFim').value;
            const motivo = document.getElementById('motivo').value;
            const observacoes = document.getElementById('observacoes').value;
            const anexoFile = document.getElementById('anexo').files[0];
            
            if (!tipo || !nome || !dataInicio || !dataFim || !motivo) {
                alert('Por favor, preencha todos os campos obrigatórios!');
                return;
            }
            
            if (new Date(dataFim) < new Date(dataInicio)) {
                alert('A data de fim não pode ser anterior à data de início!');
                return;
            }
            
            if (anexoFile && anexoFile.size > 5 * 1024 * 1024) {
                alert('O arquivo não pode exceder 5MB!');
                return;
            }
            
            if (anexoFile) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    salvarAtestado(tipo, nome, dataInicio, dataFim, motivo, observacoes, event.target.result, anexoFile.name);
                };
                reader.readAsDataURL(anexoFile);
            } else {
                salvarAtestado(tipo, nome, dataInicio, dataFim, motivo, observacoes, null, null);
            }
        });
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadAtestados();
    setupFormEvents();
    
    const btnNovo = document.getElementById('btnNovoAtestado');
    if (btnNovo) btnNovo.addEventListener('click', openModal);
    
    const btnClose = document.getElementById('btnCloseModal');
    if (btnClose) btnClose.addEventListener('click', closeModal);
    
    const btnCancel = document.getElementById('btnCancelModal');
    if (btnCancel) btnCancel.addEventListener('click', closeModal);
    
    const filtroTipo = document.getElementById('filtroTipo');
    if (filtroTipo) filtroTipo.addEventListener('change', renderAtestados);
    
    const buscaAtestado = document.getElementById('buscaAtestado');
    if (buscaAtestado) buscaAtestado.addEventListener('input', renderAtestados);
    
    // Fechar modal ao clicar fora
    const modalAtestado = document.getElementById('modalAtestado');
    if (modalAtestado) {
        modalAtestado.addEventListener('click', (e) => {
            if (e.target === modalAtestado) {
                closeModal();
            }
        });
    }
});