const TURMAS_PROFESSORES = {
    'PROFESSORES': {
        nome: 'Corpo Docente',
        id: '1F3sXXwsm2NB6dgUc6pcUI4wlIO5Nc_KQmwjE2ekJOaU'
    }
};

let currentSpreadsheetIdProfessores = null;
let teachersList = [];
let currentTeacher = null;

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function converterLinksDrive(urlString) {
    if (!urlString || !urlString.trim()) return [];
    
    const urls = urlString.split(',').map(u => u.trim()).filter(Boolean);
    const urlsConvertidas = [];
    
    urls.forEach(url => {
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match) {
            urlsConvertidas.push(`https://lh3.googleusercontent.com/d/${match[1]}`);
        } else if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp)/i) || 
                   url.includes('lh3.googleusercontent.com') ||
                   url.includes('drive.google.com/uc')) {
            urlsConvertidas.push(url);
        } else if (url.includes('drive.google.com')) {
            const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/) || 
                           url.match(/file\/d\/([a-zA-Z0-9_-]+)/);
            if (idMatch) {
                urlsConvertidas.push(`https://lh3.googleusercontent.com/d/${idMatch[1]}`);
            }
        }
    });
    
    return urlsConvertidas;
}

function detectarNivelFormacao(curso, origem = 'graduacao') {
    const nome = (curso || '').toLowerCase();

    if (origem === 'pos-graduacao') {
        if (nome.includes('doutorado') || nome.includes('phd') || nome.includes('ph.d')) return 'doutorado';
        if (nome.includes('mestrado') || nome.includes('master')) return 'mestrado';
        return 'pos-graduacao';
    }

    if (nome.includes('doutorado') || nome.includes('phd') || nome.includes('ph.d')) return 'doutorado';
    if (nome.includes('mestrado') || nome.includes('master')) return 'mestrado';
    if (nome.includes('pós') || nome.includes('pos') || nome.includes('especialização') || 
        nome.includes('especializacao') || nome.includes('mba') || 
        nome.includes('lato') || nome.includes('stricto') ||
        nome.includes('aperfeiçoamento') || nome.includes('aperfeicoamento')) return 'pos-graduacao';
    return 'graduacao';
}

function getNivelLabel(nivel) {
    const map = {
        'graduacao': 'Graduação',
        'pos-graduacao': 'Pós-Graduação.',
        'mestrado': 'Mestrado',
        'doutorado': 'Doutorado'
    };
    return map[nivel] || 'Formação';
}

function ampliarImagem(url) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    if (modal && modalImg && url) {
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
document.addEventListener('DOMContentLoaded', () => {
    setupSearchListener();
    loadTeachersList();
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') fecharModalImagem();
});

document.addEventListener('click', e => {
    if (e.target === document.getElementById('imageModal')) {
        fecharModalImagem();
    }
    
    const header = e.target.closest('.section-header');
    if (!header) return;
    if (e.target.closest('.copy-btn')) return;
    
    const section = header.closest('.teacher-section');
    if (section && section.closest('#teacherData')) {
        section.classList.toggle('open');
    }
});

function setupSearchListener() {
    const input = document.getElementById('searchProfessor');
    if (input) {
        input.addEventListener('input', e => {
            renderTeachersSidebar(e.target.value.toLowerCase());
        });
    }
}

function loadTeachersList() {
    currentSpreadsheetIdProfessores = TURMAS_PROFESSORES['PROFESSORES'].id;
    
    const sidebarList = document.getElementById('teachersSidebarList');
    if (!sidebarList) return;

    sidebarList.innerHTML = `
        <div class="sidebar-loading">
            <div class="spinner-small"></div>
            <span>Carregando professores...</span>
        </div>`;

    const oldScript = document.getElementById('jsonp-teachers-list');
    if (oldScript) oldScript.remove();

    const script = document.createElement('script');
    script.id = 'jsonp-teachers-list';
    script.src = `${API_PROFESSORES_URL}?action=listTeachers&spreadsheetId=${currentSpreadsheetIdProfessores}&callback=handleTeachersList`;
    script.onerror = () => showSidebarError('Erro ao carregar lista de professores');
    document.body.appendChild(script);

    setTimeout(() => {
        if (teachersList.length === 0 && sidebarList.querySelector('.sidebar-loading')) {
            showSidebarError('Tempo limite excedido. Verifique sua conexão.');
        }
    }, 30000);
}

function handleTeachersList(data) {
    console.log('✅ Lista de professores recebida:', data);
    
    if (data.error) {
        showSidebarError(data.error);
        return;
    }
    
    teachersList = data.teachers || [];
    
    const countEl = document.getElementById('teacherCount');
    if (countEl) {
        const total = teachersList.length;
        countEl.textContent = `${total} professor${total !== 1 ? 'es' : ''}`;
    }
    
    renderTeachersSidebar();
    
    if (teachersList.length === 1) {
        selectTeacher(teachersList[0]);
    }
}

function showSidebarError(message) {
    const sidebarList = document.getElementById('teachersSidebarList');
    if (!sidebarList) return;
    
    sidebarList.innerHTML = `
        <div class="sidebar-empty">
            <i class="fas fa-exclamation-triangle" style="font-size: 24px; color: #f59e0b; margin-bottom: 10px; display: block;"></i>
            <span>${escapeHtml(message)}</span>
            <button onclick="loadTeachersList()" style="margin-top: 12px; padding: 8px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500;">
                <i class="fas fa-sync-alt"></i> Tentar novamente
            </button>
        </div>
    `;
}

function renderTeachersSidebar(searchTerm = '') {
    const sidebarList = document.getElementById('teachersSidebarList');
    if (!sidebarList) return;
    
    let filtered = teachersList;
    if (searchTerm) {
        filtered = teachersList.filter(name => 
            name.toLowerCase().includes(searchTerm)
        );
    }
    
    if (filtered.length === 0) {
        sidebarList.innerHTML = `
            <div class="sidebar-empty">
                <i class="fas fa-user-tie" style="font-size: 28px; color: #94a3b8; margin-bottom: 10px; display: block;"></i>
                <span>${searchTerm ? 'Nenhum professor encontrado' : 'Nenhum professor cadastrado'}</span>
            </div>
        `;
        return;
    }
    
    const html = filtered.map(name => {
        const inicial = name.charAt(0).toUpperCase();
        const safeName = escapeHtml(name).replace(/'/g, "\\'");
        return `
            <div class="teacher-nav-item" data-teacher="${escapeHtml(name)}" onclick="selectTeacher('${safeName}')">
                <div class="teacher-nav-avatar">${inicial}</div>
                <div class="teacher-nav-info">
                    <div class="teacher-nav-name">${escapeHtml(name)}</div>
                    <div class="teacher-nav-discipline">Professor(a)</div>
                </div>
            </div>
        `;
    }).join('');
    
    sidebarList.innerHTML = html;
}

function selectTeacher(teacherName) {
    document.querySelectorAll('.teacher-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.teacher === teacherName) {
            item.classList.add('active');
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
    
    const welcomeState = document.getElementById('welcomeState');
    const teacherProfile = document.getElementById('teacherProfile');
    
    if (welcomeState) welcomeState.style.display = 'none';
    if (teacherProfile) {
        teacherProfile.style.display = 'block';
        teacherProfile.style.animation = 'none';
        teacherProfile.offsetHeight;
        teacherProfile.style.animation = 'fadeSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    }
    
    const professorContent = document.getElementById('professorContent');
    if (professorContent) {
        professorContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    loadTeacherData(teacherName);
}

function loadTeacherData(teacherName) {
    const teacherDataDiv = document.getElementById('teacherData');
    if (!teacherDataDiv) return;
    
    teacherDataDiv.innerHTML = `
        <div class="loading-state">
            <div class="spinner-small"></div>
            <p>Carregando dados do professor...</p>
        </div>
    `;
    
    const nameEl = document.getElementById('profileName');
    if (nameEl) nameEl.textContent = teacherName;
    
    const oldScript = document.getElementById('jsonp-teacher-data');
    if (oldScript) oldScript.remove();
    
    const script = document.createElement('script');
    script.id = 'jsonp-teacher-data';
    script.src = `${API_PROFESSORES_URL}?action=getTeacher&spreadsheetId=${currentSpreadsheetIdProfessores}&teacher=${encodeURIComponent(teacherName)}&callback=handleTeacherData`;
    script.onerror = () => {
        teacherDataDiv.innerHTML = `
            <div class="loading-state" style="color: #ef4444;">
                <i class="fas fa-exclamation-triangle" style="font-size: 32px;"></i>
                <p>Erro ao carregar dados. Verifique sua conexão.</p>
            </div>
        `;
    };
    document.body.appendChild(script);
}

function handleTeacherData(data) {
    console.log('✅ Dados do professor recebidos:', data);
    
    const teacherDataDiv = document.getElementById('teacherData');
    if (!teacherDataDiv) return;
    
    if (data.error) {
        teacherDataDiv.innerHTML = `
            <div class="loading-state" style="color: #ef4444;">
                <i class="fas fa-exclamation-triangle" style="font-size: 32px;"></i>
                <p>${escapeHtml(data.error)}</p>
            </div>
        `;
        return;
    }
    
    renderTeacherData(data);
    currentTeacher = data.nome;
}

function renderTeacherData(data) {
    updateProfileHeader(data);
    
    const teacherDataDiv = document.getElementById('teacherData');
    if (!teacherDataDiv) return;
    
    const sections = [];

    sections.push(buildSection('DADOS PESSOAIS E FILIAÇÃO', 'fa-user-circle', {
        'Nome Completo': data.nome,
        'Data de Nascimento': data.dataNascimento,
        'Naturalidade': data.naturalidade,
        'Nacionalidade': data.nacionalidade,
        'Estado Civil': data.estadoCivil,
        'Cônjuge': data.conjuge,
        'Pai': data.pai,
        'Mãe': data.mae,
    }, true));

    sections.push(buildSection('DOCUMENTOS PESSOAIS', 'fa-id-card', {
        'CPF': data.cpf,
        'RG': data.rg,
        'Órgão Expedidor': data.orgaoExpedidor,
        'Emissão RG': data.emissaoRG,
        'Título de Eleitor': data.tituloEleitor,
        'Zona Eleitoral': data.zona,
        'Seção Eleitoral': data.secao,
        'PIS/PASEP': data.pisPasep,
        'Carteira de Reservista': data.carteiraReservista,
        'Carteira Profissional': data.carteiraProfissional,
        'Série CTPS': data.serie,
        'UF CTPS': data.uf,
        'Emissão CTPS': data.emissaoCTPS,
    }));
 
    sections.push(buildSection('ENDEREÇO E CONTATO', 'fa-map-marker-alt', {
        'Endereço': data.endereco,
        'Número': data.numero,
        'Bairro': data.bairro,
        'CEP': data.cep,
        'Cidade': data.cidade,
        'Telefone': data.contato,
        'E-mail': data.email,
    }));
 
    sections.push(buildSection('DADOS FUNCIONAIS', 'fa-briefcase', {
        'Matrícula': data.matricula,
        'Status': data.status,
        'Vínculo': data.vinculo,
        'Carga Horária': data.cargaHoraria ? data.cargaHoraria + 'h' : null,
        'Data de Admissão': data.dataAdmissao,
        'Cargo Atual': data.cargoAtual,
        'Função': data.funcao,
        'Segmento': data.segmento,
        'Disciplinas': data.disciplinas,
        'Curso de Formação': data.cursoFormacao,
        'Habilitação': data.habilitacao,
        'Local de Trabalho': data.localTrabalho,
        'Tempo de Serviço': data.tempoServico,
    }, true));

    sections.push(buildSection('DADOS BANCÁRIOS', 'fa-university', {
        'Conta Bancária': data.contaBancaria,
        'Agência': data.agencia,
        'Cidade da Agência': data.cidadeAgencia,
    }));

    const formacoes = [
        ...(data.graduacoes || []).filter(g => g.curso).map(g => ({ 
            ...g, 
            tipo: detectarNivelFormacao(g.curso, 'graduacao')
        })),
        ...(data.posGraduacoes || []).filter(g => g.curso).map(g => ({ 
            ...g, 
            tipo: detectarNivelFormacao(g.curso, 'pos-graduacao')
        })),
    ].sort((a, b) => {
        const ordem = { 'graduacao': 1, 'pos-graduacao': 2, 'mestrado': 3, 'doutorado': 4 };
        return (ordem[a.tipo] || 99) - (ordem[b.tipo] || 99);
    });
    
    if (formacoes.length > 0) {
        const formacaoHtml = `
            <div class="education-grid">
                ${formacoes.map(f => `
                    <div class="education-item">
                        <span class="education-level-pill ${f.tipo}">${getNivelLabel(f.tipo)}</span>
                        <div class="education-details">
                            <strong>${escapeHtml(f.curso)}</strong>
                            ${f.anoConclusao ? `<span class="education-year">${escapeHtml(f.anoConclusao)}</span>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        sections.push(buildSectionRaw('FORMAÇÃO ACADÊMICA', 'fa-graduation-cap', formacaoHtml, true));
    }

    if (data.documentos && data.documentos.length > 0) {
        const docsHtml = `
            <div class="documents-grid">
                ${data.documentos.map(doc => `
                    <a href="${escapeHtml(doc.link || '#')}" target="_blank" class="document-link"
                       ${!doc.link ? 'style="pointer-events: none; opacity: 0.5;"' : ''}>
                        <span class="doc-icon"><i class="fas fa-file-alt"></i></span>
                        <span>${escapeHtml(doc.nome)}</span>
                        ${doc.link ? '<i class="fas fa-external-link-alt"></i>' : '<span class="no-link">Sem link</span>'}
                    </a>
                `).join('')}
            </div>
        `;
        sections.push(buildSectionRaw('DOCUMENTOS ANEXADOS', 'fa-folder-open', docsHtml));
    }

    if (data.responsavelInformacoes) {
        const regHtml = `
            <div class="responsavel-wrap">
                <div class="info-field">
                    <span class="field-label">Registrado por:</span>
                    <div class="field-value-wrapper">
                        <span class="field-value">${escapeHtml(data.responsavelInformacoes)}</span>
                    </div>
                </div>
            </div>
        `;
        sections.push(buildSectionRaw('REGISTRO', 'fa-pen', regHtml));
    }
    
    const html = sections.filter(Boolean).join('');
    
    teacherDataDiv.innerHTML = html || `
        <div class="loading-state">
            <i class="fas fa-inbox" style="font-size: 36px; color: #94a3b8;"></i>
            <p>Ficha sem dados cadastrados.</p>
        </div>
    `;
}

function buildSection(title, icon, fields, open = false) {
    const rows = Object.entries(fields)
        .filter(([, v]) => v && v !== '')
        .map(([label, value]) => {
            const id = `f-${Math.random().toString(36).substr(2, 9)}`;
            return `
                <div class="info-field">
                    <span class="field-label">${escapeHtml(label)}</span>
                    <div class="field-value-wrapper">
                        <span class="field-value" id="${id}">${escapeHtml(value.toString())}</span>
                        <button class="copy-btn" onclick="event.stopPropagation(); copyToClipboard('${id}', this)" title="Copiar">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    
    if (!rows) return '';
    
    return buildSectionRaw(title, icon, `<div class="fields-container">${rows}</div>`, open);
}

function buildSectionRaw(title, icon, innerHtml, open = false) {
    if (!innerHtml) return '';
    
    return `
        <div class="teacher-section ${open ? 'open' : ''}">
            <div class="section-header">
                <div class="section-header-icon">
                    <i class="fas ${icon}"></i>
                </div>
                <span>${escapeHtml(title)}</span>
                <i class="fas fa-chevron-down accordion-arrow"></i>
            </div>
            <div class="section-content">${innerHtml}</div>
        </div>
    `;
}

function updateProfileHeader(data) {

    const nameEl = document.getElementById('profileName');
    if (nameEl) nameEl.textContent = data.nome || 'Professor';
    

    let titleEl = document.getElementById('profileTitle');
    if (!titleEl && nameEl) {
        titleEl = document.createElement('div');
        titleEl.id = 'profileTitle';
        titleEl.className = 'profile-title';
        nameEl.insertAdjacentElement('afterend', titleEl);
    }
    if (titleEl) {
        const parts = [data.cargoAtual, data.funcao !== data.cargoAtual ? data.funcao : null].filter(Boolean);
        titleEl.textContent = parts.join(' · ') || 'Professor(a)';
    }
    

    const statusEl = document.getElementById('profileStatus');
    const badgeEl = statusEl ? statusEl.closest('.profile-badge') : null;
    
    if (statusEl) {
        const status = data.status || 'Ativo';
        statusEl.textContent = status.toUpperCase();
        
        if (badgeEl) {
            badgeEl.className = 'profile-badge';
            const s = status.toLowerCase();
            if (s.includes('afastado') || s.includes('licença') || s.includes('licenca')) badgeEl.classList.add('afastado');
            else if (s.includes('inativo') || s.includes('aposentado') || s.includes('exonerado')) badgeEl.classList.add('inativo');
            else if (s.includes('substituto') || s.includes('temporário') || s.includes('temporario')) badgeEl.classList.add('substituto');
            else if (s.includes('atrasado')) badgeEl.classList.add('atrasado');
            else badgeEl.classList.add('ativo');
        }
    }
    
    const matriculaEl = document.getElementById('profileMatricula');
    if (matriculaEl) {
        matriculaEl.textContent = data.matricula || '';
        const metaItem = matriculaEl.closest('.meta-item');
        if (metaItem) metaItem.style.display = data.matricula ? '' : 'none';
    }
    
    const cargoEl = document.getElementById('profileCargo');
    if (cargoEl) {
        const val = data.vinculo || data.cargoAtual || '';
        cargoEl.textContent = val;
        const metaItem = cargoEl.closest('.meta-item');
        if (metaItem) metaItem.style.display = val ? '' : 'none';
    }
    
    const chEl = document.getElementById('profileCargaHoraria');
    if (chEl) {
        const val = data.cargaHoraria ? `${data.cargaHoraria}h semanais` : '';
        chEl.textContent = val;
        const metaItem = chEl.closest('.meta-item');
        if (metaItem) metaItem.style.display = val ? '' : 'none';
    }
    
    const photoEl = document.getElementById('profilePhoto');
    const photoWrapper = document.getElementById('profilePhotoWrapper');
    
    if (photoEl && photoWrapper) {
        const oldPlaceholder = document.getElementById('photoPlaceholder');
        if (oldPlaceholder) oldPlaceholder.remove();
        
        if (data.foto && data.foto !== '') {
            const fotos = converterLinksDrive(data.foto);
            const fotoUrl = Array.isArray(fotos) && fotos.length > 0 ? fotos[0] : '';
            
            console.log('📸 Foto original:', data.foto);
            console.log('📸 Foto convertida:', fotoUrl);
            
            if (fotoUrl) {
                photoEl.src = fotoUrl;
                photoEl.style.display = 'block';
                
                const overlay = photoWrapper.querySelector('.profile-photo-overlay');
                if (overlay) {
                    overlay.setAttribute('onclick', `ampliarImagem('${fotoUrl.replace(/'/g, "\\'")}')`);
                }
                
                photoEl.onerror = function() {
                    this.style.display = 'none';
                    addPhotoPlaceholder(photoWrapper);
                };
                
                photoEl.onload = function() {
                    const ph = document.getElementById('photoPlaceholder');
                    if (ph) ph.remove();
                };
            } else {
                photoEl.style.display = 'none';
                addPhotoPlaceholder(photoWrapper);
            }
        } else {
            photoEl.style.display = 'none';
            addPhotoPlaceholder(photoWrapper);
        }
    }
}

function addPhotoPlaceholder(wrapper) {
    const existing = document.getElementById('photoPlaceholder');
    if (existing) existing.remove();
    
    const placeholder = document.createElement('div');
    placeholder.className = 'photo-placeholder';
    placeholder.id = 'photoPlaceholder';
    placeholder.innerHTML = '<i class="fas fa-chalkboard-teacher"></i>';
    wrapper.appendChild(placeholder);
}

window.copyToClipboard = function(elementId, button) {
    const element = document.getElementById(elementId);
    if (element) {
        const text = element.innerText || element.textContent;
        copyText(text, button);
    }
};

function copyText(text, button) {
    if (!text) return;
    
    const done = () => {
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.classList.add('copied');
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.classList.remove('copied');
        }, 1500);
    };
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => {
            fallbackCopy(text, done);
        });
    } else {
        fallbackCopy(text, done);
    }
}

function fallbackCopy(text, callback) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        callback();
    } catch (e) {
        console.error('Erro ao copiar:', e);
    }
    document.body.removeChild(textarea);
}

function imprimirFicha() {
    const sections = document.querySelectorAll('#teacherData .teacher-section');
    const wasOpen = new Map();
    
    sections.forEach(section => {
        wasOpen.set(section, section.classList.contains('open'));
        section.classList.add('open');
    });
    
    setTimeout(() => {
        window.print();
        
        setTimeout(() => {
            sections.forEach(section => {
                if (!wasOpen.get(section)) {
                    section.classList.remove('open');
                }
            });
        }, 500);
    }, 300);
}
