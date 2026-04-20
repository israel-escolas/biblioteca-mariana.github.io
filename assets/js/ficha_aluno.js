const TURMAS = {
    '1M': {
        nome: '1ª Série Matutino',
        id: '1Yhi51PoQYXkhzCH3Bo6W3NLSqeKnIXGaX7FgA3huMro'
    },
    '1V': {
        nome: '1ª Série Vespertino',
        id: '1jL-iasMF06dJY0FCkM3PIqX0jjq0AhzBP5G_PVfpW-U'
    },
    '2M': {
        nome: '2ª Série Matutino',
        id: '1_dfjTaMPI8Fou2AhL6j3caxTCqVwFonYQKaSDQe3pxc'
    },
    '2V': {
        nome: '2ª Série Vespertino',
        id: '1DW6tAkl_XoHnmu7_Iwatg3ve5FRmAME2CKyBjdsm1Mc'
    },
    '3M': {
        nome: '3ª Série Matutino',
        id: '1S9ujW_Ak8BInbwt5ebvxsGSSkUELnN5Ff0W1wOWYkgI'
    },
    '3V': {
        nome: '3ª Série Vespertino',
        id: '15hDH4Pv9wZmLxMIedgQt3Pos-BsWHjWbD544tl8oBd8'
    }
};

let currentTurma = null;
let currentSpreadsheetId = null;
let studentsList = [];
let currentStudent = null;

function converterLinksDrive(urlString) {
    if (!urlString || urlString.trim() === '') return [];
    
    const urls = urlString.split(',').map(url => url.trim()).filter(url => url !== '');
    const urlsConvertidas = [];
    
    urls.forEach(url => {
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        
        if (match) {
            const imageUrl = `https://lh3.googleusercontent.com/d/${match[1]}`;
            urlsConvertidas.push(imageUrl);
        }
        else if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp)/i) || 
                 url.includes('lh3.googleusercontent.com') ||
                 url.includes('drive.google.com/uc')) {
            urlsConvertidas.push(url);
        }
        else if (url.includes('drive.google.com')) {
            const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/) || 
                           url.match(/file\/d\/([a-zA-Z0-9_-]+)/);
            if (idMatch) {
                urlsConvertidas.push(`https://lh3.googleusercontent.com/d/${idMatch[1]}`);
            }
        }
    });
    
    return urlsConvertidas.length > 0 ? urlsConvertidas : [];
}

function ampliarImagem(url) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    if (modal && modalImg) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        modalImg.src = url;
        document.body.style.overflow = 'hidden';
    }
}

function fecharModalImagem() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        fecharModalImagem();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setupTurmaButtons();
});

function setupTurmaButtons() {
    const buttons = document.querySelectorAll('.turma-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const turmaKey = btn.dataset.turma;
            currentTurma = turmaKey;
            currentSpreadsheetId = TURMAS[turmaKey].id;
            
            document.getElementById('alunosSection').style.display = 'block';
            document.getElementById('studentCard').style.display = 'none';
            studentsList = [];
            loadStudentsList();
        });
    });
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchAluno');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            renderStudentsList(searchTerm);
        });
    }
    
    const closeBtn = document.getElementById('closeCard');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('studentCard').style.display = 'none';
            currentStudent = null;
        });
    }
}

function loadStudentsList() {
    if (!currentSpreadsheetId) return;
    
    const studentsListDiv = document.getElementById('studentsList');
    studentsListDiv.innerHTML = '<div class="loading-students"><div class="spinner-small"></div><p>Carregando lista de alunos...</p></div>';
    
    try {
        const url = `${API_URL_ALUNO}?action=list&spreadsheetId=${currentSpreadsheetId}&callback=handleStudentsList`;
        console.log('Tentando acessar:', url);
        
        const oldScript = document.getElementById('jsonp-script');
        if (oldScript) oldScript.remove();
        
        const script = document.createElement('script');
        script.id = 'jsonp-script';
        script.src = url;
        script.onerror = () => showError('Erro ao carregar lista de alunos');
        document.body.appendChild(script);
        
        setTimeout(() => {
            if (studentsList.length === 0) {
                showError('Tempo limite excedido. Verifique sua conexão.');
            }
        }, 30000);
        
    } catch (error) {
        console.error('Erro:', error);
        showError(error.message);
    }
}

function handleStudentsList(data) {
    console.log('Lista recebida:', data);
    
    if (data.error) {
        showError(data.error);
        return;
    }
    
    studentsList = data.students || [];
    renderStudentsList();
}

function showError(message) {
    const studentsListDiv = document.getElementById('studentsList');
    studentsListDiv.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Erro ao carregar lista</h3>
            <p>${message}</p>
            <button onclick="location.reload()" style="margin-top: 15px; padding: 8px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
                <i class="fas fa-sync-alt"></i> Tentar novamente
            </button>
        </div>
    `;
}

function renderStudentsList(searchTerm = '') {
    const studentsListDiv = document.getElementById('studentsList');
    
    let filtered = studentsList;
    if (searchTerm) {
        filtered = studentsList.filter(name => name.toLowerCase().includes(searchTerm));
    }
    
    if (filtered.length === 0) {
        studentsListDiv.innerHTML = `<div class="empty-state"><i class="fas fa-search"></i><h3>Nenhum aluno encontrado</h3></div>`;
        return;
    }
    
    const html = `
        <div class="students-grid-list">
            ${filtered.map(name => `
                <div class="student-item" data-student="${escapeHtml(name)}">
                    <i class="fas fa-user-graduate"></i>
                    <span class="student-item-name">${escapeHtml(name)}</span>
                    <i class="fas fa-chevron-right"></i>
                </div>
            `).join('')}
        </div>
    `;
    
    studentsListDiv.innerHTML = html;
    
    document.querySelectorAll('.student-item').forEach(item => {
        item.addEventListener('click', () => {
            const studentName = item.dataset.student;
            loadStudentData(studentName);
        });
    });
}

function loadStudentData(studentName) {
    const studentCard = document.getElementById('studentCard');
    const studentDataDiv = document.getElementById('studentData');
    const studentCardTitle = document.getElementById('studentCardTitle');
    const studentCardTurma = document.getElementById('studentCardTurma');
    
    studentCard.style.display = 'block';
    studentDataDiv.innerHTML = '<div class="loading-data"><div class="spinner-small"></div><p>Carregando dados do aluno...</p></div>';
    studentCardTitle.textContent = studentName;
    if (studentCardTurma) {
        studentCardTurma.innerHTML = `<i class="fas fa-users"></i> ${TURMAS[currentTurma].nome}`;
    }
    studentCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    try {
        const oldScript = document.getElementById('jsonp-student');
        if (oldScript) oldScript.remove();
        
        const url = `${API_URL_ALUNO}?action=get&spreadsheetId=${currentSpreadsheetId}&student=${encodeURIComponent(studentName)}&callback=handleStudentData`;
        console.log('Carregando dados do aluno:', url);
        
        const script = document.createElement('script');
        script.id = 'jsonp-student';
        script.src = url;
        script.onerror = () => {
            studentDataDiv.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Erro ao carregar dados</h3><p>Verifique sua conexão e tente novamente.</p></div>`;
        };
        document.body.appendChild(script);
        
    } catch (error) {
        console.error('Erro:', error);
        studentDataDiv.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Erro</h3><p>${error.message}</p></div>`;
    }
}

function handleStudentData(data) {
    console.log('Dados do aluno recebidos:', data);
    
    if (data.error) {
        document.getElementById('studentData').innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Erro</h3><p>${data.error}</p></div>`;
        return;
    }
    
    renderStudentData(data);
    currentStudent = data.nome;
}

function renderStudentData(data) {
    const studentDataDiv = document.getElementById('studentData');
    let html = '';
    
    function renderFieldWithCopy(label, value) {
        if (!value || value === '') return '';
        const valueId = `copy-${Date.now()}-${Math.random()}`;
        return `
            <div class="field">
                <span class="field-label">${escapeHtml(label)}:</span>
                <div class="field-value-wrapper">
                    <span class="field-value" id="${valueId}">${escapeHtml(value.toString())}</span>
                    <button class="copy-btn" onclick="copyToClipboard('${valueId}', this)" title="Copiar">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    if (data.foto && data.foto !== "") {
        const fotos = converterLinksDrive(data.foto);
        const fotoUrl = fotos.length > 0 ? fotos[0] : "";
        
        if (fotoUrl) {
            html += `
                <div style="display: flex; justify-content: center; margin-bottom: 20px;">
                    <img src="${escapeHtml(fotoUrl)}" alt="Foto do aluno" class="foto-aluno" onclick="ampliarImagem('${escapeHtml(fotoUrl)}')">
                </div>
            `;
        }
    }
    
    const dadosPessoais = {
        'Nome Civil': data.nomeCivil,
        'Nome Social': data.nomeSocial,
        'Data de Nascimento': data.dataNascimento,
        'CPF': data.cpf,
        'Sexo': data.sexo,
        'Tipo de Gênero': data.tipoGenero,
        'Estado Civil': data.estadoCivil,
        'Tipo Sanguíneo': data.tipoSanguineo,
        'Raça/Cor': data.racaCor,
        'Turma': data.turma,
        'Turno': data.turno,
        'Matrícula': data.matricula,
        'NIS': data.nis,
        'SUS': data.sus,
        'INEP': data.inep,
        'Situação': data.situacao,
        'Email': data.email,
        'Email Institucional': data.emailInstitucional,
        'Endereço': data.endereco
    };
    
    let dadosPessoaisHtml = '';
    for (const [label, value] of Object.entries(dadosPessoais)) {
        if (value && value !== '') {
            dadosPessoaisHtml += renderFieldWithCopy(label, value);
        }
    }
    
    if (dadosPessoaisHtml) {
        html += `<div class="section"><div class="section-title"><i class="fas fa-user"></i><span>DADOS PESSOAIS</span></div><div class="fields-grid">${dadosPessoaisHtml}</div></div>`;
    }
    
    let filiacaoHtml = '';
    if (data.pai) filiacaoHtml += renderFieldWithCopy('Pai', data.pai);
    if (data.telefonePai) filiacaoHtml += renderFieldWithCopy('Tel. Pai', data.telefonePai);
    if (data.profissaoPai) filiacaoHtml += renderFieldWithCopy('Profissão Pai', data.profissaoPai);
    if (data.mae) filiacaoHtml += renderFieldWithCopy('Mãe', data.mae);
    if (data.telefoneMae) filiacaoHtml += renderFieldWithCopy('Tel. Mãe', data.telefoneMae);
    if (data.profissaoMae) filiacaoHtml += renderFieldWithCopy('Profissão Mãe', data.profissaoMae);
    if (data.responsavel) filiacaoHtml += renderFieldWithCopy('Responsável', data.responsavel);
    if (data.cpfResponsavel) filiacaoHtml += renderFieldWithCopy('CPF Responsável', data.cpfResponsavel);
    if (data.outro) filiacaoHtml += renderFieldWithCopy('Outro', data.outro);
    if (data.telefoneOutro) filiacaoHtml += renderFieldWithCopy('Tel. Outro', data.telefoneOutro);
    if (data.profissaoOutro) filiacaoHtml += renderFieldWithCopy('Profissão Outro', data.profissaoOutro);
    
    if (filiacaoHtml) {
        html += `<div class="section"><div class="section-title"><i class="fas fa-users"></i><span>FILIAÇÃO</span></div><div class="fields-grid">${filiacaoHtml}</div></div>`;
    }

    let certidaoHtml = '';
    if (data.modeloCertidao) certidaoHtml += renderFieldWithCopy('Modelo Novo', data.modeloCertidao);
    if (data.tipoCertidao) certidaoHtml += renderFieldWithCopy('Tipo', data.tipoCertidao);
    if (data.numeroTermo) certidaoHtml += renderFieldWithCopy('Número do Termo', data.numeroTermo);
    if (data.dataEmissaoCertidao) certidaoHtml += renderFieldWithCopy('Data de Emissão', data.dataEmissaoCertidao);
    if (data.folha) certidaoHtml += renderFieldWithCopy('Folha', data.folha);
    if (data.livro) certidaoHtml += renderFieldWithCopy('Livro', data.livro);
    if (data.ufCertidao) certidaoHtml += renderFieldWithCopy('UF', data.ufCertidao);
    if (data.municipioCertidao) certidaoHtml += renderFieldWithCopy('Município', data.municipioCertidao);
    if (data.cartorio) certidaoHtml += renderFieldWithCopy('Cartório', data.cartorio);
    
    if (certidaoHtml) {
        html += `<div class="section"><div class="section-title"><i class="fas fa-file-alt"></i><span>CERTIDÃO CÍVIL</span></div><div class="fields-grid">${certidaoHtml}</div></div>`;
    }
    
    let documentacaoHtml = '';
    if (data.rg) documentacaoHtml += renderFieldWithCopy('RG', data.rg);
    if (data.orgaoExpedicao) documentacaoHtml += renderFieldWithCopy('Órgão Expedidor', data.orgaoExpedicao);
    if (data.dataExpedicaoRG) documentacaoHtml += renderFieldWithCopy('Data Expedição', data.dataExpedicaoRG);
    if (data.tituloEleitor) documentacaoHtml += renderFieldWithCopy('Título de Eleitor', data.tituloEleitor);
    if (data.secao) documentacaoHtml += renderFieldWithCopy('Seção', data.secao);
    if (data.zona) documentacaoHtml += renderFieldWithCopy('Zona', data.zona);
    if (data.certificadoMilitar) documentacaoHtml += renderFieldWithCopy('Certificado Militar', data.certificadoMilitar);
    if (data.serieMilitar) documentacaoHtml += renderFieldWithCopy('Série', data.serieMilitar);
    if (data.categoriaMilitar) documentacaoHtml += renderFieldWithCopy('Categoria', data.categoriaMilitar);
    if (data.orgaoMilitar) documentacaoHtml += renderFieldWithCopy('Órgão', data.orgaoMilitar);
    if (data.ufTitulo) documentacaoHtml += renderFieldWithCopy('UF Título', data.ufTitulo);
    
    if (documentacaoHtml) {
        html += `<div class="section"><div class="section-title"><i class="fas fa-id-card"></i><span>DOCUMENTAÇÃO COMPLEMENTAR</span></div><div class="fields-grid">${documentacaoHtml}</div></div>`;
    }
    
    let naturalidadeHtml = '';
    if (data.pais) naturalidadeHtml += renderFieldWithCopy('País', data.pais);
    if (data.nacionalidade) naturalidadeHtml += renderFieldWithCopy('Nacionalidade', data.nacionalidade);
    if (data.ufNaturalidade) naturalidadeHtml += renderFieldWithCopy('UF', data.ufNaturalidade);
    if (data.municipioNaturalidade) naturalidadeHtml += renderFieldWithCopy('Município', data.municipioNaturalidade);
    
    if (naturalidadeHtml) {
        html += `<div class="section"><div class="section-title"><i class="fas fa-globe"></i><span>NATURALIDADE</span></div><div class="fields-grid">${naturalidadeHtml}</div></div>`;
    }
    
    let contatoHtml = '';
    if (data.cep) contatoHtml += renderFieldWithCopy('CEP', data.cep);
    if (data.logradouro) contatoHtml += renderFieldWithCopy('Logradouro', data.logradouro);
    if (data.numeroEndereco) contatoHtml += renderFieldWithCopy('Número', data.numeroEndereco);
    if (data.complemento) contatoHtml += renderFieldWithCopy('Complemento', data.complemento);
    if (data.bairro) contatoHtml += renderFieldWithCopy('Bairro', data.bairro);
    if (data.distrito) contatoHtml += renderFieldWithCopy('Distrito', data.distrito);
    if (data.municipioContato) contatoHtml += renderFieldWithCopy('Município', data.municipioContato);
    if (data.ufContato) contatoHtml += renderFieldWithCopy('UF', data.ufContato);
    if (data.localizacaoDiferenciada) contatoHtml += renderFieldWithCopy('Localização Diferenciada', data.localizacaoDiferenciada);
    if (data.tipoZona) contatoHtml += renderFieldWithCopy('Tipo de Zona', data.tipoZona);
    if (data.telefoneFixo) contatoHtml += renderFieldWithCopy('Telefone Fixo', data.telefoneFixo);
    if (data.telefoneCelular) contatoHtml += renderFieldWithCopy('Telefone Celular', data.telefoneCelular);
    
    if (contatoHtml) {
        html += `<div class="section"><div class="section-title"><i class="fas fa-address-book"></i><span>INFORMAÇÕES PARA CONTATO</span></div><div class="fields-grid">${contatoHtml}</div></div>`;
    }
    
    let cadunicoHtml = '';
    if (data.nisCadUnico) cadunicoHtml += renderFieldWithCopy('NIS', data.nisCadUnico);
    if (data.nomeCadUnico) cadunicoHtml += renderFieldWithCopy('Nome', data.nomeCadUnico);
    if (data.sexoCadUnico) cadunicoHtml += renderFieldWithCopy('Sexo', data.sexoCadUnico);
    if (data.parentesco) cadunicoHtml += renderFieldWithCopy('Parentesco', data.parentesco);
    if (data.codigoFamiliar) cadunicoHtml += renderFieldWithCopy('Código Familiar', data.codigoFamiliar);
    if (data.dataNascimentoCadUnico) cadunicoHtml += renderFieldWithCopy('Data de Nascimento', data.dataNascimentoCadUnico);
    if (data.nisResponsavel) cadunicoHtml += renderFieldWithCopy('NIS Responsável', data.nisResponsavel);
    if (data.bolsaFamilia) cadunicoHtml += renderFieldWithCopy('Bolsa Família', data.bolsaFamilia);
    
    if (cadunicoHtml) {
        html += `<div class="section"><div class="section-title"><i class="fas fa-hand-holding-heart"></i><span>INFORMAÇÕES CADÚNICO</span></div><div class="fields-grid">${cadunicoHtml}</div></div>`;
    }
    
    let outrasInfoHtml = '';
    if (data.idInep) outrasInfoHtml += renderFieldWithCopy('ID INEP Estudante', data.idInep);
    if (data.cartaoSus) outrasInfoHtml += renderFieldWithCopy('Nº do Cartão SUS', data.cartaoSus);
    if (data.matriculaSgp) outrasInfoHtml += renderFieldWithCopy('Matrícula SGP', data.matriculaSgp);
    if (data.peDeMeia) outrasInfoHtml += renderFieldWithCopy('Participa Pé de Meia', data.peDeMeia);
    
    if (outrasInfoHtml) {
        html += `<div class="section"><div class="section-title"><i class="fas fa-info-circle"></i><span>OUTRAS INFORMAÇÕES</span></div><div class="fields-grid">${outrasInfoHtml}</div></div>`;
    }
    
    if (data.documentos && data.documentos.length > 0) {
        let documentosHtml = '';
        data.documentos.forEach(doc => {
            if (doc.link) {
                documentosHtml += `
                    <div class="field">
                        <span class="field-label">✓</span>
                        <div class="field-value-wrapper">
                            <span class="field-value"><a href="${escapeHtml(doc.link)}" target="_blank" style="color: #667eea; text-decoration: none;">${escapeHtml(doc.nome)} <i class="fas fa-external-link-alt" style="font-size: 11px;"></i></a></span>
                        </div>
                    </div>
                `;
            } else {
                documentosHtml += `
                    <div class="field">
                        <span class="field-label">✓</span>
                        <div class="field-value-wrapper">
                            <span class="field-value">${escapeHtml(doc)}</span>
                        </div>
                    </div>
                `;
            }
        });
        if (documentosHtml) {
            html += `<div class="section"><div class="section-title"><i class="fas fa-folder-open"></i><span>DOCUMENTOS ENTREGUES</span></div><div class="fields-grid">${documentosHtml}</div></div>`;
        }
    }
    
    const socioeconomico = {
        'Religião': data.religiao,
        'Tipo de Residência': data.tipoResidencia,
        'Situação de Moradia': data.situacaoMoradia,
        'Nº Pessoas na Família': data.numeroPessoasFamilia,
        'Pessoas que residem com você': data.pessoasResidencia,
        'Chefe da Família': data.chefeFamilia,
        'Meio de Transporte': data.transporte,
        'Grau de Instrução do Pai': data.instrucaoPai,
        'Grau de Instrução da Mãe': data.instrucaoMae,
        'Ocupação do Pai': data.ocupacaoPai,
        'Ocupação da Mãe': data.ocupacaoMae,
        'Renda Mensal': data.rendaMensal,
        'Estudava nesta escola antes?': data.escolaAnterior,
        'Livros que mais lê': data.livros,
        'Acesso à Internet': data.acessoInternet,
        'Trabalha?': data.trabalha,
        'Tipo de Trabalho': data.tipoTrabalho,
        'Tempo de Trabalho': data.tempoTrabalho,
        'Frequência às Aulas': data.frequenciaAulas,
        'Significado da Escola': data.significadoEscola
    };
    
    let socioeconomicoHtml = '';
    for (const [label, value] of Object.entries(socioeconomico)) {
        if (value && value !== '') {
            socioeconomicoHtml += `
                <div class="field">
                    <span class="field-label">${escapeHtml(label)}:</span>
                    <div class="field-value-wrapper">
                        <span class="field-value">${escapeHtml(value.toString())}</span>
                    </div>
                </div>
            `;
        }
    }
    
    if (socioeconomicoHtml) {
        html += `<div class="section"><div class="section-title"><i class="fas fa-chart-pie"></i><span>QUESTIONÁRIO SÓCIO ECONÔMICO</span></div><div class="fields-grid">${socioeconomicoHtml}</div></div>`;
    }
    
    if (data.ocorrencias && data.ocorrencias.length > 0) {
        let ocorrenciasHtml = '';
        data.ocorrencias.forEach((oc, index) => {
            ocorrenciasHtml += `
                <div style="display: flex; gap: 10px; margin-bottom: 12px; padding: 8px; border-bottom: 1px solid #fde68a; align-items: flex-start;">
                    <div style="font-weight: bold; color: #92400e; min-width: 60px;">${String(index + 1).padStart(2, '0')}.</div>
                    <div class="field-value-wrapper" style="flex: 1;">
                        <span style="color: #78350f;">${escapeHtml(oc)}</span>
                        <button class="copy-btn" onclick="copyToClipboardText('${escapeHtml(oc)}', this)" title="Copiar">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        if (ocorrenciasHtml) {
            html += `
                <div class="section">
                    <div class="section-title">
                        <i class="fas fa-book-open"></i>
                        <span>REGISTRO DE OCORRÊNCIAS</span>
                    </div>
                    <div style="background: #fef3c7; border-radius: 8px; padding: 12px;">
                        ${ocorrenciasHtml}
                    </div>
                </div>
            `;
        }
    }
    
    if (html === '') {
        html = `<div class="empty-state"><i class="fas fa-inbox"></i><h3>Nenhum dado encontrado</h3><p>Esta ficha de aluno está vazia</p></div>`;
    }
    
    studentDataDiv.innerHTML = html;
}

window.copyToClipboard = function(elementId, button) {
    const element = document.getElementById(elementId);
    if (element) {
        const text = element.innerText;
        copyToClipboardText(text, button);
    }
}

window.copyToClipboardText = function(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.classList.add('copied');
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.classList.remove('copied');
        }, 1500);
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.classList.add('copied');
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.classList.remove('copied');
        }, 1500);
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}