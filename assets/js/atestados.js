
'use strict';


const TURMAS_IDS = {
    '1M': { nome: '1ª Série Matutino', id: '1Yhi51PoQYXkhzCH3Bo6W3NLSqeKnIXGaX7FgA3huMro' },
    '1V': { nome: '1ª Série Vespertino', id: '1jL-iasMF06dJY0FCkM3PIqX0jjq0AhzBP5G_PVfpW-U' },
    '2M': { nome: '2ª Série Matutino', id: '1_dfjTaMPI8Fou2AhL6j3caxTCqVwFonYQKaSDQe3pxc' },
    '2V': { nome: '2ª Série Vespertino', id: '1DW6tAkl_XoHnmu7_Iwatg3ve5FRmAME2CKyBjdsm1Mc' },
    '3M': { nome: '3ª Série Matutino', id: '1S9ujW_Ak8BInbwt5ebvxsGSSkUELnN5Ff0W1wOWYkgI' },
    '3V': { nome: '3ª Série Vespertino', id: '15hDH4Pv9wZmLxMIedgQt3Pos-BsWHjWbD544tl8oBd8' },
    'FUNC': { nome: 'FUNCIONÁRIOS', id: '1ypAr72q3K43OH_P7_fw57WCFiU3t1NpldKxOdMAI0eY' }
};

const TURMAS_NOMES = {
    '1M': '1º ANO MATUTINO',
    '1V': '1º ANO VESPERTINO',
    '2M': '2º ANO MATUTINO',
    '2V': '2º ANO VESPERTINO',
    '3M': '3º ANO MATUTINO',
    '3V': '3º ANO VESPERTINO',
    'FUNC': 'FUNCIONÁRIOS'
};

const TURMAS_NORMALIZADAS = {
    '1º ANO MATUTINO': '1º ANO MATUTINO',
    '1º ANO VESPERTINO': '1º ANO VESPERTINO',
    '2º ANO MATUTINO': '2º ANO MATUTINO',
    '2º ANO VESPERTINO': '2º ANO VESPERTINO',
    '3º ANO MATUTINO': '3º ANO MATUTINO',
    '3º ANO VESPERTINO': '3º ANO VESPERTINO',
    'FUNCIONÁRIOS': 'FUNCIONÁRIOS',
    '1M': '1º ANO MATUTINO',
    '1V': '1º ANO VESPERTINO',
    '2M': '2º ANO MATUTINO',
    '2V': '2º ANO VESPERTINO',
    '3M': '3º ANO MATUTINO',
    '3V': '3º ANO VESPERTINO',
    'FUNC': 'FUNCIONÁRIOS',
    '1º ANO - MATUTINO': '1º ANO MATUTINO',
    '1º ANO - VESPERTINO': '1º ANO VESPERTINO',
    '2º ANO - MATUTINO': '2º ANO MATUTINO',
    '2º ANO - VESPERTINO': '2º ANO VESPERTINO',
    '3º ANO - MATUTINO': '3º ANO MATUTINO',
    '3º ANO - VESPERTINO': '3º ANO VESPERTINO',
    '1ª SÉRIE MATUTINO': '1º ANO MATUTINO',
    '1ª SÉRIE VESPERTINO': '1º ANO VESPERTINO',
    '2ª SÉRIE MATUTINO': '2º ANO MATUTINO',
    '2ª SÉRIE VESPERTINO': '2º ANO VESPERTINO',
    '3ª SÉRIE MATUTINO': '3º ANO MATUTINO',
    '3ª SÉRIE VESPERTINO': '3º ANO VESPERTINO'
};

// ============================================
// 2. VARIÁVEIS GLOBAIS
// ============================================

let registrosCompletos = [];
let estudantesCache = {};
let funcionariosCache = null;
let linhaParaExcluir = null;
let linhaParaEditar = null;

// ============================================
// 3. ELEMENTOS DO DOM (Cache)
// ============================================

const DOM = {
    tabBtns: null,
    tabContents: null,
    formAtestado: null,
    selectTurma: null,
    selectAluno: null,
    dataInicio: null,
    dataFim: null,
    arquivoInput: null,
    fileInfo: null,
    btnLimpar: null,
    mensagemRegistro: null,
    tbodyRegistros: null,
    btnAtualizar: null,
    filtroTurma: null,
    filtroDataInicio: null,
    filtroDataFim: null,
    filtroStatus: null,
    modalEditar: null,
    modalExcluir: null,
    btnFiltroRapido7: null,
    btnFiltroRapido30: null,
    
    init() {
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        this.formAtestado = document.getElementById('formAtestado');
        this.selectTurma = document.getElementById('turma');
        this.selectAluno = document.getElementById('aluno');
        this.dataInicio = document.getElementById('dataInicio');
        this.dataFim = document.getElementById('dataFim');
        this.arquivoInput = document.getElementById('arquivo');
        this.fileInfo = document.getElementById('fileInfo');
        this.btnLimpar = document.getElementById('btnLimpar');
        this.mensagemRegistro = document.getElementById('mensagemRegistro');
        this.tbodyRegistros = document.getElementById('tbodyRegistros');
        this.btnAtualizar = document.getElementById('btnAtualizar');
        this.filtroTurma = document.getElementById('filtroTurma');
        this.filtroDataInicio = document.getElementById('filtroDataInicio');
        this.filtroDataFim = document.getElementById('filtroDataFim');
        this.filtroStatus = document.getElementById('filtroStatus');
        this.modalEditar = document.getElementById('modalEditar');
        this.modalExcluir = document.getElementById('modalExcluir');
        this.btnFiltroRapido7 = document.getElementById('btnFiltroRapido7');
        this.btnFiltroRapido30 = document.getElementById('btnFiltroRapido30');
    }
};

// ============================================
// 4. UTILITÁRIOS
// ============================================

class Utils {
    
    // Formata data para exibição (DD/MM/YYYY)
    static formatarData(dataString) {
        if (!dataString) return '—';
        
        // Se já está no formato brasileiro
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataString)) {
            return dataString;
        }
        
        // Se está no formato ISO (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dataString)) {
            const [ano, mes, dia] = dataString.split('-');
            return `${dia}/${mes}/${ano}`;
        }
        
        // Tenta parsear como data
        try {
            const data = new Date(dataString);
            if (!isNaN(data.getTime())) {
                return data.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            }
        } catch (e) {
            // Ignora erro
        }
        
        return dataString;
    }
    
    // Converte data para ISO (YYYY-MM-DD)
    static converterDataParaISO(dataString) {
        if (!dataString) return '';
        
        // Se já está em ISO
        if (/^\d{4}-\d{2}-\d{2}$/.test(dataString)) return dataString;
        
        // Se contém timestamp
        if (dataString.includes('T')) return dataString.split('T')[0];
        
        // Converte de DD/MM/YYYY
        const match = dataString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (match) return `${match[3]}-${match[2]}-${match[1]}`;
        
        return dataString;
    }
    
    // Obtém data de hoje no formato YYYY-MM-DD
    static getHoje() {
        return new Date().toISOString().split('T')[0];
    }
    
    // Calcula data N dias atrás
    static getDataAtras(dias) {
        const data = new Date();
        data.setDate(data.getDate() - dias);
        return data.toISOString().split('T')[0];
    }
    
    // Converte arquivo para Base64
    static fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    // Escapa string para HTML
    static escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;');
    }
}

// ============================================
// 5. NOTIFICAÇÕES E FEEDBACK
// ============================================

class Notifications {
    
    // Toast notification
    static mostrarToast(mensagem, tipo = 'info') {
        const icone = tipo === 'success' ? 'check-circle' : 
                      tipo === 'error' ? 'exclamation-circle' : 'info-circle';
        
        const notificacao = document.createElement('div');
        notificacao.className = `toast-notification toast-${tipo}`;
        notificacao.innerHTML = `<i class="fas fa-${icone}"></i> <span>${mensagem}</span>`;
        
        document.body.appendChild(notificacao);
        
        setTimeout(() => {
            notificacao.style.animation = 'toastSlideOut 0.3s ease';
            setTimeout(() => notificacao.remove(), 300);
        }, 3500);
    }
    
    // Mensagem no formulário
    static mostrarMensagemForm(texto, tipo) {
        if (!DOM.mensagemRegistro) return;
        
        DOM.mensagemRegistro.innerHTML = texto;
        DOM.mensagemRegistro.className = `mensagem ${tipo}`;
        
        setTimeout(() => {
            DOM.mensagemRegistro.innerHTML = '';
            DOM.mensagemRegistro.className = 'mensagem';
        }, 5000);
    }
    
    // Loading overlay
    static toggleLoading(show, texto = 'Carregando...') {
        let overlay = document.getElementById('loadingOverlay');
        
        if (show) {
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'loadingOverlay';
                overlay.className = 'loading-overlay';
                overlay.innerHTML = `
                    <i class="fas fa-spinner fa-spin spinner"></i>
                    <span class="loading-text">${texto}</span>
                `;
                document.body.appendChild(overlay);
            }
        } else {
            if (overlay) {
                overlay.remove();
            }
        }
    }
}

// ============================================
// 6. GERENCIAMENTO DE TABS
// ============================================

class TabManager {
    
    static configurar() {
        DOM.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                
                DOM.tabBtns.forEach(b => b.classList.remove('active'));
                DOM.tabContents.forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(`tab-${tabId}`).classList.add('active');
                
                if (tabId === 'consultar') {
                    DataManager.carregarRegistros();
                }
            });
        });
    }
}

// ============================================
// 7. GERENCIAMENTO DE DADOS
// ============================================

class DataManager {
    
    // Carrega turmas nos selects
    static carregarTurmas() {
        const turmas = Object.values(TURMAS_NOMES).sort();
        
        // Select do formulário
        if (DOM.selectTurma) {
            DOM.selectTurma.innerHTML = '<option value="">Selecione a turma</option>';
            
            turmas.filter(t => t !== 'FUNCIONÁRIOS').forEach(turma => {
                const option = document.createElement('option');
                option.value = turma;
                option.textContent = turma;
                DOM.selectTurma.appendChild(option);
            });
            
            const optionFunc = document.createElement('option');
            optionFunc.value = 'FUNCIONÁRIOS';
            optionFunc.textContent = '👔 FUNCIONÁRIOS';
            optionFunc.style.fontWeight = 'bold';
            optionFunc.style.color = '#8b5cf6';
            DOM.selectTurma.appendChild(optionFunc);
        }
        
        // Select do filtro
        if (DOM.filtroTurma) {
            DOM.filtroTurma.innerHTML = '<option value="Todas">Todas as Turmas</option>';
            
            turmas.filter(t => t !== 'FUNCIONÁRIOS').forEach(turma => {
                const option = document.createElement('option');
                option.value = turma;
                option.textContent = turma;
                DOM.filtroTurma.appendChild(option);
            });
            
            const optionFunc = document.createElement('option');
            optionFunc.value = 'FUNCIONÁRIOS';
            optionFunc.textContent = '👔 FUNCIONÁRIOS';
            DOM.filtroTurma.appendChild(optionFunc);
        }
    }
    
    // Carrega funcionários da API
    static async carregarFuncionarios() {
        if (funcionariosCache) return funcionariosCache;
        
        try {
            console.log('👔 Carregando funcionários...');
            
            const response = await fetch(`${API_ESTUDANTES_URL}?action=getFuncionarios`);
            const resultado = await response.json();
            
            if (resultado.success && resultado.funcionarios) {
                funcionariosCache = resultado.funcionarios;
                console.log(`✅ ${funcionariosCache.length} funcionários carregados`);
                return funcionariosCache;
            }
            
            // Fallback
            const response2 = await fetch(`${API_URL}?action=getFuncionarios`);
            const resultado2 = await response2.json();
            
            if (resultado2.success && resultado2.funcionarios) {
                funcionariosCache = resultado2.funcionarios;
                return funcionariosCache;
            }
            
            console.warn('⚠️ Nenhum funcionário encontrado');
            return [];
            
        } catch (error) {
            console.error('❌ Erro ao carregar funcionários:', error);
            return [];
        }
    }
    
    // Carrega alunos da turma selecionada
    static async carregarAlunosDaTurma() {
        const turmaSelecionada = DOM.selectTurma.value;
        
        if (!turmaSelecionada) {
            DOM.selectAluno.innerHTML = '<option value="">Selecione uma turma primeiro</option>';
            DOM.selectAluno.disabled = true;
            return;
        }
        
        // Caso especial: Funcionários
        if (turmaSelecionada === 'FUNCIONÁRIOS') {
            DOM.selectAluno.innerHTML = '<option value="">Carregando funcionários...</option>';
            DOM.selectAluno.disabled = true;
            
            const funcionarios = await DataManager.carregarFuncionarios();
            
            if (funcionarios && funcionarios.length > 0) {
                DOM.selectAluno.innerHTML = '<option value="">Selecione o funcionário</option>';
                
                funcionarios.sort((a, b) => {
                    const nomeA = (a.NOME || a.nome || '').toUpperCase();
                    const nomeB = (b.NOME || b.nome || '').toUpperCase();
                    return nomeA.localeCompare(nomeB);
                });
                
                funcionarios.forEach(func => {
                    const nome = func.NOME || func.nome || 'N/A';
                    const funcao = func.FUNCAO || func.funcao || '';
                    
                    const option = document.createElement('option');
                    option.value = nome;
                    option.textContent = funcao ? `${nome} (${funcao})` : nome;
                    DOM.selectAluno.appendChild(option);
                });
                
                DOM.selectAluno.disabled = false;
            } else {
                DOM.selectAluno.innerHTML = '<option value="">Nenhum funcionário encontrado</option>';
            }
            return;
        }
        
        // Alunos normais
        DOM.selectAluno.innerHTML = '<option value="">Carregando alunos...</option>';
        DOM.selectAluno.disabled = true;
        
        const codigoTurma = Object.keys(TURMAS_NOMES).find(key => TURMAS_NOMES[key] === turmaSelecionada);
        
        if (!codigoTurma || !TURMAS_IDS[codigoTurma]) {
            DOM.selectAluno.innerHTML = '<option value="">Erro ao carregar turma</option>';
            return;
        }
        
        const turmaInfo = TURMAS_IDS[codigoTurma];
        
        if (estudantesCache[codigoTurma]) {
            DataManager.preencherSelectAlunos(estudantesCache[codigoTurma]);
            return;
        }
        
        try {
            const response = await fetch(`${API_ESTUDANTES_URL}?action=list&spreadsheetId=${turmaInfo.id}`);
            const resultado = await response.json();
            
            if (resultado.students) {
                estudantesCache[codigoTurma] = resultado.students.sort();
                DataManager.preencherSelectAlunos(resultado.students);
            } else {
                DOM.selectAluno.innerHTML = '<option value="">Nenhum aluno encontrado</option>';
            }
            
        } catch (error) {
            console.error('Erro ao carregar alunos:', error);
            DOM.selectAluno.innerHTML = '<option value="">Erro ao carregar alunos</option>';
        }
    }
    
    static preencherSelectAlunos(alunos) {
        DOM.selectAluno.innerHTML = '<option value="">Selecione o aluno</option>';
        alunos.forEach(aluno => {
            const option = document.createElement('option');
            option.value = aluno;
            option.textContent = aluno;
            DOM.selectAluno.appendChild(option);
        });
        DOM.selectAluno.disabled = false;
    }
    
    // Carrega todos os registros de atestados
    static async carregarRegistros() {
        if (!DOM.tbodyRegistros) return;
        
        DOM.tbodyRegistros.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-spinner fa-spin"></i> Carregando registros...
                </td>
            </tr>
        `;
        
        try {
            const response = await fetch(API_ATESTADOS_URL);
            const resultado = await response.json();
            
            if (resultado.success) {
                registrosCompletos = resultado.data || [];
                console.log(`✅ ${registrosCompletos.length} registros carregados`);
                DataManager.filtrarRegistros();
            } else {
                DOM.tbodyRegistros.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 2rem;">
                            ❌ Erro ao carregar registros
                        </td>
                    </tr>
                `;
            }
            
        } catch (error) {
            console.error('❌ Erro na conexão:', error);
            DOM.tbodyRegistros.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2rem;">
                        ❌ Erro na conexão
                    </td>
                </tr>
            `;
        }
    }
    
    // Filtra registros com todos os critérios
    static filtrarRegistros() {
        console.log('🔍 Filtrando registros...');
        console.log('📊 Total de registros antes dos filtros:', registrosCompletos.length);
        
        let filtrados = [...registrosCompletos];
        
        // Filtro por turma
        const turmaFiltro = DOM.filtroTurma.value;
        if (turmaFiltro && turmaFiltro !== 'Todas') {
            const filtroNormalizado = TURMAS_NORMALIZADAS[turmaFiltro] || turmaFiltro;
            
            filtrados = filtrados.filter(r => {
                let turmaRegistro = (r.Turma || r.turma || r.TURMA || '').trim();
                const turmaNormalizada = TURMAS_NORMALIZADAS[turmaRegistro] || turmaRegistro;
                return turmaNormalizada === filtroNormalizado;
            });
            console.log('📊 Após filtro turma:', filtrados.length);
        }
        
        // Filtro por período (data início E data fim)
        const dataInicioFiltro = DOM.filtroDataInicio?.value;
        const dataFimFiltro = DOM.filtroDataFim?.value;
        
        if (dataInicioFiltro || dataFimFiltro) {
            filtrados = filtrados.filter(r => {
                let dataRegistro = Utils.converterDataParaISO(
                    r.Datainicio || r.DATAINICIO || r.dataInicio || ''
                );
                
                if (!dataRegistro) return false;
                
                // Se ambas as datas foram informadas (período)
                if (dataInicioFiltro && dataFimFiltro) {
                    return dataRegistro >= dataInicioFiltro && dataRegistro <= dataFimFiltro;
                }
                
                // Se apenas data início foi informada (a partir de)
                if (dataInicioFiltro && !dataFimFiltro) {
                    return dataRegistro >= dataInicioFiltro;
                }
                
                // Se apenas data fim foi informada (até)
                if (!dataInicioFiltro && dataFimFiltro) {
                    return dataRegistro <= dataFimFiltro;
                }
                
                return true;
            });
            console.log('📊 Após filtro período:', filtrados.length);
        }
        
        // Filtro por status
        const statusFiltro = DOM.filtroStatus.value;
        if (statusFiltro && statusFiltro !== 'Todos') {
            filtrados = filtrados.filter(r => {
                let status = r.Status || r.STATUS || r.status || 'Pendente';
                status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
                return status === statusFiltro;
            });
            console.log('📊 Após filtro status:', filtrados.length);
        }
        
        // Ordenar por data (mais recente primeiro)
        filtrados.sort((a, b) => {
            const dataA = Utils.converterDataParaISO(a.Datainicio || a.DATAINICIO || '');
            const dataB = Utils.converterDataParaISO(b.Datainicio || b.DATAINICIO || '');
            return dataB.localeCompare(dataA);
        });
        
        console.log('✅ Total filtrado:', filtrados.length);
        
        // Atualiza estado visual dos botões de filtro rápido
        DataManager.atualizarBotoesFiltroRapido();
        
        Renderer.renderizarTabela(filtrados);
    }
    
// Filtro rápido: adiciona 7 dias à data inicial
static filtroRapido7Dias() {
    const dataInicio = DOM.filtroDataInicio?.value;
    
    if (!dataInicio) {
        Notifications.mostrarToast('⚠️ Selecione primeiro a data inicial (De)', 'error');
        return;
    }
    
    // Calcula data final = data inicial + 7 dias
    const data = new Date(dataInicio + 'T00:00:00');
    data.setDate(data.getDate() + 7);
    const dataFim = data.toISOString().split('T')[0];
    
    DOM.filtroDataFim.value = dataFim;
    
    DataManager.filtrarRegistros();
    Notifications.mostrarToast('📅 Período: 7 dias a partir da data inicial', 'info');
}

// Filtro rápido: adiciona 30 dias à data inicial
static filtroRapido30Dias() {
    const dataInicio = DOM.filtroDataInicio?.value;
    
    if (!dataInicio) {
        Notifications.mostrarToast('⚠️ Selecione primeiro a data inicial (De)', 'error');
        return;
    }
    
    // Calcula data final = data inicial + 30 dias
    const data = new Date(dataInicio + 'T00:00:00');
    data.setDate(data.getDate() + 30);
    const dataFim = data.toISOString().split('T')[0];
    
    DOM.filtroDataFim.value = dataFim;
    
    DataManager.filtrarRegistros();
    Notifications.mostrarToast('📅 Período: 30 dias a partir da data inicial', 'info');
}

// Atualiza estado visual dos botões de filtro rápido
static atualizarBotoesFiltroRapido() {
    if (!DOM.btnFiltroRapido7 || !DOM.btnFiltroRapido30) return;
    
    const dataInicio = DOM.filtroDataInicio?.value;
    const dataFim = DOM.filtroDataFim?.value;
    
    if (!dataInicio || !dataFim) {
        DOM.btnFiltroRapido7.classList.remove('active-filter');
        DOM.btnFiltroRapido30.classList.remove('active-filter');
        return;
    }
    
    // Calcula qual seria a data final para 7 dias
    const data7 = new Date(dataInicio + 'T00:00:00');
    data7.setDate(data7.getDate() + 7);
    const is7Dias = dataFim === data7.toISOString().split('T')[0];
    
    // Calcula qual seria a data final para 30 dias
    const data30 = new Date(dataInicio + 'T00:00:00');
    data30.setDate(data30.getDate() + 30);
    const is30Dias = dataFim === data30.toISOString().split('T')[0];
    
    // Atualiza classes visuais
    DOM.btnFiltroRapido7.classList.toggle('active-filter', is7Dias);
    DOM.btnFiltroRapido30.classList.toggle('active-filter', is30Dias);
}
    
    // Limpa todos os filtros
    static limparFiltros() {
        DOM.filtroTurma.value = 'Todas';
        DOM.filtroDataInicio.value = '';
        DOM.filtroDataFim.value = '';
        DOM.filtroStatus.value = 'Todos';
        DataManager.filtrarRegistros();
    }
}

// ============================================
// 8. RENDERIZAÇÃO DA TABELA
// ============================================

class Renderer {
    
    static renderizarTabela(registros) {
        if (!DOM.tbodyRegistros) return;
        
        if (registros.length === 0) {
            DOM.tbodyRegistros.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2rem; color: #64748b;">
                        📭 Nenhum registro encontrado para os filtros selecionados
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        
        registros.forEach((registro) => {
            // Encontra o índice na planilha (linha + 2 porque planilha começa na linha 2)
            const indexOriginal = registrosCompletos.findIndex(r => 
                r.Nome === registro.Nome && 
                r.Datainicio === registro.Datainicio &&
                r.Motivo === registro.Motivo
            );
            const linhaOriginal = indexOriginal !== -1 ? indexOriginal + 2 : 0;
            
            const nome = registro.Nome || registro.nome || '—';
            const turma = registro.Turma || registro.turma || '—';
            const dataInicio = registro.Datainicio || registro.datainicio || '';
            const dataFim = registro.Datafim || registro.datafim || '';
            const motivo = registro.Motivo || registro.motivo || '';
            const link = registro.Link || registro.link || '';
            const nomeArquivo = registro.NomeArquivo || registro.nomeArquivo || '';
            const status = registro.Status || registro.status || 'Pendente';
            const tipo = registro.Tipo || (turma === 'FUNCIONÁRIOS' ? 'Funcionário' : 'Aluno');
            
            const statusClass = status === 'Aprovado' ? 'status-aprovado' :
                               status === 'Pendente' ? 'status-pendente' : 'status-rejeitado';
            
            const motivoCurto = (motivo || '').substring(0, 60) + ((motivo || '').length > 60 ? '...' : '');
            
            const arquivoHtml = link ? 
                `<a href="${Utils.escapeHtml(link)}" target="_blank" 
                    title="${Utils.escapeHtml(nomeArquivo || 'Ver arquivo')}" 
                    style="color: #3b82f6; text-decoration: none; font-weight: 500;">
                    <i class="fas fa-paperclip"></i> Ver
                </a>` : '<span style="color: #94a3b8;">—</span>';
            
            const iconeTipo = tipo === 'Funcionário' ? '👔' : '🎓';
            
            html += `
                <tr>
                    <td style="font-weight: 500;">${iconeTipo} ${Utils.escapeHtml(nome)}</td>
                    <td>${Utils.escapeHtml(turma)}</td>
                    <td>${Utils.formatarData(dataInicio)}</td>
                    <td>${Utils.formatarData(dataFim)}</td>
                    <td title="${Utils.escapeHtml(motivo)}">${Utils.escapeHtml(motivoCurto)}</td>
                    <td>${arquivoHtml}</td>
                    <td><span class="status-badge ${statusClass}">${Utils.escapeHtml(status)}</span></td>
                    <td class="acoes-cell no-print">
                        <button class="btn-icon edit" onclick="App.abrirModalEditar(${linhaOriginal})" title="Editar registro">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" onclick="App.abrirModalExcluir(${linhaOriginal}, '${Utils.escapeHtml(nome).replace(/'/g, "\\'")}')" title="Excluir registro">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        DOM.tbodyRegistros.innerHTML = html;
    }
    
    // Gera HTML para impressão com os mesmos filtros da tela
    static gerarHTMLImpressao() {
        const turmaFiltro = DOM.filtroTurma.value;
        const statusFiltro = DOM.filtroStatus.value;
        const dataInicioFiltro = DOM.filtroDataInicio?.value;
        const dataFimFiltro = DOM.filtroDataFim?.value;
        
        let registrosParaImprimir = [...registrosCompletos];
        
        // Aplica os mesmos filtros da visualização atual
        if (turmaFiltro && turmaFiltro !== 'Todas') {
            const filtroNormalizado = TURMAS_NORMALIZADAS[turmaFiltro] || turmaFiltro;
            registrosParaImprimir = registrosParaImprimir.filter(r => {
                let turmaRegistro = (r.Turma || r.turma || r.TURMA || '').trim();
                const turmaNormalizada = TURMAS_NORMALIZADAS[turmaRegistro] || turmaRegistro;
                return turmaNormalizada === filtroNormalizado;
            });
        }
        
        if (dataInicioFiltro || dataFimFiltro) {
            registrosParaImprimir = registrosParaImprimir.filter(r => {
                let dataRegistro = Utils.converterDataParaISO(
                    r.Datainicio || r.DATAINICIO || r.dataInicio || ''
                );
                if (!dataRegistro) return false;
                
                if (dataInicioFiltro && dataFimFiltro) {
                    return dataRegistro >= dataInicioFiltro && dataRegistro <= dataFimFiltro;
                }
                if (dataInicioFiltro && !dataFimFiltro) {
                    return dataRegistro >= dataInicioFiltro;
                }
                if (!dataInicioFiltro && dataFimFiltro) {
                    return dataRegistro <= dataFimFiltro;
                }
                return true;
            });
        }
        
        if (statusFiltro && statusFiltro !== 'Todos') {
            registrosParaImprimir = registrosParaImprimir.filter(r => {
                let status = r.Status || r.STATUS || r.status || 'Pendente';
                status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
                return status === statusFiltro;
            });
        }
        
        // Ordena por data (mais recente primeiro)
        registrosParaImprimir.sort((a, b) => {
            const dataA = Utils.converterDataParaISO(a.Datainicio || a.DATAINICIO || '');
            const dataB = Utils.converterDataParaISO(b.Datainicio || b.DATAINICIO || '');
            return dataB.localeCompare(dataA);
        });
        
        const dataAtual = new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Monta o HTML de impressão
        let html = `
            <div id="printArea">
                <div class="print-header">
                    <h2>📋 Registro de Atestados</h2>
                    <p><strong>E.E. Mariana Cavalcanti - Biblioteca</strong></p>
                    <p>Data da impressão: ${dataAtual}</p>
                    <p>Total de registros: <strong>${registrosParaImprimir.length}</strong></p>
        `;
        
        // Mostra os filtros aplicados
        if (turmaFiltro && turmaFiltro !== 'Todas') {
            html += `<p>Turma: <strong>${turmaFiltro}</strong></p>`;
        }
        
        if (dataInicioFiltro && dataFimFiltro) {
            html += `<p>Período: <strong>${Utils.formatarData(dataInicioFiltro)} até ${Utils.formatarData(dataFimFiltro)}</strong></p>`;
        } else if (dataInicioFiltro) {
            html += `<p>A partir de: <strong>${Utils.formatarData(dataInicioFiltro)}</strong></p>`;
        } else if (dataFimFiltro) {
            html += `<p>Até: <strong>${Utils.formatarData(dataFimFiltro)}</strong></p>`;
        }
        
        if (statusFiltro && statusFiltro !== 'Todos') {
            html += `<p>Status: <strong>${statusFiltro}</strong></p>`;
        }
        
        html += `
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Turma/Grupo</th>
                            <th>Data Início</th>
                            <th>Data Fim</th>
                            <th>Motivo</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        if (registrosParaImprimir.length === 0) {
            html += `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 20px; color: #64748b;">
                        Nenhum registro encontrado para os filtros selecionados
                    </td>
                </tr>
            `;
        } else {
            registrosParaImprimir.forEach(registro => {
                const nome = registro.Nome || registro.nome || '—';
                const turma = registro.Turma || registro.turma || '—';
                const dataInicio = Utils.formatarData(registro.Datainicio || registro.datainicio || '');
                const dataFim = Utils.formatarData(registro.Datafim || registro.datafim || '');
                const motivo = registro.Motivo || registro.motivo || '—';
                const status = registro.Status || registro.status || 'Pendente';
                
                html += `
                    <tr>
                        <td>${Utils.escapeHtml(nome)}</td>
                        <td>${Utils.escapeHtml(turma)}</td>
                        <td>${dataInicio}</td>
                        <td>${dataFim}</td>
                        <td>${Utils.escapeHtml(motivo.length > 80 ? motivo.substring(0, 80) + '...' : motivo)}</td>
                        <td>${Utils.escapeHtml(status)}</td>
                    </tr>
                `;
            });
        }
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        return html;
    }
}

// ============================================
// 9. GERENCIAMENTO DE ARQUIVOS
// ============================================

class FileManager {
    
    static configurar() {
        if (!DOM.arquivoInput) return;
        
        DOM.arquivoInput.addEventListener('change', FileManager.handleFileSelect);
        
        const fileLabel = document.querySelector('.file-upload-label span');
        if (fileLabel) {
            DOM.arquivoInput.addEventListener('change', function() {
                fileLabel.textContent = this.files[0] ? '🔄 Trocar arquivo' : 'Clique ou arraste um arquivo';
            });
        }
    }
    
    static handleFileSelect() {
        const file = this.files[0];
        if (!file) {
            DOM.fileInfo.style.display = 'none';
            return;
        }
        
        // Valida tamanho (10MB)
        if (file.size > 10 * 1024 * 1024) {
            Notifications.mostrarToast('❌ Arquivo excede o limite de 10MB!', 'error');
            this.value = '';
            DOM.fileInfo.style.display = 'none';
            return;
        }
        
        // Valida extensão
        const extensoesPermitidas = ['.pdf', '.jpg', '.jpeg', '.png'];
        const nomeArquivo = file.name.toLowerCase();
        const extensaoValida = extensoesPermitidas.some(ext => nomeArquivo.endsWith(ext));
        
        if (!extensaoValida) {
            Notifications.mostrarToast('❌ Formato não permitido! Use PDF, JPG ou PNG.', 'error');
            this.value = '';
            DOM.fileInfo.style.display = 'none';
            return;
        }
        
        // Mostra info do arquivo
        const tamanhoMB = (file.size / (1024 * 1024)).toFixed(2);
        DOM.fileInfo.style.display = 'flex';
        DOM.fileInfo.innerHTML = `
            <i class="fas fa-file"></i>
            <span>${Utils.escapeHtml(file.name)}</span>
            <span style="margin-left: auto; color: #64748b;">${tamanhoMB} MB</span>
        `;
    }
    
    static async upload(file, nome) {
        try {
            const base64 = await Utils.fileToBase64(file);
            const base64Puro = base64.split(',')[1] || base64;
            
            const agora = new Date();
            const timestamp = agora.getFullYear() +
                String(agora.getMonth() + 1).padStart(2, '0') +
                String(agora.getDate()).padStart(2, '0') + '_' +
                String(agora.getHours()).padStart(2, '0') +
                String(agora.getMinutes()).padStart(2, '0') +
                String(agora.getSeconds()).padStart(2, '0');
            
            const nomeFormatado = (nome || 'PESSOA').replace(/\s+/g, '_').toUpperCase().replace(/[^A-Z0-9_]/g, '');
            const extensao = file.name.split('.').pop().toLowerCase();
            const nomeArquivo = `${timestamp}_${nomeFormatado}.${extensao}`;
            
            const formData = new FormData();
            formData.append('data', base64Puro);
            formData.append('name', nomeArquivo);
            formData.append('mime', file.type);
            formData.append('folderId', PASTAS_DRIVE.ATESTADOS);
            
            console.log('📤 Enviando arquivo:', nomeArquivo);
            
            const response = await fetch(API_UPLOAD_URL, {
                method: 'POST',
                body: formData
            });
            
            const resultado = await response.json();
            
            if (resultado.url || resultado.fileId) {
                const link = resultado.url || `https://drive.google.com/file/d/${resultado.fileId}/view`;
                return { success: true, link: link, nome: nomeArquivo };
            }
            
            console.warn('⚠️ Upload retornou sem URL, continuando sem arquivo');
            return { success: true, link: '', nome: '' };
            
        } catch (error) {
            console.error('❌ Erro no upload:', error);
            return { success: true, link: '', nome: '' };
        }
    }
}

// ============================================
// 10. OPERAÇÕES CRUD
// ============================================

class CrudOperations {
    
    // Registra novo atestado
    static async registrar() {
        const turma = DOM.selectTurma.value;
        const pessoa = DOM.selectAluno.value;
        const motivo = document.getElementById('motivo').value.trim();
        const observacoes = document.getElementById('observacoes').value.trim();
        const status = document.getElementById('status').value;
        const dataInicioVal = DOM.dataInicio.value;
        const dataFimVal = DOM.dataFim.value;
        
        // Validações
        if (!turma || !pessoa) {
            Notifications.mostrarToast('❌ Selecione a turma e a pessoa!', 'error');
            return;
        }
        
        if (!motivo) {
            Notifications.mostrarToast('❌ Informe o motivo da falta!', 'error');
            return;
        }
        
        if (!dataInicioVal || !dataFimVal) {
            Notifications.mostrarToast('❌ Selecione as datas!', 'error');
            return;
        }
        
        if (new Date(dataFimVal) < new Date(dataInicioVal)) {
            Notifications.mostrarToast('❌ A data fim não pode ser anterior à data início!', 'error');
            return;
        }
        
        const submitBtn = DOM.formAtestado.querySelector('button[type="submit"]');
        const originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
        submitBtn.disabled = true;
        
        Notifications.toggleLoading(true, 'Salvando justificativa...');
        
        try {
            let linkArquivo = '';
            let nomeArquivo = '';
            
            const arquivo = DOM.arquivoInput.files[0];
            if (arquivo) {
                const uploadResult = await FileManager.upload(arquivo, pessoa);
                linkArquivo = uploadResult.link || '';
                nomeArquivo = uploadResult.nome || '';
            }
            
            const novoRegistro = {
                Nome: pessoa,
                Turma: turma,
                Motivo: motivo,
                Observações: observacoes,
                Datainicio: dataInicioVal,
                Datafim: dataFimVal,
                Link: linkArquivo,
                Status: status,
                NomeArquivo: nomeArquivo,
                Tipo: turma === 'FUNCIONÁRIOS' ? 'Funcionário' : 'Aluno'
            };
            
            const response = await fetch(API_ATESTADOS_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'adicionar', dados: novoRegistro })
            });
            
            const resultado = await response.json();
            
            if (resultado.success) {
                Notifications.mostrarToast('✅ Justificativa registrada com sucesso!', 'success');
                Notifications.mostrarMensagemForm('✅ Justificativa registrada com sucesso!', 'success');
                
                CrudOperations.limparFormulario();
                
                // Muda para aba de consulta
                document.querySelector('[data-tab="consultar"]').click();
                
                await DataManager.carregarRegistros();
            } else {
                Notifications.mostrarToast(`❌ Erro ao salvar: ${resultado.error}`, 'error');
                Notifications.mostrarMensagemForm(`❌ Erro ao salvar: ${resultado.error}`, 'error');
            }
            
        } catch (error) {
            console.error('Erro:', error);
            Notifications.mostrarToast(`❌ Erro: ${error.message}`, 'error');
            Notifications.mostrarMensagemForm(`❌ Erro: ${error.message}`, 'error');
        } finally {
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
            Notifications.toggleLoading(false);
        }
    }
    
    // Limpa formulário
    static limparFormulario() {
        DOM.formAtestado.reset();
        const hoje = Utils.getHoje();
        DOM.dataInicio.value = hoje;
        DOM.dataFim.value = hoje;
        DOM.fileInfo.style.display = 'none';
        DOM.arquivoInput.value = '';
        const fileLabel = document.querySelector('.file-upload-label span');
        if (fileLabel) fileLabel.textContent = 'Clique ou arraste um arquivo';
        DOM.selectAluno.innerHTML = '<option value="">Selecione uma turma primeiro</option>';
        DOM.selectAluno.disabled = true;
        DOM.mensagemRegistro.innerHTML = '';
        DOM.mensagemRegistro.className = 'mensagem';
    }
    
    // Modal de edição
    static abrirModalEditar(linha) {
        linhaParaEditar = linha;
        const registro = registrosCompletos[linha - 2];
        
        if (!registro) {
            Notifications.mostrarToast('Registro não encontrado!', 'error');
            return;
        }
        
        document.getElementById('editLinha').value = linha;
        document.getElementById('editNome').value = registro.Nome || registro.nome || '';
        document.getElementById('editTurma').value = registro.Turma || registro.turma || '';
        document.getElementById('editMotivo').value = registro.Motivo || registro.motivo || '';
        document.getElementById('editObs').value = registro['Observações'] || registro.observacoes || '';
        document.getElementById('editDataInicio').value = Utils.converterDataParaISO(registro.Datainicio || registro.datainicio || '');
        document.getElementById('editDataFim').value = Utils.converterDataParaISO(registro.Datafim || registro.datafim || '');
        document.getElementById('editLink').value = registro.Link || registro.link || '';
        document.getElementById('editStatus').value = registro.Status || registro.status || 'Aprovado';
        
        DOM.modalEditar.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    static fecharModalEditar() {
        DOM.modalEditar.classList.remove('active');
        document.body.style.overflow = '';
        linhaParaEditar = null;
    }
    
    static async salvarEdicao() {
        if (!linhaParaEditar) return;
        
        const dados = {
            Nome: document.getElementById('editNome').value,
            Turma: document.getElementById('editTurma').value,
            Motivo: document.getElementById('editMotivo').value,
            Observações: document.getElementById('editObs').value,
            Datainicio: document.getElementById('editDataInicio').value,
            Datafim: document.getElementById('editDataFim').value,
            Link: document.getElementById('editLink').value,
            Status: document.getElementById('editStatus').value,
            NomeArquivo: ''
        };
        
        const btnSalvar = document.getElementById('btnSalvarEdicao');
        const originalHTML = btnSalvar.innerHTML;
        btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        btnSalvar.disabled = true;
        
        try {
            const response = await fetch(API_ATESTADOS_URL, {
                method: 'PUT',
                body: JSON.stringify({ linha: linhaParaEditar, dados: dados })
            });
            
            const resultado = await response.json();
            
            if (resultado.success) {
                Notifications.mostrarToast('✅ Registro atualizado com sucesso!', 'success');
                CrudOperations.fecharModalEditar();
                DataManager.carregarRegistros();
            } else {
                Notifications.mostrarToast(`❌ Erro: ${resultado.error}`, 'error');
            }
            
        } catch (error) {
            console.error('Erro:', error);
            Notifications.mostrarToast(`❌ Erro: ${error.message}`, 'error');
        } finally {
            btnSalvar.innerHTML = originalHTML;
            btnSalvar.disabled = false;
        }
    }
    
    // Modal de exclusão
    static abrirModalExcluir(linha, nome) {
        linhaParaExcluir = linha;
        document.getElementById('excluirNome').textContent = `Justificativa de: ${nome}`;
        DOM.modalExcluir.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    static fecharModalExcluir() {
        DOM.modalExcluir.classList.remove('active');
        document.body.style.overflow = '';
        linhaParaExcluir = null;
    }
    
    static async confirmarExclusao() {
        if (!linhaParaExcluir) return;
        
        const btnConfirmar = document.getElementById('btnConfirmarExclusao');
        const originalHTML = btnConfirmar.innerHTML;
        btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';
        btnConfirmar.disabled = true;
        
        try {
            const response = await fetch(API_ATESTADOS_URL, {
                method: 'DELETE',
                body: JSON.stringify({ linha: linhaParaExcluir })
            });
            
            const resultado = await response.json();
            
            if (resultado.success) {
                Notifications.mostrarToast('✅ Registro excluído com sucesso!', 'success');
                CrudOperations.fecharModalExcluir();
                DataManager.carregarRegistros();
            } else {
                Notifications.mostrarToast(`❌ Erro: ${resultado.error}`, 'error');
            }
            
        } catch (error) {
            console.error('Erro:', error);
            Notifications.mostrarToast(`❌ Erro: ${error.message}`, 'error');
        } finally {
            btnConfirmar.innerHTML = originalHTML;
            btnConfirmar.disabled = false;
        }
    }
}

// ============================================
// 11. IMPRESSÃO
// ============================================

class PrintManager {
    
    static imprimir() {
        const htmlImpressao = Renderer.gerarHTMLImpressao();
        
        // Cria um iframe temporário para impressão
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.title = 'Impressão de Atestados';
        
        document.body.appendChild(iframe);
        
        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <title>Registro de Atestados - Impressão</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: 'Inter', sans-serif; 
                        padding: 20px; 
                        color: #1e293b; 
                    }
                    .print-header { 
                        text-align: center; 
                        margin-bottom: 20px; 
                        padding-bottom: 15px; 
                        border-bottom: 3px solid #8b5cf6; 
                    }
                    .print-header h2 { 
                        color: #1e293b; 
                        font-size: 22px; 
                        margin-bottom: 5px; 
                    }
                    .print-header p { 
                        color: #64748b; 
                        margin: 3px 0; 
                        font-size: 13px; 
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        font-size: 11px; 
                        margin-top: 15px; 
                    }
                    th { 
                        background: #f1f5f9; 
                        color: #1e293b; 
                        font-weight: 700; 
                        text-align: left; 
                        padding: 8px 10px; 
                        border: 1px solid #cbd5e1; 
                    }
                    td { 
                        padding: 7px 10px; 
                        border: 1px solid #e2e8f0; 
                    }
                    tr:nth-child(even) { 
                        background: #f8fafc; 
                    }
                    @media print {
                        body { padding: 0; }
                        @page { margin: 1cm; }
                    }
                </style>
            </head>
            <body>
                ${htmlImpressao}
            </body>
            </html>
        `);
        iframeDoc.close();
        
        // Aguarda o iframe carregar antes de imprimir
        iframe.onload = function() {
            setTimeout(() => {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                
                // Remove o iframe após imprimir (ou cancelar)
                setTimeout(() => {
                    if (document.body.contains(iframe)) {
                        document.body.removeChild(iframe);
                    }
                }, 1000);
            }, 500);
        };
        
        Notifications.mostrarToast('🖨️ Preparando impressão...', 'info');
    }
}

// ============================================
// 12. CONFIGURAÇÃO DE DATAS
// ============================================

class DateConfig {
    
    static configurar() {
        const hoje = Utils.getHoje();
        
        // Define data atual nos campos
        if (DOM.dataInicio) DOM.dataInicio.value = hoje;
        if (DOM.dataFim) DOM.dataFim.value = hoje;
        
        // Data fim não pode ser anterior à data início
        DOM.dataInicio.addEventListener('change', () => {
            DOM.dataFim.min = DOM.dataInicio.value;
            if (DOM.dataFim.value < DOM.dataInicio.value) {
                DOM.dataFim.value = DOM.dataInicio.value;
            }
        });
        
        // No filtro, data fim não pode ser anterior à data início
        if (DOM.filtroDataInicio && DOM.filtroDataFim) {
            DOM.filtroDataInicio.addEventListener('change', () => {
                DOM.filtroDataFim.min = DOM.filtroDataInicio.value;
            });
            
            DOM.filtroDataFim.addEventListener('change', () => {
                DOM.filtroDataInicio.max = DOM.filtroDataFim.value;
            });
        }
    }
}

// ============================================
// 13. CONFIGURAÇÃO DE EVENTOS
// ============================================

class EventConfig {
    
    static configurar() {
        // Form submit
        if (DOM.formAtestado) {
            DOM.formAtestado.addEventListener('submit', (e) => {
                e.preventDefault();
                CrudOperations.registrar();
            });
        }
        
        // Botões principais
        if (DOM.btnLimpar) DOM.btnLimpar.addEventListener('click', CrudOperations.limparFormulario);
        if (DOM.btnAtualizar) DOM.btnAtualizar.addEventListener('click', DataManager.carregarRegistros);
        if (DOM.selectTurma) DOM.selectTurma.addEventListener('change', DataManager.carregarAlunosDaTurma);
        
        // Filtros
        if (DOM.filtroTurma) DOM.filtroTurma.addEventListener('change', DataManager.filtrarRegistros);
        if (DOM.filtroDataInicio) DOM.filtroDataInicio.addEventListener('change', DataManager.filtrarRegistros);
        if (DOM.filtroDataFim) DOM.filtroDataFim.addEventListener('change', DataManager.filtrarRegistros);
        if (DOM.filtroStatus) DOM.filtroStatus.addEventListener('change', DataManager.filtrarRegistros);
        
        // Botões de filtro rápido
        if (DOM.btnFiltroRapido7) DOM.btnFiltroRapido7.addEventListener('click', DataManager.filtroRapido7Dias);
        if (DOM.btnFiltroRapido30) DOM.btnFiltroRapido30.addEventListener('click', DataManager.filtroRapido30Dias);
        
        // Botões modais
        document.getElementById('btnSalvarEdicao')?.addEventListener('click', CrudOperations.salvarEdicao);
        document.getElementById('btnConfirmarExclusao')?.addEventListener('click', CrudOperations.confirmarExclusao);
        
        // Botão imprimir
        document.getElementById('btnImprimir')?.addEventListener('click', PrintManager.imprimir);
        
        // Fechar modais ao clicar fora
        if (DOM.modalEditar) {
            DOM.modalEditar.addEventListener('click', (e) => {
                if (e.target === DOM.modalEditar) CrudOperations.fecharModalEditar();
            });
        }
        if (DOM.modalExcluir) {
            DOM.modalExcluir.addEventListener('click', (e) => {
                if (e.target === DOM.modalExcluir) CrudOperations.fecharModalExcluir();
            });
        }
        
        // Tecla ESC para fechar modais
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (DOM.modalEditar.classList.contains('active')) CrudOperations.fecharModalEditar();
                if (DOM.modalExcluir.classList.contains('active')) CrudOperations.fecharModalExcluir();
            }
        });
    }
}

// ============================================
// 14. APLICAÇÃO PRINCIPAL
// ============================================

const App = {
    
    async init() {
        console.log('🚀 Sistema de Atestados v2.1 iniciado!');
        console.log('📅 Filtro de período: ATIVO');
        console.log('🖨️ Impressão: ATIVA');
        
        // Inicializa cache DOM
        DOM.init();
        
        // Configurações
        TabManager.configurar();
        DateConfig.configurar();
        FileManager.configurar();
        EventConfig.configurar();
        
        // Carrega dados
        DataManager.carregarTurmas();
        await DataManager.carregarRegistros();
        
        console.log('✅ Sistema pronto!');
        console.log('💡 Dica: Use os botões "7 dias" ou "30 dias" para filtrar por período rapidamente.');
    },
    
    // Métodos públicos (expostos globalmente)
    abrirModalEditar: CrudOperations.abrirModalEditar,
    abrirModalExcluir: CrudOperations.abrirModalExcluir,
    fecharModalEditar: CrudOperations.fecharModalEditar,
    fecharModalExcluir: CrudOperations.fecharModalExcluir,
    imprimir: PrintManager.imprimir
};

// Expor funções globalmente para os botões onclick
window.App = App;
window.abrirModalEditar = CrudOperations.abrirModalEditar;
window.abrirModalExcluir = CrudOperations.abrirModalExcluir;
window.closeModalEditar = CrudOperations.fecharModalEditar;
window.closeModalExcluir = CrudOperations.fecharModalExcluir;

// ============================================
// 15. INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => App.init());