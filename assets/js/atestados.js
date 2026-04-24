const TURMAS_IDS = {
    '1M': { nome: '1ª Série Matutino', id: '1Yhi51PoQYXkhzCH3Bo6W3NLSqeKnIXGaX7FgA3huMro' },
    '1V': { nome: '1ª Série Vespertino', id: '1jL-iasMF06dJY0FCkM3PIqX0jjq0AhzBP5G_PVfpW-U' },
    '2M': { nome: '2ª Série Matutino', id: '1_dfjTaMPI8Fou2AhL6j3caxTCqVwFonYQKaSDQe3pxc' },
    '2V': { nome: '2ª Série Vespertino', id: '1DW6tAkl_XoHnmu7_Iwatg3ve5FRmAME2CKyBjdsm1Mc' },
    '3M': { nome: '3ª Série Matutino', id: '1S9ujW_Ak8BInbwt5ebvxsGSSkUELnN5Ff0W1wOWYkgI' },
    '3V': { nome: '3ª Série Vespertino', id: '15hDH4Pv9wZmLxMIedgQt3Pos-BsWHjWbD544tl8oBd8' },
    'FUNC': { nome: 'FUNCIONÁRIOS', id: '1ypAr72q3K43OH_P7_fw57WCFiU3t1NpldKxOdMAI0eY' } // Mesmo ID da planilha principal
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

// Mapeamento COMPLETO - considera todas as variações possíveis
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

// ============== VARIÁVEIS GLOBAIS ==============
let registrosCompletos = [];
let estudantesCache = {};
let funcionariosCache = null; // Cache para funcionários
let linhaParaExcluir = null;
let linhaParaEditar = null;

// ============== ELEMENTOS DO DOM ==============
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const formAtestado = document.getElementById('formAtestado');
const selectTurma = document.getElementById('turma');
const selectAluno = document.getElementById('aluno');
const dataInicio = document.getElementById('dataInicio');
const dataFim = document.getElementById('dataFim');
const arquivoInput = document.getElementById('arquivo');
const fileInfo = document.getElementById('fileInfo');
const btnLimpar = document.getElementById('btnLimpar');
const mensagemRegistro = document.getElementById('mensagemRegistro');
const tbodyRegistros = document.getElementById('tbodyRegistros');
const btnAtualizar = document.getElementById('btnAtualizar');
const filtroTurma = document.getElementById('filtroTurma');
const filtroData = document.getElementById('filtroData');
const filtroStatus = document.getElementById('filtroStatus');

// Modais
const modalEditar = document.getElementById('modalEditar');
const modalExcluir = document.getElementById('modalExcluir');

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Sistema de Atestados iniciado!');
    
    configurarTabs();
    configurarDatas();
    carregarTurmas();
    configurarEventListeners();
    configurarFileUpload();
    carregarRegistros();
});

// ============================================
// CONFIGURAR TABS
// ============================================

function configurarTabs() {
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(`tab-${tabId}`).classList.add('active');
            
            if (tabId === 'consultar') {
                carregarRegistros();
            }
        });
    });
}

// ============================================
// CONFIGURAR DATAS
// ============================================

function configurarDatas() {
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];
    
    if (dataInicio) dataInicio.value = hojeStr;
    if (dataFim) dataFim.value = hojeStr;
    

    dataFim.min = hojeStr;
    
    dataInicio.addEventListener('change', () => {
        dataFim.min = dataInicio.value;
        if (dataFim.value < dataInicio.value) {
            dataFim.value = dataInicio.value;
        }
    });
}

// ============================================
// CONFIGURAR EVENT LISTENERS
// ============================================

function configurarEventListeners() {
    if (formAtestado) {
        formAtestado.addEventListener('submit', (e) => {
            e.preventDefault();
            registrarAtestado();
        });
    }
    
    if (btnLimpar) btnLimpar.addEventListener('click', limparFormulario);
    if (btnAtualizar) btnAtualizar.addEventListener('click', carregarRegistros);
    if (selectTurma) selectTurma.addEventListener('change', carregarAlunosDaTurma);
    
    if (filtroTurma) filtroTurma.addEventListener('change', filtrarRegistros);
    if (filtroData) filtroData.addEventListener('change', filtrarRegistros);
    if (filtroStatus) filtroStatus.addEventListener('change', filtrarRegistros);
    
    document.getElementById('btnSalvarEdicao')?.addEventListener('click', salvarEdicao);
    document.getElementById('btnConfirmarExclusao')?.addEventListener('click', confirmarExclusao);
    
    if (modalEditar) {
        modalEditar.addEventListener('click', (e) => {
            if (e.target === modalEditar) closeModalEditar();
        });
    }
    if (modalExcluir) {
        modalExcluir.addEventListener('click', (e) => {
            if (e.target === modalExcluir) closeModalExcluir();
        });
    }
}

// ============================================
// CONFIGURAR FILE UPLOAD
// ============================================

function configurarFileUpload() {
    if (!arquivoInput) return;
    
    arquivoInput.addEventListener('change', function() {
        const file = this.files[0];
        if (!file) {
            fileInfo.style.display = 'none';
            return;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            mostrarMensagem('❌ Arquivo excede o limite de 10MB!', 'error');
            this.value = '';
            fileInfo.style.display = 'none';
            return;
        }
        
        const extensoesPermitidas = ['.pdf', '.jpg', '.jpeg', '.png'];
        const nomeArquivo = file.name.toLowerCase();
        const extensaoValida = extensoesPermitidas.some(ext => nomeArquivo.endsWith(ext));
        
        if (!extensaoValida) {
            mostrarMensagem('❌ Formato não permitido! Use PDF, JPG ou PNG.', 'error');
            this.value = '';
            fileInfo.style.display = 'none';
            return;
        }
        
        const tamanhoMB = (file.size / (1024 * 1024)).toFixed(2);
        fileInfo.style.display = 'flex';
        fileInfo.innerHTML = `
            <i class="fas fa-file"></i>
            <span>${file.name}</span>
            <span style="margin-left: auto; color: #64748b;">${tamanhoMB} MB</span>
        `;
    });
    
    const fileLabel = document.querySelector('.file-upload-label span');
    if (fileLabel) {
        arquivoInput.addEventListener('change', function() {
            fileLabel.textContent = this.files[0] ? '🔄 Trocar arquivo' : 'Clique ou arraste um arquivo';
        });
    }
}

// ============================================
// CARREGAR TURMAS (AGORA COM FUNCIONÁRIOS)
// ============================================

function carregarTurmas() {
    const turmas = Object.values(TURMAS_NOMES).sort();
    
    if (selectTurma) {
        selectTurma.innerHTML = '<option value="">Selecione a turma</option>';
        
        // Adicionar turmas de alunos
        turmas.filter(t => t !== 'FUNCIONÁRIOS').forEach(turma => {
            const option = document.createElement('option');
            option.value = turma;
            option.textContent = turma;
            selectTurma.appendChild(option);
        });
        
        // Adicionar funcionários por último
        const optionFunc = document.createElement('option');
        optionFunc.value = 'FUNCIONÁRIOS';
        optionFunc.textContent = '👔 FUNCIONÁRIOS';
        optionFunc.style.fontWeight = 'bold';
        optionFunc.style.color = '#8b5cf6';
        selectTurma.appendChild(optionFunc);
    }
    
    if (filtroTurma) {
        filtroTurma.innerHTML = '<option value="Todas">Todas</option>';
        
        turmas.filter(t => t !== 'FUNCIONÁRIOS').forEach(turma => {
            const option = document.createElement('option');
            option.value = turma;
            option.textContent = turma;
            filtroTurma.appendChild(option);
        });
        
        // Adicionar funcionários no filtro também
        const optionFunc = document.createElement('option');
        optionFunc.value = 'FUNCIONÁRIOS';
        optionFunc.textContent = '👔 FUNCIONÁRIOS';
        filtroTurma.appendChild(optionFunc);
    }
}

// ============================================
// CARREGAR FUNCIONÁRIOS DA PLANILHA
// ============================================

async function carregarFuncionarios() {
    try {
        console.log('👔 Carregando funcionários...');
        
        // Usar a API de estudantes mas com um action especial para funcionários
        const response = await fetch(`${API_ESTUDANTES_URL}?action=getFuncionarios`);
        const resultado = await response.json();
        
        if (resultado.success && resultado.funcionarios) {
            funcionariosCache = resultado.funcionarios;
            console.log(`✅ ${funcionariosCache.length} funcionários carregados`);
            return funcionariosCache;
        }
        
        console.warn('⚠️ API não retornou funcionários, tentando método alternativo...');
        
        // Método alternativo: buscar diretamente da planilha
        const response2 = await fetch(`${API_URL}?action=getFuncionarios`);
        const resultado2 = await response2.json();
        
        if (resultado2.success && resultado2.funcionarios) {
            funcionariosCache = resultado2.funcionarios;
            return funcionariosCache;
        }
        
        return [];
        
    } catch (error) {
        console.error('❌ Erro ao carregar funcionários:', error);
        return [];
    }
}

// ============================================
// CARREGAR ALUNOS DA TURMA (MODIFICADO PARA FUNCIONÁRIOS)
// ============================================

async function carregarAlunosDaTurma() {
    const turmaSelecionada = selectTurma.value;
    
    if (!turmaSelecionada) {
        selectAluno.innerHTML = '<option value="">Selecione uma turma primeiro</option>';
        selectAluno.disabled = true;
        return;
    }
    
    // CASO ESPECIAL: FUNCIONÁRIOS
    if (turmaSelecionada === 'FUNCIONÁRIOS') {
        selectAluno.innerHTML = '<option value="">Carregando funcionários...</option>';
        selectAluno.disabled = true;
        
        const funcionarios = await carregarFuncionarios();
        
        if (funcionarios && funcionarios.length > 0) {
            selectAluno.innerHTML = '<option value="">Selecione o funcionário</option>';
            
            // Ordenar por nome
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
                selectAluno.appendChild(option);
            });
            
            selectAluno.disabled = false;
        } else {
            selectAluno.innerHTML = '<option value="">Nenhum funcionário encontrado</option>';
        }
        return;
    }
    
    // PARA ALUNOS (COMPORTAMENTO NORMAL)
    selectAluno.innerHTML = '<option value="">Carregando alunos...</option>';
    selectAluno.disabled = true;
    
    const codigoTurma = Object.keys(TURMAS_NOMES).find(key => TURMAS_NOMES[key] === turmaSelecionada);
    
    if (!codigoTurma || !TURMAS_IDS[codigoTurma]) {
        selectAluno.innerHTML = '<option value="">Erro ao carregar turma</option>';
        return;
    }
    
    const turmaInfo = TURMAS_IDS[codigoTurma];
    
    if (estudantesCache[codigoTurma]) {
        preencherSelectAlunos(estudantesCache[codigoTurma]);
        return;
    }
    
    try {
        const response = await fetch(`${API_ESTUDANTES_URL}?action=list&spreadsheetId=${turmaInfo.id}`);
        const resultado = await response.json();
        
        if (resultado.students) {
            estudantesCache[codigoTurma] = resultado.students.sort();
            preencherSelectAlunos(resultado.students);
        } else {
            selectAluno.innerHTML = '<option value="">Nenhum aluno encontrado</option>';
        }
        
    } catch (error) {
        console.error('Erro ao carregar alunos:', error);
        selectAluno.innerHTML = '<option value="">Erro ao carregar alunos</option>';
    }
}

function preencherSelectAlunos(alunos) {
    selectAluno.innerHTML = '<option value="">Selecione o aluno</option>';
    alunos.forEach(aluno => {
        const option = document.createElement('option');
        option.value = aluno;
        option.textContent = aluno;
        selectAluno.appendChild(option);
    });
    selectAluno.disabled = false;
}

// ============================================
// LIMPAR FORMULÁRIO
// ============================================

function limparFormulario() {
    formAtestado.reset();
    const hoje = new Date().toISOString().split('T')[0];
    dataInicio.value = hoje;
    dataFim.value = hoje;
    fileInfo.style.display = 'none';
    arquivoInput.value = '';
    const fileLabel = document.querySelector('.file-upload-label span');
    if (fileLabel) fileLabel.textContent = 'Clique ou arraste um arquivo';
    selectAluno.innerHTML = '<option value="">Selecione uma turma primeiro</option>';
    selectAluno.disabled = true;
    mensagemRegistro.innerHTML = '';
    mensagemRegistro.className = 'mensagem';
}

// ============================================
// UPLOAD DE ARQUIVO
// ============================================

async function uploadArquivoAtestado(file, nome) {
    try {
        const base64 = await fileToBase64(file);
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
        console.log('📨 Resposta do upload:', resultado);
        
        if (resultado.url || resultado.fileId) {
            const link = resultado.url || `https://drive.google.com/file/d/${resultado.fileId}/view`;
            return { success: true, link: link, nome: nomeArquivo };
        }
        
        console.warn('⚠️ Upload retornou erro, mas continuando sem arquivo');
        return { success: true, link: '', nome: '' };
        
    } catch (error) {
        console.error('❌ Erro no upload, continuando sem arquivo:', error);
        return { success: true, link: '', nome: '' };
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ============================================
// REGISTRAR ATESTADO (AGORA ACEITA FUNCIONÁRIOS)
// ============================================

async function registrarAtestado() {
    const turma = selectTurma.value;
    const pessoa = selectAluno.value; // Pode ser aluno ou funcionário
    const motivo = document.getElementById('motivo').value.trim();
    const observacoes = document.getElementById('observacoes').value.trim();
    const status = document.getElementById('status').value;
    const dataInicioVal = dataInicio.value;
    const dataFimVal = dataFim.value;
    
    if (!turma || !pessoa) {
        mostrarNotificacao('❌ Selecione a turma e a pessoa!', 'error');
        return;
    }
    
    if (!motivo) {
        mostrarNotificacao('❌ Informe o motivo da falta!', 'error');
        return;
    }
    
    if (!dataInicioVal || !dataFimVal) {
        mostrarNotificacao('❌ Selecione as datas!', 'error');
        return;
    }
    
    if (new Date(dataFimVal) < new Date(dataInicioVal)) {
        mostrarNotificacao('❌ A data fim não pode ser anterior à data início!', 'error');
        return;
    }
    
    const submitBtn = formAtestado.querySelector('button[type="submit"]');
    const originalHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
    submitBtn.disabled = true;
    
    try {
        let linkArquivo = '';
        let nomeArquivo = '';
        
        const arquivo = arquivoInput.files[0];
        if (arquivo) {
            const uploadResult = await uploadArquivoAtestado(arquivo, pessoa);
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
            Tipo: turma === 'FUNCIONÁRIOS' ? 'Funcionário' : 'Aluno' // Identificar o tipo
        };
        
        console.log('📤 Salvando registro:', novoRegistro);
        
        const response = await fetch(API_ATESTADOS_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'adicionar', dados: novoRegistro })
        });
        
        const resultado = await response.json();
        console.log('📨 Resposta do salvamento:', resultado);
        
        if (resultado.success) {
            mostrarNotificacao('✅ Justificativa registrada com sucesso!', 'success');
            mostrarMensagem('✅ Justificativa registrada com sucesso!', 'success');
            
            limparFormulario();
            
            document.querySelector('[data-tab="consultar"]').click();
            
            await carregarRegistros();
        } else {
            mostrarNotificacao(`❌ Erro ao salvar: ${resultado.error}`, 'error');
            mostrarMensagem(`❌ Erro ao salvar: ${resultado.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarNotificacao(`❌ Erro: ${error.message}`, 'error');
        mostrarMensagem(`❌ Erro: ${error.message}`, 'error');
    } finally {
        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;
    }
}

// ============================================
// CARREGAR REGISTROS
// ============================================

async function carregarRegistros() {
    if (!tbodyRegistros) return;
    
    tbodyRegistros.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Carregando registros...</td></tr>';
    
    try {
        const response = await fetch(API_ATESTADOS_URL);
        const resultado = await response.json();
        
        if (resultado.success) {
            registrosCompletos = resultado.data || [];
            console.log(`✅ ${registrosCompletos.length} registros carregados`);
            filtrarRegistros();
        } else {
            tbodyRegistros.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">❌ Erro ao carregar registros</td></tr>';
        }
        
    } catch (error) {
        console.error('❌ Erro na conexão:', error);
        tbodyRegistros.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">❌ Erro na conexão</td></tr>';
    }
}

// ============================================
// CONVERTER DATA (DD/MM/YYYY → YYYY-MM-DD)
// ============================================

function converterDataParaISO(dataString) {
    if (!dataString) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataString)) return dataString;
    if (dataString.includes('T')) return dataString.split('T')[0];
    
    const match = dataString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) return `${match[3]}-${match[2]}-${match[1]}`;
    
    return dataString;
}

// ============================================
// FILTRAR REGISTROS
// ============================================

function filtrarRegistros() {
    console.log('🔍 Filtrando registros...');
    console.log('📊 Total de registros:', registrosCompletos.length);
    
    let filtrados = [...registrosCompletos];
    
    const turmaFiltro = filtroTurma.value;
    console.log('🏫 Filtro Turma:', turmaFiltro);
    
    if (turmaFiltro && turmaFiltro !== 'Todas') {
        const filtroNormalizado = TURMAS_NORMALIZADAS[turmaFiltro] || turmaFiltro;
        
        filtrados = filtrados.filter(r => {
            let turmaRegistro = r.Turma || r.turma || r.TURMA || '';
            turmaRegistro = turmaRegistro.trim();
            const turmaNormalizada = TURMAS_NORMALIZADAS[turmaRegistro] || turmaRegistro;
            return turmaNormalizada === filtroNormalizado;
        });
        console.log('📊 Após filtro turma:', filtrados.length);
    }
    
    const dataFiltro = filtroData.value;
    console.log('📅 Filtro Data:', dataFiltro);
    
    if (dataFiltro) {
        filtrados = filtrados.filter(r => {
            let dataInicio = r.Datainicio || r.DATAINICIO || r.dataInicio || '';
            const dataISO = converterDataParaISO(dataInicio);
            return dataISO === dataFiltro;
        });
        console.log('📊 Após filtro data:', filtrados.length);
    }
    
    const statusFiltro = filtroStatus.value;
    console.log('🏷️ Filtro Status:', statusFiltro);
    
    if (statusFiltro && statusFiltro !== 'Todos') {
        filtrados = filtrados.filter(r => {
            let status = r.Status || r.STATUS || r.status || 'Pendente';
            status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
            return status === statusFiltro;
        });
        console.log('📊 Após filtro status:', filtrados.length);
    }
    
    filtrados.sort((a, b) => {
        const dataA = converterDataParaISO(a.Datainicio || a.DATAINICIO || '');
        const dataB = converterDataParaISO(b.Datainicio || b.DATAINICIO || '');
        return dataB.localeCompare(dataA);
    });
    
    console.log('✅ Filtrados:', filtrados.length);
    renderizarTabela(filtrados);
}

// ============================================
// RENDERIZAR TABELA
// ============================================

function renderizarTabela(registros) {
    if (!tbodyRegistros) return;
    
    if (registros.length === 0) {
        tbodyRegistros.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">📭 Nenhum registro encontrado</td></tr>';
        return;
    }
    
    let html = '';
    
    registros.forEach((registro) => {
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
            `<a href="${link}" target="_blank" title="${nomeArquivo || 'Ver arquivo'}" style="color: #8b5cf6; text-decoration: none;">
                <i class="fas fa-paperclip"></i> Ver
            </a>` : '—';
        
        // Adicionar ícone diferente para funcionários
        const iconeTipo = tipo === 'Funcionário' ? '👔' : '🎓';
        
        html += `
            <tr>
                <td style="font-weight: 500;">${iconeTipo} ${nome}</td>
                <td>${turma}</td>
                <td>${formatarData(dataInicio)}</td>
                <td>${formatarData(dataFim)}</td>
                <td title="${motivo.replace(/"/g, '&quot;')}">${motivoCurto}</td>
                <td>${arquivoHtml}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td class="acoes-cell">
                    <button class="btn-icon edit" onclick="abrirModalEditar(${linhaOriginal})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" onclick="abrirModalExcluir(${linhaOriginal}, '${nome.replace(/'/g, "\\'")}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbodyRegistros.innerHTML = html;
}

// ============================================
// FORMATAR DATA (exibição)
// ============================================

function formatarData(dataString) {
    if (!dataString) return '—';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataString)) return dataString;
    
    try {
        const data = new Date(dataString);
        if (isNaN(data.getTime())) return dataString;
        return data.toLocaleDateString('pt-BR');
    } catch {
        return dataString;
    }
}

// ============================================
// MODAL EDITAR
// ============================================

function abrirModalEditar(linha) {
    linhaParaEditar = linha;
    const registro = registrosCompletos[linha - 2];
    
    if (!registro) {
        mostrarNotificacao('Registro não encontrado!', 'error');
        return;
    }
    
    document.getElementById('editLinha').value = linha;
    document.getElementById('editNome').value = registro.Nome || registro.nome || '';
    document.getElementById('editTurma').value = registro.Turma || registro.turma || '';
    document.getElementById('editMotivo').value = registro.Motivo || registro.motivo || '';
    document.getElementById('editObs').value = registro['Observações'] || registro.observacoes || '';
    document.getElementById('editDataInicio').value = converterDataParaISO(registro.Datainicio || registro.datainicio || '');
    document.getElementById('editDataFim').value = converterDataParaISO(registro.Datafim || registro.datafim || '');
    document.getElementById('editLink').value = registro.Link || registro.link || '';
    document.getElementById('editStatus').value = registro.Status || registro.status || 'Aprovado';
    
    modalEditar.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModalEditar() {
    modalEditar.classList.remove('active');
    document.body.style.overflow = '';
    linhaParaEditar = null;
}

async function salvarEdicao() {
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
            mostrarNotificacao('✅ Registro atualizado com sucesso!', 'success');
            closeModalEditar();
            carregarRegistros();
        } else {
            mostrarNotificacao(`❌ Erro: ${resultado.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarNotificacao(`❌ Erro: ${error.message}`, 'error');
    } finally {
        btnSalvar.innerHTML = originalHTML;
        btnSalvar.disabled = false;
    }
}

// ============================================
// MODAL EXCLUIR
// ============================================

function abrirModalExcluir(linha, nome) {
    linhaParaExcluir = linha;
    document.getElementById('excluirNome').textContent = `Justificativa de: ${nome}`;
    modalExcluir.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModalExcluir() {
    modalExcluir.classList.remove('active');
    document.body.style.overflow = '';
    linhaParaExcluir = null;
}

async function confirmarExclusao() {
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
            mostrarNotificacao('✅ Registro excluído com sucesso!', 'success');
            closeModalExcluir();
            carregarRegistros();
        } else {
            mostrarNotificacao(`❌ Erro: ${resultado.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarNotificacao(`❌ Erro: ${error.message}`, 'error');
    } finally {
        btnConfirmar.innerHTML = originalHTML;
        btnConfirmar.disabled = false;
    }
}

// ============================================
// MOSTRAR MENSAGEM
// ============================================

function mostrarMensagem(texto, tipo) {
    if (!mensagemRegistro) return;
    
    mensagemRegistro.innerHTML = texto;
    mensagemRegistro.className = `mensagem ${tipo}`;
    
    setTimeout(() => {
        mensagemRegistro.innerHTML = '';
        mensagemRegistro.className = 'mensagem';
    }, 5000);
}

// ============================================
// NOTIFICAÇÃO TOAST
// ============================================

function mostrarNotificacao(mensagem, tipo = 'info') {
    const icone = tipo === 'success' ? 'check-circle' : 
                  tipo === 'error' ? 'exclamation-circle' : 'info-circle';
    const cor = tipo === 'success' ? '#10b981' : 
                tipo === 'error' ? '#ef4444' : '#8b5cf6';

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

// ============================================
// EXPOR FUNÇÕES GLOBAIS
// ============================================

window.abrirModalEditar = abrirModalEditar;
window.abrirModalExcluir = abrirModalExcluir;
window.closeModalEditar = closeModalEditar;
window.closeModalExcluir = closeModalExcluir;

// Adicionar animações
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
    
    .mensagem.success {
        background: #d1fae5;
        color: #065f46;
        border: 1px solid #10b981;
    }
    
    .mensagem.error {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #ef4444;
    }
`;
document.head.appendChild(style);

console.log('✅ atestados.js carregado!');