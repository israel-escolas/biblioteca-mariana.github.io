const DISCIPLINAS = [
    'FÍSICA',
    'PORTUGUÊS',
    'MATEMÁTICA',
    'SOCIOLOGIA',
    'FILOSOFIA',
    'EDUCAÇÃO FÍSICA',
    'HISTÓRIA',
    'INGLÊS',
    'QUÍMICA',
    'BIOLOGIA',
    'GEOGRAFIA',
    'ESPANHOL',
    'ARTE'
];

// ============== VARIÁVEIS GLOBAIS ==============
let didaticosCompletos = [];
let filtroAtivo = 'todos';
let termoBusca = '';
let editandoId = null;
let excluindoId = null; 

// ============== ELEMENTOS DO DOM ==============
const btnAddDidatico = document.getElementById('btnAddDidatico');
const modal = document.getElementById('modalDidatico');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnCancelModal = document.getElementById('btnCancelModal');
const formDidatico = document.getElementById('formDidatico');
const refreshButton = document.getElementById('refreshDidaticos');
const didaticosGrid = document.getElementById('didaticosGrid');
const modalTitulo = document.getElementById('modalTitulo');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');

const imagemInput = document.getElementById('imagemDidatico');
const previewContainer = document.getElementById('previewContainerDidatico');
const imagemPreview = document.getElementById('imagemPreviewDidatico');

const modalExclusao = document.getElementById('modalConfirmarExclusao');
let itemParaExcluir = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Controle Didático iniciado!');
    
    configurarEventListeners();
    configurarFiltros();
    popularSelectDisciplinas();
    carregarDidaticos();
});

function configurarEventListeners() {
    if (btnAddDidatico) {
        btnAddDidatico.addEventListener('click', () => abrirModal());
    }
    
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
    
    if (refreshButton) {
        refreshButton.addEventListener('click', carregarDidaticos);
    }
    
    if (formDidatico) {
        formDidatico.addEventListener('submit', salvarDidatico);
    }
    
    if (imagemInput) {
        imagemInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) {
                if (previewContainer) previewContainer.style.display = 'none';
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                mostrarNotificacao('❌ Imagem muito grande! Máximo 8MB.', 'error');
                this.value = '';
                if (previewContainer) previewContainer.style.display = 'none';
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                if (imagemPreview) {
                    imagemPreview.src = e.target.result;
                    if (previewContainer) previewContainer.style.display = 'block';
                }
            };
            reader.readAsDataURL(file);
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            termoBusca = e.target.value.toLowerCase().trim();
            if (clearSearch) {
                clearSearch.style.display = termoBusca ? 'flex' : 'none';
            }
            aplicarFiltros();
        });
    }
    
    if (clearSearch) {
        clearSearch.addEventListener('click', () => {
            searchInput.value = '';
            termoBusca = '';
            clearSearch.style.display = 'none';
            aplicarFiltros();
        });
    }
    
    const btnConfirmar = document.getElementById('btnConfirmarExclusao');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', excluirDidatico);
    }
    
    if (modalExclusao) {
        modalExclusao.addEventListener('click', (e) => {
            if (e.target === modalExclusao) closeModalExclusao();
        });
    }
}

function popularSelectDisciplinas() {
    const select = document.getElementById('disciplina');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione a disciplina</option>';
    
    DISCIPLINAS.forEach(disciplina => {
        const option = document.createElement('option');
        option.value = disciplina;
        option.textContent = disciplina;
        select.appendChild(option);
    });
}

function configurarFiltros() {
    const container = document.getElementById('filtrosContainer');
    if (!container) return;
    
    DISCIPLINAS.forEach(disciplina => {
        const btn = document.createElement('button');
        btn.className = 'categoria-btn';
        btn.dataset.filtro = disciplina.toLowerCase();
        btn.innerHTML = `<i class="fas ${getIconeDisciplina(disciplina)}"></i> ${disciplina}`;
        
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-filtro]').forEach(b => b.classList.remove('active'));
            document.querySelector('[data-filtro="todos"]')?.classList.remove('active');
            btn.classList.add('active');
            filtroAtivo = disciplina;
            aplicarFiltros();
        });
        
        container.appendChild(btn);
    });
    
    const btnTodos = document.querySelector('[data-filtro="todos"]');
    if (btnTodos) {
        btnTodos.addEventListener('click', () => {
            document.querySelectorAll('[data-filtro]').forEach(b => b.classList.remove('active'));
            btnTodos.classList.add('active');
            filtroAtivo = 'todos';
            aplicarFiltros();
        });
    }
}

function abrirModal(didatico = null) {
    modalTitulo.innerHTML = didatico 
        ? '<i class="fas fa-edit"></i> Editar Livro Didático' 
        : '<i class="fas fa-plus-circle"></i> Adicionar Livro Didático';
    
    if (didatico) {
        editandoId = didatico.id;
        document.getElementById('editId').value = didatico.id;
        document.getElementById('disciplina').value = didatico.DISCIPLINA || didatico.disciplina || '';
        document.getElementById('ano').value = didatico.ANO || didatico.ano || '';
        document.getElementById('quantidade').value = didatico.QUANTIDADE || didatico.quantidade || 1;
    } else {
        editandoId = null;
        formDidatico.reset();
        document.getElementById('editId').value = '';
        document.getElementById('quantidade').value = 1;
    }
    
    if (previewContainer) previewContainer.style.display = 'none';
    if (imagemInput) imagemInput.value = '';
    
    modal.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
    formDidatico.reset();
    if (previewContainer) previewContainer.style.display = 'none';
    if (imagemInput) imagemInput.value = '';
    editandoId = null;
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function uploadImagem(file, nomeArquivo) {
    try {
        console.log('📤 Enviando imagem para o Drive:', nomeArquivo);

        const base64Completo = await fileToBase64(file);
        const base64Puro = base64Completo.split(',')[1];

        const formData = new FormData();
        formData.append('data', base64Puro);
        formData.append('name', nomeArquivo);
        formData.append('mime', file.type);
        formData.append('folderId', PASTAS_DRIVE.LIVROS);

        const response = await fetch(API_UPLOAD_URL, { method: 'POST', body: formData });
        const resultado = await response.json();

        console.log('📨 Resposta do upload:', resultado);

        if (resultado.status === 'ok' || resultado.success) {
            const url = resultado.url || resultado.link || '';
            return { success: true, url: url };
        } else {
            return { success: false, error: resultado.message || 'Erro no upload' };
        }

    } catch (error) {
        console.error('❌ Erro no upload:', error);
        return { success: false, error: 'Erro na conexão: ' + error.message };
    }
}

function converterLinksDrive(urlString) {
    if (!urlString || urlString.trim() === '') return [];
    
    const urlsConvertidas = [];
    
    const match = urlString.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
        urlsConvertidas.push(`https://lh3.googleusercontent.com/d/${match[1]}`);
    }
    else if (urlString.match(/\.(jpg|jpeg|png|gif|webp|bmp)/i) || 
             urlString.includes('lh3.googleusercontent.com') ||
             urlString.includes('drive.google.com/uc')) {
        urlsConvertidas.push(urlString);
    }
    
    return urlsConvertidas;
}

async function carregarDidaticos() {
    if (!didaticosGrid) return;
    
    didaticosGrid.innerHTML = '<p class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando...</p>';
    
    try {
        const response = await fetch(`${API_URL}?action=getDidaticos`);
        const resultado = await response.json();
        
        console.log('📨 Resposta didáticos:', resultado);
        
        if (resultado.success) {
            didaticosCompletos = resultado.data || [];
            
            didaticosCompletos = didaticosCompletos.map((item, index) => {
                if (!item.id && !item.ID) {
                    console.warn('⚠️ Item sem ID, gerando ID temporário:', item);
                    item.id = `DID_${Date.now()}_${index}_${Math.random()}`;
                } else {
                    item.id = item.id || item.ID;
                }
                return item;
            });
            
            console.log(`✅ ${didaticosCompletos.length} livros didáticos carregados`);
            aplicarFiltros();
        } else {
            throw new Error(resultado.error || 'Erro ao carregar');
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar:', error);
        didaticosGrid.innerHTML = '<p class="no-books">❌ Erro ao carregar. Tente novamente.</p>';
    }
}

async function salvarDidatico(e) {
    e.preventDefault();
    
    const disciplina = document.getElementById('disciplina').value;
    const ano = document.getElementById('ano').value;
    const quantidade = parseInt(document.getElementById('quantidade').value) || 0;
    
    if (!disciplina || !ano) {
        mostrarNotificacao('❌ Preencha todos os campos obrigatórios!', 'error');
        return;
    }
    
    if (quantidade <= 0) {
        mostrarNotificacao('❌ A quantidade deve ser maior que zero!', 'error');
        return;
    }
    
    const submitBtn = formDidatico.querySelector('.btn-submit');
    const originalHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    submitBtn.disabled = true;
    
    try {
        let linkImagem = '';
        
        const imagemFile = imagemInput?.files[0];
        if (imagemFile) {
            const extensao = imagemFile.name.split('.').pop();
            const nomeArquivo = `${disciplina.replace(/[^a-zA-Z0-9]/g, '_')}_${ano}_${Date.now()}.${extensao}`;
            
            const uploadResult = await uploadImagem(imagemFile, nomeArquivo);
            
            if (uploadResult.success) {
                linkImagem = uploadResult.url;
                console.log('✅ Upload concluído! URL:', linkImagem);
            } else {
                console.warn('⚠️ Upload falhou, continuando sem imagem:', uploadResult.error);
            }
        }
        
        const dados = {
            action: editandoId ? 'updateDidatico' : 'addDidatico',
            disciplina: disciplina,
            ano: ano,
            tipo: 'ÚNICO',
            quantidade: quantidade,
            link: linkImagem
        };
        
        if (editandoId) {
            dados.id = editandoId;
        }
        
        console.log('📤 Enviando dados:', dados);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(dados)
        });
        
        const resultado = await response.json();
        console.log('📨 Resposta:', resultado);
        
        if (resultado.success) {
            mostrarNotificacao(resultado.message || `✅ Livro didático ${editandoId ? 'atualizado' : 'adicionado'} com sucesso!`, 'success');
            closeModal();
            await carregarDidaticos();
        } else {
            throw new Error(resultado.error || 'Erro ao salvar');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
        mostrarNotificacao('❌ ' + error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalHTML;
        submitBtn.disabled = false;
    }
}

function aplicarFiltros() {
    let filtrados = [...didaticosCompletos];
    
    if (filtroAtivo !== 'todos') {
        filtrados = filtrados.filter(d => {
            const disc = (d.DISCIPLINA || d.disciplina || '').toUpperCase();
            return disc === filtroAtivo.toUpperCase();
        });
    }
    
    if (termoBusca) {
        filtrados = filtrados.filter(d => {
            const disciplina = (d.DISCIPLINA || d.disciplina || '').toLowerCase();
            const ano = String(d.ANO || d.ano || '').toLowerCase();
            
            return disciplina.includes(termoBusca) || ano.includes(termoBusca);
        });
    }
    
    filtrados.sort((a, b) => {
        const dispA = (a.DISCIPLINA || a.disciplina || '').toUpperCase();
        const dispB = (b.DISCIPLINA || b.disciplina || '').toUpperCase();
        if (dispA !== dispB) return dispA.localeCompare(dispB);
        
        const anoA = String(a.ANO || a.ano || '');
        const anoB = String(b.ANO || b.ano || '');
        return anoB.localeCompare(anoA);
    });
    
    exibirDidaticos(filtrados);
}


function exibirDidaticos(didaticos) {
    if (!didaticosGrid) return;
    
    if (didaticos.length === 0) {
        didaticosGrid.innerHTML = `
            <div class="no-books">
                <i class="fas fa-search" style="font-size: 3rem; opacity: 0.5; margin-bottom: 1rem; display: block;"></i>
                <p>Nenhum livro didático encontrado</p>
            </div>
        `;
        return;
    }
    
    didaticosGrid.innerHTML = '';
    
    didaticos.forEach(didatico => {
        didaticosGrid.appendChild(criarCardDidatico(didatico));
    });
}

function criarCardDidatico(didatico) {
    const card = document.createElement('div');
    card.className = 'didatico-card';
    card.dataset.id = didatico.id; // Adicionar ID como data attribute
    
    const disciplina = didatico.DISCIPLINA || didatico.disciplina || 'N/A';
    const ano = didatico.ANO || didatico.ano || 'N/A';
    const tipo = didatico.TIPO || didatico.tipo || 'ÚNICO';
    const quantidade = didatico.QUANTIDADE || didatico.quantidade || 0;
    const link = didatico.LINK || didatico.link || '';
    const id = didatico.id;
    
    const disciplinaLower = disciplina.toLowerCase();
    if (disciplinaLower.includes('física') || disciplinaLower.includes('fisica')) card.classList.add('disciplina-fisica');
    else if (disciplinaLower.includes('português') || disciplinaLower.includes('portugues')) card.classList.add('disciplina-portugues');
    else if (disciplinaLower.includes('matemática') || disciplinaLower.includes('matematica')) card.classList.add('disciplina-matematica');
    else if (disciplinaLower.includes('sociologia')) card.classList.add('disciplina-sociologia');
    else if (disciplinaLower.includes('filosofia')) card.classList.add('disciplina-filosofia');
    else if (disciplinaLower.includes('educação') || disciplinaLower.includes('educacao')) card.classList.add('disciplina-ed-fisica');
    else if (disciplinaLower.includes('história') || disciplinaLower.includes('historia')) card.classList.add('disciplina-historia');
    else if (disciplinaLower.includes('inglês') || disciplinaLower.includes('ingles')) card.classList.add('disciplina-ingles');
    else if (disciplinaLower.includes('química') || disciplinaLower.includes('quimica')) card.classList.add('disciplina-quimica');
    else if (disciplinaLower.includes('biologia')) card.classList.add('disciplina-biologia');
    else if (disciplinaLower.includes('geografia')) card.classList.add('disciplina-geografia');
    else if (disciplinaLower.includes('espanhol')) card.classList.add('disciplina-espanhol');
    else if (disciplinaLower.includes('arte')) card.classList.add('disciplina-arte');
    
    const iconeDisciplina = getIconeDisciplina(disciplina);
    
    let imagemUrl = '';
    if (link) {
        const linksConvertidos = converterLinksDrive(link);
        imagemUrl = linksConvertidos[0] || '';
    }
    
    card.innerHTML = `
        <div class="card-header">
            <i class="fas ${iconeDisciplina}"></i>
            <h4>${disciplina}</h4>
        </div>
        <div class="card-body">
            ${imagemUrl ? `
                <div style="text-align: center; margin-bottom: 10px;">
                    <img src="${imagemUrl}" alt="${disciplina}" style="width: 100%; max-height: 100px; object-fit: contain; border-radius: 8px;" onerror="this.style.display='none'">
                </div>
            ` : ''}
            <div class="info-row">
                <div class="info-item">
                    <i class="fas fa-calendar-alt"></i>
                    <span><strong>Ano:</strong> ${ano}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-tag"></i>
                    <span><strong>Tipo:</strong> ${tipo}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-cubes"></i>
                    <span class="quantidade-badge">
                        <i class="fas fa-book"></i> ${quantidade}
                    </span>
                </div>
            </div>
        </div>
        <div class="card-footer">
            <button class="btn-edit" onclick="editarDidatico('${id}')" ${excluindoId ? 'disabled' : ''}>
                <i class="fas fa-edit"></i>
                <span>Editar</span>
            </button>
            <button class="btn-add" onclick="aumentarQuantidade('${id}')" ${excluindoId ? 'disabled' : ''}>
                <i class="fas fa-plus"></i>
                <span>Add</span>
            </button>
            <button class="btn-delete" onclick="confirmarExclusao('${id}', '${disciplina.replace(/'/g, "\\'")} - ${ano}')" ${excluindoId ? 'disabled' : ''}>
                <i class="fas ${excluindoId === id ? 'fa-spinner fa-spin' : 'fa-trash'}"></i>
                <span>${excluindoId === id ? 'Excluindo...' : 'Excluir'}</span>
            </button>
        </div>
    `;
    
    return card;
}

function getIconeDisciplina(disciplina) {
    const disciplinaLower = (disciplina || '').toLowerCase();
    
    if (disciplinaLower.includes('física') || disciplinaLower.includes('fisica')) return 'fa-atom';
    if (disciplinaLower.includes('português') || disciplinaLower.includes('portugues')) return 'fa-book';
    if (disciplinaLower.includes('matemática') || disciplinaLower.includes('matematica')) return 'fa-calculator';
    if (disciplinaLower.includes('sociologia')) return 'fa-users';
    if (disciplinaLower.includes('filosofia')) return 'fa-brain';
    if (disciplinaLower.includes('educação') || disciplinaLower.includes('educacao')) return 'fa-futbol';
    if (disciplinaLower.includes('história') || disciplinaLower.includes('historia')) return 'fa-landmark';
    if (disciplinaLower.includes('inglês') || disciplinaLower.includes('ingles')) return 'fa-language';
    if (disciplinaLower.includes('química') || disciplinaLower.includes('quimica')) return 'fa-flask';
    if (disciplinaLower.includes('biologia')) return 'fa-dna';
    if (disciplinaLower.includes('geografia')) return 'fa-globe';
    if (disciplinaLower.includes('espanhol')) return 'fa-language';
    if (disciplinaLower.includes('arte')) return 'fa-palette';
    
    return 'fa-book';
}

async function aumentarQuantidade(id) {
    const incremento = prompt('Quantos exemplares deseja adicionar?', '1');
    
    if (incremento === null) return;
    
    const qtd = parseInt(incremento);
    if (isNaN(qtd) || qtd <= 0) {
        mostrarNotificacao('❌ Quantidade inválida!', 'error');
        return;
    }
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'aumentarQuantidade',
                id: id,
                incremento: qtd
            })
        });
        
        const resultado = await response.json();
        
        if (resultado.success) {
            mostrarNotificacao(resultado.message, 'success');
            await carregarDidaticos();
        } else {
            throw new Error(resultado.error || 'Erro ao atualizar');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
        mostrarNotificacao('❌ ' + error.message, 'error');
    }
}

function editarDidatico(id) {
    if (excluindoId) {
        mostrarNotificacao('⚠️ Aguarde a exclusão terminar', 'info');
        return;
    }
    
    const didatico = didaticosCompletos.find(d => d.id === id);
    if (didatico) {
        abrirModal(didatico);
    } else {
        mostrarNotificacao('❌ Livro não encontrado!', 'error');
    }
}

function confirmarExclusao(id, info) {
    if (excluindoId) {
        mostrarNotificacao('⚠️ Já existe uma exclusão em andamento', 'info');
        return;
    }
    
    const item = didaticosCompletos.find(d => d.id === id);
    if (!item) {
        mostrarNotificacao('❌ Livro não encontrado!', 'error');
        return;
    }
    
    itemParaExcluir = id;
    document.getElementById('excluirInfo').textContent = info;
    modalExclusao.classList.add('active');
}

function closeModalExclusao() {
    modalExclusao.classList.remove('active');
    itemParaExcluir = null;
}

async function excluirDidatico() {
    if (!itemParaExcluir) return;
    
    if (excluindoId) {
        mostrarNotificacao('⚠️ Já existe uma exclusão em andamento', 'info');
        return;
    }
    
    const idParaExcluir = itemParaExcluir;
    excluindoId = idParaExcluir;
    
    const btnConfirmar = document.getElementById('btnConfirmarExclusao');
    const originalHTML = btnConfirmar.innerHTML;
    btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';
    btnConfirmar.disabled = true;
    
    aplicarFiltros();
    
    try {
        console.log('🗑️ Excluindo livro com ID:', idParaExcluir);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'deleteDidatico',
                id: idParaExcluir
            })
        });
        
        const resultado = await response.json();
        console.log('📨 Resposta da exclusão:', resultado);
        
        if (resultado.success) {
            mostrarNotificacao('✅ Livro didático excluído com sucesso!', 'success');
            closeModalExclusao();
            
            didaticosCompletos = didaticosCompletos.filter(d => d.id !== idParaExcluir);
            aplicarFiltros();
            
            await carregarDidaticos();
        } else {
            throw new Error(resultado.error || 'Erro ao excluir');
        }
        
    } catch (error) {
        console.error('❌ Erro ao excluir:', error);
        mostrarNotificacao('❌ ' + error.message, 'error');
        aplicarFiltros(); 
    } finally {
        excluindoId = null;
        itemParaExcluir = null;
        
        btnConfirmar.innerHTML = originalHTML;
        btnConfirmar.disabled = false;
    }
}

function mostrarNotificacao(mensagem, tipo = 'info') {
    const icone = tipo === 'success' ? 'check-circle' : 
                  tipo === 'error' ? 'exclamation-circle' : 'info-circle';
    const cor = tipo === 'success' ? '#4CAF50' : 
                tipo === 'error' ? '#f44336' : '#2196F3';

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
        animation: slideIn 0.3s ease;
    `;

    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notificacao);
    setTimeout(() => {
        notificacao.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notificacao.remove(), 300);
    }, 3500);
}

window.editarDidatico = editarDidatico;
window.confirmarExclusao = confirmarExclusao;
window.closeModalExclusao = closeModalExclusao;
window.aumentarQuantidade = aumentarQuantidade;

console.log('✅ didatico.js carregado!');