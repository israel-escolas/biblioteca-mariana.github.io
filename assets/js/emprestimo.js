// ============================================
// SISTEMA DE BIBLIOTECA - emprestimo.js
// ============================================

// ✅ URLs das APIs
const API_EMPRESTIMO_URL = 'https://script.google.com/macros/s/AKfycbwd3FqoXj_PcSA3-y0Sprnajuwg-TSAF6vzQi18ufTQiQmOWCWAqiVsM3TY0YPRc0Q/exec';
const API_ACERVO_URL = 'https://script.google.com/macros/s/AKfycbwQE5Rh2LJlB0AGNQQwVHB0kFfrju8vzGhwxlsI6TwA9Tx5-iegXw91WXsGbEtJZEE/exec';
const API_ESTUDANTES_URL = 'https://script.google.com/macros/s/AKfycbzzeQ5FN6nKHpggycIod9IxiDOHdZkBVdYn0BRIg608eNWt6QhEFCLyFlig3lhKUq4/exec';

// Mapeamento das turmas para os IDs das planilhas
const TURMAS_IDS = {
    '1M': { nome: '1ª Série Matutino', id: '1Yhi51PoQYXkhzCH3Bo6W3NLSqeKnIXGaX7FgA3huMro' },
    '1V': { nome: '1ª Série Vespertino', id: '1jL-iasMF06dJY0FCkM3PIqX0jjq0AhzBP5G_PVfpW-U' },
    '2M': { nome: '2ª Série Matutino', id: '1_dfjTaMPI8Fou2AhL6j3caxTCqVwFonYQKaSDQe3pxc' },
    '2V': { nome: '2ª Série Vespertino', id: '1DW6tAkl_XoHnmu7_Iwatg3ve5FRmAME2CKyBjdsm1Mc' },
    '3M': { nome: '3ª Série Matutino', id: '1S9ujW_Ak8BInbwt5ebvxsGSSkUELnN5Ff0W1wOWYkgI' },
    '3V': { nome: '3ª Série Vespertino', id: '15hDH4Pv9wZmLxMIedgQt3Pos-BsWHjWbD544tl8oBd8' }
};

// Mapeamento do nome da turma para o código
const TURMA_PARA_CODIGO = {
    '1º ANO MATUTINO': '1M',
    '1º ANO VESPERTINO': '1V',
    '2º ANO MATUTINO': '2M',
    '2º ANO VESPERTINO': '2V',
    '3º ANO MATUTINO': '3M',
    '3º ANO VESPERTINO': '3V',
    '1M': '1M',
    '1V': '1V',
    '2M': '2M',
    '2V': '2V',
    '3M': '3M',
    '3V': '3V'
};

// ============== VARIÁVEIS GLOBAIS ==============
let emprestimosAtuais = [];
let statusFiltro = 'todos';
let termoBusca = '';

// Cache para dados
const cacheLivros = {};
const cacheEstudantes = {};

// Mapeamento de colunas (como estão na planilha)
const COLUNAS = {
    ID: 'codigo',
    LIVRO: 'LIVRO',
    ESTUDANTE: 'ESTUDANTE',
    TURMA: 'TURMA',
    DATA_EMPRESTIMO: 'DATA EMPRESTIMO',
    DATA_DEVOLUCAO: 'DATA DEVOLUCAO',
    OUTRO: 'OUTRO',
    SITUACAO: 'SITUAÇÃO',
    OBSERVACOES: 'OBSERVACOES',
    REGISTRO: 'REGISTRO'
};

// ============== ELEMENTOS DO DOM ==============
const emprestimosContainer = document.querySelector('.emprestimos-container');
const searchInput = document.querySelector('.search-box input');
const filterBtns = document.querySelectorAll('.filter-btn');
const statsCards = {
    ativos: document.querySelector('.stat-card:nth-child(1) .stat-number'),
    hoje: document.querySelector('.stat-card:nth-child(2) .stat-number'),
    atrasados: document.querySelector('.stat-card:nth-child(3) .stat-number'),
    total: document.querySelector('.stat-card:nth-child(4) .stat-number')
};

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Sistema de Empréstimos iniciado!');
    configurarFiltros();
    configurarBusca();
    carregarEmprestimos();
});

// ============================================
// CONFIGURAR FILTROS
// ============================================

function configurarFiltros() {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const texto = btn.textContent.trim().toLowerCase();
            
            if (texto === 'todos') statusFiltro = 'todos';
            else if (texto === 'ativos') statusFiltro = 'ATIVO';
            else if (texto === 'atrasados') statusFiltro = 'ATRASADO';
            else if (texto === 'devolvidos') statusFiltro = 'DEVOLVIDO';
            
            aplicarFiltros();
        });
    });
}

// ============================================
// CONFIGURAR BUSCA
// ============================================

function configurarBusca() {
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        termoBusca = e.target.value.toLowerCase().trim();
        aplicarFiltros();
    });
}

// ============================================
// CARREGAR EMPRÉSTIMOS
// ============================================

async function carregarEmprestimos() {
    try {
        mostrarLoading();
        
        const response = await fetch(`${API_EMPRESTIMO_URL}?action=getEmprestimos&status=todos`);
        const resultado = await response.json();
        
        console.log('📨 Resposta da API:', resultado);
        
        if (resultado.success) {
            emprestimosAtuais = resultado.data.map(item => normalizarEmprestimo(item));
            
            console.log(`✅ ${emprestimosAtuais.length} empréstimos carregados`);
            
            atualizarEstatisticas(emprestimosAtuais);
            aplicarFiltros();
        } else {
            throw new Error(resultado.error || 'Erro ao carregar empréstimos');
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar empréstimos:', error);
        mostrarErro(error.message);
    }
}

// ============================================
// NORMALIZAR EMPRÉSTIMO
// ============================================

function normalizarEmprestimo(item) {
    return {
        id: item.codigo || item.ID || item.id,
        livro: item.LIVRO || item.livro,
        estudante: item.ESTUDANTE || item.estudante,
        turma: item.TURMA || item.turma,
        dataEmprestimo: item['DATA EMPRESTIMO'] || item.dataEmprestimo,
        dataDevolucao: item['DATA DEVOLUCAO'] || item.dataDevolucao,
        dataDevolucaoReal: item['DATA DEVOLUCAO REAL'] || item.dataDevolucaoReal || '',
        status: item.SITUAÇÃO || item.STATUS || item.status || 'ATIVO',
        observacoes: item.OBSERVACOES || item.observacoes || '',
        registro: item.REGISTRO || item.registro || '',
        outro: item.OUTRO || item.outro || ''
    };
}

// ============================================
// MOSTRAR LOADING
// ============================================

function mostrarLoading() {
    if (!emprestimosContainer) return;
    
    emprestimosContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #3b82f6;"></i>
            <p style="margin-top: 1rem; color: #64748b;">Carregando empréstimos...</p>
        </div>
    `;
}

// ============================================
// MOSTRAR ERRO
// ============================================

function mostrarErro(mensagem) {
    if (!emprestimosContainer) return;
    
    emprestimosContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444;"></i>
            <p style="margin-top: 1rem; color: #64748b;">${mensagem}</p>
            <button onclick="carregarEmprestimos()" style="margin-top: 1rem; padding: 0.5rem 1.5rem; background: #3b82f6; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
                <i class="fas fa-sync-alt"></i> Tentar Novamente
            </button>
        </div>
    `;
}

// ============================================
// ATUALIZAR ESTATÍSTICAS
// ============================================

function atualizarEstatisticas(emprestimos) {
    console.log('📊 Atualizando estatísticas com', emprestimos.length, 'empréstimos');
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const hojeStr = hoje.toISOString().split('T')[0];
    console.log('📅 Data de hoje para comparação:', hojeStr);
    
    if (statsCards.total) {
        statsCards.total.textContent = emprestimos.length;
    }
    
    const ativos = emprestimos.filter(e => e.status === 'ATIVO');
    console.log('✅ Ativos:', ativos.length);
    if (statsCards.ativos) {
        statsCards.ativos.textContent = ativos.length;
    }
    
    const emprestimosHoje = emprestimos.filter(e => {
        if (!e.dataEmprestimo) return false;
        const dataEmpStr = e.dataEmprestimo.toString().split('T')[0];
        return dataEmpStr === hojeStr;
    });
    
    console.log('📅 Empréstimos hoje:', emprestimosHoje.length);
    if (statsCards.hoje) {
        statsCards.hoje.textContent = emprestimosHoje.length;
    }
    
    const atrasados = ativos.filter(e => {
        if (!e.dataDevolucao) return false;
        const dataDev = new Date(e.dataDevolucao);
        dataDev.setHours(0, 0, 0, 0);
        return hoje > dataDev;
    });
    console.log('⚠️ Atrasados:', atrasados.length);
    if (statsCards.atrasados) {
        statsCards.atrasados.textContent = atrasados.length;
    }
}

// ============================================
// APLICAR FILTROS
// ============================================

function aplicarFiltros() {
    console.log('🔍 Aplicando filtros - Status:', statusFiltro, 'Busca:', termoBusca);
    
    let emprestimosFiltrados = [...emprestimosAtuais];
    
    if (statusFiltro !== 'todos') {
        if (statusFiltro === 'ATRASADO') {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            
            emprestimosFiltrados = emprestimosFiltrados.filter(e => {
                if (e.status !== 'ATIVO') return false;
                if (!e.dataDevolucao) return false;
                const dataDev = new Date(e.dataDevolucao);
                dataDev.setHours(0, 0, 0, 0);
                return hoje > dataDev;
            });
        } else {
            emprestimosFiltrados = emprestimosFiltrados.filter(e => e.status === statusFiltro);
        }
    }
    
    if (termoBusca) {
        emprestimosFiltrados = emprestimosFiltrados.filter(e => {
            const livro = (e.livro || '').toLowerCase();
            const estudante = (e.estudante || '').toLowerCase();
            const turma = (e.turma || '').toLowerCase();
            
            return livro.includes(termoBusca) || 
                   estudante.includes(termoBusca) || 
                   turma.includes(termoBusca);
        });
    }
    
    console.log('📋 Empréstimos filtrados:', emprestimosFiltrados.length);
    
    emprestimosFiltrados.sort((a, b) => {
        const dataA = new Date(a.dataEmprestimo || 0);
        const dataB = new Date(b.dataEmprestimo || 0);
        return dataB - dataA;
    });
    
    exibirEmprestimos(emprestimosFiltrados);
}

// ============================================
// EXIBIR EMPRÉSTIMOS
// ============================================

function exibirEmprestimos(emprestimos) {
    if (!emprestimosContainer) return;
    
    if (emprestimos.length === 0) {
        emprestimosContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <i class="fas fa-inbox" style="font-size: 3rem; color: #cbd5e1;"></i>
                <p style="margin-top: 1rem; color: #64748b;">Nenhum empréstimo encontrado</p>
            </div>
        `;
        return;
    }
    
    emprestimosContainer.innerHTML = '';
    
    emprestimos.forEach(emprestimo => {
        emprestimosContainer.appendChild(criarCardEmprestimo(emprestimo));
    });
}

// ============================================
// CRIAR CARD DE EMPRÉSTIMO
// ============================================

function criarCardEmprestimo(emprestimo) {
    const card = document.createElement('div');
    card.className = 'emprestimo-card';
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    let status = emprestimo.status;
    let statusClass = '';
    let statusIcon = '';
    let statusText = '';
    let diasAtraso = 0;
    
    if (status === 'ATIVO') {
        if (emprestimo.dataDevolucao) {
            const dataDevolucao = new Date(emprestimo.dataDevolucao);
            dataDevolucao.setHours(0, 0, 0, 0);
            
            if (hoje > dataDevolucao) {
                status = 'ATRASADO';
                statusClass = 'late';
                statusIcon = 'exclamation-circle';
                statusText = 'Atrasado';
                card.classList.add('atrasado');
                diasAtraso = Math.floor((hoje - dataDevolucao) / (1000 * 60 * 60 * 24));
            } else {
                statusClass = 'active';
                statusIcon = 'check-circle';
                statusText = 'Em andamento';
                card.classList.add('ativo');
            }
        } else {
            statusClass = 'active';
            statusIcon = 'check-circle';
            statusText = 'Em andamento';
            card.classList.add('ativo');
        }
    } else if (status === 'DEVOLVIDO') {
        statusClass = 'completed';
        statusIcon = 'check-double';
        statusText = 'Devolvido';
        card.classList.add('devolvido');
    }
    
    const dataEmprestimo = formatarData(emprestimo.dataEmprestimo);
    const dataDevolucaoPrevista = formatarData(emprestimo.dataDevolucao);
    
    card.innerHTML = `
        <div class="card-header">
            <div class="status-badge ${statusClass}">
                <i class="fas fa-${statusIcon}"></i> ${statusText}
            </div>
            <div class="card-date">
                <i class="fas fa-calendar-alt"></i> Empréstimo: ${dataEmprestimo}
            </div>
        </div>
        <div class="card-body">
            <div class="info-row">
                <div class="info-item">
                    <i class="fas fa-book"></i>
                    <div>
                        <label>Livro</label>
                        <p>${emprestimo.livro || 'N/A'}</p>
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-user-graduate"></i>
                    <div>
                        <label>Estudante</label>
                        <p>${emprestimo.estudante || 'N/A'}</p>
                        ${emprestimo.turma ? `<small style="color: #64748b;">${emprestimo.turma}</small>` : ''}
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-calendar-check"></i>
                    <div>
                        <label>${status === 'DEVOLVIDO' ? 'Devolvido em' : 'Devolução Prevista'}</label>
                        <p>${status === 'DEVOLVIDO' ? formatarData(emprestimo.dataDevolucaoReal) : dataDevolucaoPrevista}</p>
                        ${status === 'ATRASADO' ? `<span class="days-late">Atrasado ${diasAtraso} dia(s)</span>` : ''}
                    </div>
                </div>
            </div>
            ${emprestimo.observacoes ? `
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
                    <small style="color: #64748b;"><i class="fas fa-pencil-alt"></i> Obs: ${emprestimo.observacoes}</small>
                </div>
            ` : ''}
        </div>
        <div class="card-footer">
            <button class="btn-action btn-view" onclick="abrirModalDetalhes('${emprestimo.id}')">
                <i class="fas fa-eye"></i> Detalhes
            </button>
            ${status !== 'DEVOLVIDO' ? `
                <button class="btn-action btn-return" onclick="confirmarDevolucao('${emprestimo.id}', '${emprestimo.livro.replace(/'/g, "\\'")}')">
                    <i class="fas fa-undo-alt"></i> Devolução
                </button>
            ` : ''}
        </div>
    `;
    
    return card;
}

// ============================================
// FORMATAR DATA
// ============================================

function formatarData(dataString) {
    if (!dataString) return 'N/A';
    
    try {
        const data = new Date(dataString);
        if (isNaN(data.getTime())) return dataString;
        
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return dataString;
    }
}

// ============================================
// FORMATAR DATA COMPLETA
// ============================================

function formatarDataCompleta(dataString) {
    if (!dataString) return 'Não informado';
    
    try {
        const data = new Date(dataString);
        if (isNaN(data.getTime())) return dataString;
        
        return data.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return dataString;
    }
}

// ============================================
// FORMATAR DATA E HORA
// ============================================

function formatarDataHora(data) {
    if (!data) return 'Não informado';
    
    try {
        const d = new Date(data);
        if (isNaN(d.getTime())) return data;
        
        return d.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch {
        return data;
    }
}

// ============================================
// BUSCAR DETALHES DO LIVRO NO ACERVO
// ============================================

async function buscarDetalhesLivro(tituloLivro) {
    if (cacheLivros[tituloLivro]) {
        console.log('📚 Livro encontrado no cache:', tituloLivro);
        return cacheLivros[tituloLivro];
    }
    
    try {
        console.log('🔍 Buscando detalhes do livro:', tituloLivro);
        
        const response = await fetch(`${API_ACERVO_URL}?action=getAllBooks`);
        const resultado = await response.json();
        
        if (resultado.success) {
            const livroEncontrado = resultado.data.find(livro => {
                const titulo = (livro.titulo || livro.TITULO || '').toLowerCase();
                return titulo === tituloLivro.toLowerCase();
            });
            
            if (livroEncontrado) {
                const detalhes = {
                    titulo: livroEncontrado.titulo || livroEncontrado.TITULO || tituloLivro,
                    autor: livroEncontrado.autor || livroEncontrado.AUTOR || 'Não informado',
                    cbl: livroEncontrado.cbl || livroEncontrado.CBL || 'Não informado',
                    categoria: livroEncontrado.categoria || livroEncontrado.CATEGORIA || 'Não informado',
                    editora: livroEncontrado.editora || livroEncontrado.EDITORA || 'Não informado',
                    ano: livroEncontrado.ano || livroEncontrado.ANO || 'Não informado',
                    quantidade: livroEncontrado.quantidade || livroEncontrado.QUANTIDADE || 0
                };
                
                cacheLivros[tituloLivro] = detalhes;
                console.log('✅ Detalhes do livro encontrados:', detalhes);
                return detalhes;
            }
        }
        
        console.warn('⚠️ Livro não encontrado no acervo:', tituloLivro);
        return null;
        
    } catch (error) {
        console.error('❌ Erro ao buscar detalhes do livro:', error);
        return null;
    }
}

// ============================================
// FUNÇÃO AUXILIAR PARA JSONP (CASO NECESSÁRIO)
// ============================================

async function fetchJSONP(url) {
    return new Promise((resolve, reject) => {
        const callbackName = 'callback_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        const script = document.createElement('script');
        
        window[callbackName] = (data) => {
            delete window[callbackName];
            document.body.removeChild(script);
            resolve(data);
        };
        
        script.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + callbackName;
        script.onerror = () => {
            delete window[callbackName];
            document.body.removeChild(script);
            reject(new Error('Erro ao carregar JSONP'));
        };
        
        document.body.appendChild(script);
        
        setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                document.body.removeChild(script);
                reject(new Error('Timeout JSONP'));
            }
        }, 10000);
    });
}

// ============================================
// BUSCAR DETALHES DO ESTUDANTE (CORRIGIDO - USA LISTA PRIMEIRO)
// ============================================

async function buscarDetalhesEstudante(nomeEstudante, turma) {
    const cacheKey = `${nomeEstudante}_${turma}`;
    
    if (cacheEstudantes[cacheKey]) {
        console.log('👤 Estudante encontrado no cache:', nomeEstudante);
        return cacheEstudantes[cacheKey];
    }
    
    try {
        // Mapear a turma para o código
        const codigoTurma = TURMA_PARA_CODIGO[turma] || turma;
        const turmaInfo = TURMAS_IDS[codigoTurma];
        
        if (!turmaInfo) {
            console.warn('⚠️ Turma não mapeada:', turma);
            return null;
        }
        
        console.log('🔍 Buscando estudante:', nomeEstudante);
        console.log('📊 Turma:', turma, '| Código:', codigoTurma);
        console.log('📁 Planilha ID:', turmaInfo.id);
        
        // PASSO 1: Buscar a lista de estudantes (nomes das abas)
        const listUrl = `${API_ESTUDANTES_URL}?action=list&spreadsheetId=${turmaInfo.id}`;
        console.log('📡 Buscando lista:', listUrl);
        
        let listaData;
        try {
            // Tentar com JSONP primeiro
            listaData = await fetchJSONP(listUrl);
        } catch (jsonpError) {
            console.log('⚠️ JSONP falhou, tentando fetch normal...');
            // Fallback para fetch normal
            const response = await fetch(listUrl);
            listaData = await response.json();
        }
        
        console.log('📋 Lista recebida:', listaData);
        
        if (listaData.error) {
            console.warn('⚠️ Erro na lista:', listaData.error);
            return null;
        }
        
        const estudantes = listaData.students || [];
        console.log(`📚 ${estudantes.length} estudantes encontrados na turma`);
        
        if (estudantes.length === 0) {
            console.warn('⚠️ Nenhum estudante encontrado na turma');
            return null;
        }
        
        // PASSO 2: Encontrar o nome exato do estudante (case insensitive)
        // A API de lista retorna os nomes EXATOS das abas
        const nomeExato = estudantes.find(nome => 
            nome.toLowerCase() === nomeEstudante.toLowerCase() ||
            nome.toLowerCase().includes(nomeEstudante.toLowerCase()) ||
            nomeEstudante.toLowerCase().includes(nome.toLowerCase())
        );
        
        if (!nomeExato) {
            console.warn('⚠️ Estudante não encontrado na lista. Procurando por:', nomeEstudante);
            console.log('📋 Nomes disponíveis:', estudantes);
            return null;
        }
        
        console.log('✅ Nome exato encontrado:', nomeExato);
        
        // PASSO 3: Buscar os dados completos do estudante
        const getUrl = `${API_ESTUDANTES_URL}?action=get&spreadsheetId=${turmaInfo.id}&student=${encodeURIComponent(nomeExato)}`;
        console.log('📡 Buscando dados:', getUrl);
        
        let dadosEstudante;
        try {
            dadosEstudante = await fetchJSONP(getUrl);
        } catch (jsonpError) {
            console.log('⚠️ JSONP falhou, tentando fetch normal...');
            const response = await fetch(getUrl);
            dadosEstudante = await response.json();
        }
        
        console.log('📨 Dados recebidos:', dadosEstudante);
        
        if (dadosEstudante.error) {
            console.warn('⚠️ Erro nos dados:', dadosEstudante.error);
            return null;
        }
        
        // Extrair informações relevantes
        const detalhes = {
            nome: dadosEstudante.nome || nomeExato,
            matricula: dadosEstudante.matricula || 'Não informado',
            turma: dadosEstudante.turma || turma,
            turno: dadosEstudante.turno || '',
            telefoneFixo: dadosEstudante.telefoneFixo || '',
            telefoneCelular: dadosEstudante.telefoneCelular || '',
            email: dadosEstudante.email || '',
            emailInstitucional: dadosEstudante.emailInstitucional || '',
            dataNascimento: dadosEstudante.dataNascimento || '',
            cpf: dadosEstudante.cpf || '',
            rg: dadosEstudante.rg || '',
            endereco: dadosEstudante.endereco || '',
            bairro: dadosEstudante.bairro || '',
            municipioContato: dadosEstudante.municipioContato || '',
            ufContato: dadosEstudante.ufContato || '',
            cep: dadosEstudante.cep || '',
            pai: dadosEstudante.pai || '',
            mae: dadosEstudante.mae || '',
            responsavel: dadosEstudante.responsavel || '',
            telefonePai: dadosEstudante.telefonePai || '',
            telefoneMae: dadosEstudante.telefoneMae || '',
            situacao: dadosEstudante.situacao || '',
            foto: dadosEstudante.foto || ''
        };
        
        cacheEstudantes[cacheKey] = detalhes;
        console.log('✅ Estudante encontrado com sucesso!');
        return detalhes;
        
    } catch (error) {
        console.error('❌ Erro ao buscar estudante:', error);
        return null;
    }
}

// ============================================
// ABRIR MODAL DE DETALHES (VERSÃO COMPLETA)
// ============================================

async function abrirModalDetalhes(id) {
    console.log('🔍 Buscando empréstimo com ID:', id);
    
    const emprestimo = emprestimosAtuais.find(e => e.id === id);
    
    if (!emprestimo) {
        console.error('❌ Empréstimo não encontrado! ID:', id);
        mostrarNotificacao('Empréstimo não encontrado!', 'error');
        return;
    }
    
    console.log('✅ Empréstimo encontrado:', emprestimo);
    
    // Abrir modal imediatamente com loading
    const modal = document.getElementById('modalDetalhes');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // ========== INFORMAÇÕES DO LIVRO (BUSCAR DA API) ==========
    const livroTitulo = document.getElementById('detalhe_livro');
    const livroAutor = document.getElementById('detalhe_autor');
    const livroCBL = document.getElementById('detalhe_cbl');
    const livroCategoria = document.getElementById('detalhe_categoria');
    const livroEditora = document.getElementById('detalhe_editora');
    
    if (livroTitulo) livroTitulo.textContent = emprestimo.livro || 'Não informado';
    if (livroAutor) livroAutor.textContent = '🔍 Buscando...';
    if (livroCBL) livroCBL.textContent = '🔍 Buscando...';
    if (livroCategoria) livroCategoria.textContent = '🔍 Buscando...';
    if (livroEditora) livroEditora.textContent = '🔍 Buscando...';
    
    if (emprestimo.livro) {
        const detalhesLivro = await buscarDetalhesLivro(emprestimo.livro);
        
        if (detalhesLivro) {
            if (livroAutor) livroAutor.textContent = detalhesLivro.autor;
            if (livroCBL) livroCBL.textContent = detalhesLivro.cbl;
            if (livroCategoria) livroCategoria.textContent = detalhesLivro.categoria;
            if (livroEditora) livroEditora.textContent = detalhesLivro.editora;
        } else {
            if (livroAutor) livroAutor.textContent = 'Não encontrado';
            if (livroCBL) livroCBL.textContent = 'Não encontrado';
            if (livroCategoria) livroCategoria.textContent = 'Não encontrado';
            if (livroEditora) livroEditora.textContent = 'Não encontrado';
        }
    }
    
    // ========== INFORMAÇÕES DO ESTUDANTE (BUSCAR DA API) ==========
    const estudanteNome = document.getElementById('detalhe_estudante');
    const estudanteMatricula = document.getElementById('detalhe_matricula');
    const estudanteTurma = document.getElementById('detalhe_turma');
    const estudanteTelefone = document.getElementById('detalhe_telefone');
    const estudanteEmail = document.getElementById('detalhe_email');
    
    if (estudanteNome) estudanteNome.textContent = emprestimo.estudante || 'Não informado';
    if (estudanteMatricula) estudanteMatricula.textContent = '🔍 Buscando...';
    if (estudanteTurma) estudanteTurma.textContent = emprestimo.turma || 'Não informado';
    if (estudanteTelefone) estudanteTelefone.textContent = '🔍 Buscando...';
    if (estudanteEmail) estudanteEmail.textContent = '🔍 Buscando...';
    
    if (emprestimo.estudante && emprestimo.turma) {
        const detalhesEstudante = await buscarDetalhesEstudante(emprestimo.estudante, emprestimo.turma);
        
        if (detalhesEstudante) {
            if (estudanteMatricula) estudanteMatricula.textContent = detalhesEstudante.matricula;
            if (estudanteTelefone) {
                const telefone = detalhesEstudante.telefoneCelular !== 'Não informado' 
                    ? detalhesEstudante.telefoneCelular 
                    : detalhesEstudante.telefoneFixo;
                estudanteTelefone.textContent = telefone;
            }
            if (estudanteEmail) {
                const email = detalhesEstudante.email !== 'Não informado' 
                    ? detalhesEstudante.email 
                    : detalhesEstudante.emailInstitucional;
                estudanteEmail.textContent = email;
            }
        } else {
            if (estudanteMatricula) estudanteMatricula.textContent = 'Não encontrado';
            if (estudanteTelefone) estudanteTelefone.textContent = 'Não encontrado';
            if (estudanteEmail) estudanteEmail.textContent = 'Não encontrado';
        }
    }
    
    // ========== INFORMAÇÕES DO EMPRÉSTIMO ==========
    const dataEmprestimo = document.getElementById('detalhe_data_emprestimo');
    const dataPrevista = document.getElementById('detalhe_data_prevista');
    const dataDevolucaoReal = document.getElementById('detalhe_data_devolucao_real');
    const statusEmprestimo = document.getElementById('detalhe_status');
    const observacoes = document.getElementById('detalhe_observacoes');
    const registro = document.getElementById('detalhe_registro');
    
    if (dataEmprestimo) {
        dataEmprestimo.textContent = formatarDataCompleta(emprestimo.dataEmprestimo);
    }
    
    if (dataPrevista) {
        dataPrevista.textContent = formatarDataCompleta(emprestimo.dataDevolucao);
    }
    
    if (dataDevolucaoReal) {
        const devolucaoReal = emprestimo.dataDevolucaoReal || '';
        dataDevolucaoReal.textContent = devolucaoReal ? formatarDataCompleta(devolucaoReal) : 'Não devolvido';
    }
    
    if (statusEmprestimo) {
        const status = emprestimo.status || 'ATIVO';
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        let statusTexto = status;
        let statusClass = '';
        
        if (status === 'ATIVO' && emprestimo.dataDevolucao) {
            const dataDev = new Date(emprestimo.dataDevolucao);
            dataDev.setHours(0, 0, 0, 0);
            
            if (hoje > dataDev) {
                statusTexto = 'ATRASADO';
                statusClass = 'late';
            } else {
                statusTexto = 'ATIVO';
                statusClass = 'active';
            }
        } else if (status === 'DEVOLVIDO') {
            statusTexto = 'DEVOLVIDO';
            statusClass = 'completed';
        } else {
            statusTexto = 'ATIVO';
            statusClass = 'active';
        }
        
        statusEmprestimo.innerHTML = `<span class="status-badge-small ${statusClass}">${statusTexto}</span>`;
    }
    
    if (observacoes) {
        observacoes.textContent = emprestimo.observacoes || 'Nenhuma observação';
    }
    
    if (registro) {
        registro.textContent = emprestimo.registro || formatarDataHora(new Date());
    }
    
    // Guardar o ID atual para ações no modal
    window.emprestimoAtualId = id;
    window.emprestimoAtual = emprestimo;
    
    // Atualizar botões do modal
    const btnDevolver = document.querySelector('.modal-footer .btn-return');
    
    if (emprestimo.status === 'DEVOLVIDO') {
        if (btnDevolver) btnDevolver.style.display = 'none';
    } else {
        if (btnDevolver) {
            btnDevolver.style.display = 'inline-flex';
            btnDevolver.onclick = () => {
                closeModalDetalhes();
                confirmarDevolucao(id, emprestimo.livro);
            };
        }
    }
}

function closeModalDetalhes() {
    const modal = document.getElementById('modalDetalhes');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ============================================
// DEVOLVER DO MODAL
// ============================================

function devolverDoModal() {
    if (!window.emprestimoAtualId || !window.emprestimoAtual) {
        mostrarNotificacao('Nenhum empréstimo selecionado!', 'error');
        return;
    }
    
    closeModalDetalhes();
    confirmarDevolucao(window.emprestimoAtualId, window.emprestimoAtual.livro);
}

// ============================================
// CONFIRMAR DEVOLUÇÃO
// ============================================

function confirmarDevolucao(id, livro) {
    if (!confirm(`Confirmar devolução do livro "${livro}"?`)) {
        return;
    }
    
    devolverLivro(id);
}

// ============================================
// DEVOLVER LIVRO
// ============================================

async function devolverLivro(id) {
    try {
        mostrarNotificacao('Processando devolução...', 'info');
        
        console.log('📤 Devolvendo empréstimo ID:', id);
        
        const response = await fetch(API_EMPRESTIMO_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'devolverLivro',
                id: id
            })
        });

        const resultado = await response.json();
        console.log('📨 Resposta da devolução:', resultado);
        
        if (resultado.success) {
            mostrarNotificacao('✅ Livro devolvido com sucesso!', 'success');
            await carregarEmprestimos();
            closeModalDetalhes();
        } else {
            mostrarNotificacao(resultado.error || 'Erro ao devolver livro', 'error');
        }
        
    } catch (error) {
        console.error('❌ Erro ao devolver livro:', error);
        mostrarNotificacao('Erro na conexão: ' + error.message, 'error');
    }
}

// ============================================
// NOTIFICAÇÕES
// ============================================

function mostrarNotificacao(mensagem, tipo = 'info') {
    const icone = tipo === 'success' ? 'check-circle' : 
                  tipo === 'error' ? 'exclamation-circle' : 'info-circle';
    const cor = tipo === 'success' ? '#10b981' : 
                tipo === 'error' ? '#ef4444' : '#3b82f6';

    const notificacao = document.createElement('div');
    notificacao.innerHTML = `<i class="fas fa-${icone}"></i> <span>${mensagem}</span>`;
    notificacao.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 20px;
        background: ${cor};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 10000;
        font-family: Inter, sans-serif;
        font-size: 0.95rem;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notificacao);
    setTimeout(() => {
        notificacao.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notificacao.remove(), 300);
    }, 3500);
}

// Adicionar animações para notificações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ============================================
// EXPOR FUNÇÕES GLOBAIS
// ============================================

window.abrirModalDetalhes = abrirModalDetalhes;
window.closeModalDetalhes = closeModalDetalhes;
window.confirmarDevolucao = confirmarDevolucao;
window.carregarEmprestimos = carregarEmprestimos;
window.devolverDoModal = devolverDoModal;

// Configurar evento de fechar modal ao clicar fora
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modalDetalhes');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModalDetalhes();
            }
        });
    }
});

console.log('✅ emprestimo.js carregado!');