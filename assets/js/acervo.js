// ============================================
// ACERVO.JS - SISTEMA DE BIBLIOTECA (COMPLETO)
// ============================================

const btnAddLivro      = document.getElementById('btnAddLivro');
const modal            = document.getElementById('modalLivro');
const btnCloseModal    = document.getElementById('btnCloseModal');
const btnCancelModal   = document.getElementById('btnCancelModal');
const formLivro        = document.getElementById('formLivro');
const refreshButton    = document.getElementById('refreshBooks');
const imagemInput      = document.getElementById('imagemLivro');
const previewContainer = document.getElementById('previewContainer');
const imagemPreview    = document.getElementById('imagemPreview');
const modalEmprestimo  = document.getElementById('modalEmprestimo');
const formEmprestimo   = document.getElementById('formEmprestimo');

// ============== VARIÁVEIS GLOBAIS ==============
let livrosCompletos = []; 
let categoriaAtiva = 'todos';
let termoBusca = '';
let livroAtualEmprestimo = null; 
let turmasDisponiveis = [];      
let estudantesPorTurma = {};     

// ============================================
// CONVERTER LINKS DO DRIVE
// ============================================

function converterLinksDrive(urlString) {
    if (!urlString || urlString.trim() === '') return [];

    const urls = urlString.split(',').map(url => url.trim()).filter(url => url !== '');
    const urlsConvertidas = [];

    urls.forEach(url => {
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);

        if (match) {
            urlsConvertidas.push(`https://lh3.googleusercontent.com/d/${match[1]}`);
        }
        else if (
            url.match(/\.(jpg|jpeg|png|gif|webp|bmp)/i) ||
            url.includes('lh3.googleusercontent.com') ||
            url.includes('drive.google.com/uc')
        ) {
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

    return urlsConvertidas;
}

// ============== PREVIEW DA IMAGEM ==============

if (imagemInput) {
    imagemInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) {
            if (previewContainer) previewContainer.style.display = 'none';
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            mostrarNotificacao('❌ Imagem muito grande! Máximo 5MB.', 'error');
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

// ============== ABRIR / FECHAR MODAL DE LIVRO ==============

if (btnAddLivro) {
    btnAddLivro.addEventListener('click', () => {
        modal.classList.add('active');
        setTimeout(() => {
            const autorInput = document.getElementById('autor');
            if (autorInput) autorInput.focus();
        }, 100);
    });
}

function closeModal() {
    modal.classList.remove('active');
    if (formLivro) formLivro.reset();
    if (previewContainer) previewContainer.style.display = 'none';
    if (imagemInput) imagemInput.value = '';
}

if (btnCloseModal)  btnCloseModal.addEventListener('click', closeModal);
if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);

if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (modal && modal.classList.contains('active')) closeModal();
        if (modalEmprestimo && modalEmprestimo.classList.contains('active')) closeModalEmprestimo();
    }
});

// ============== CONVERSÃO DE ARQUIVO PARA BASE64 ==============

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ============== UPLOAD DE IMAGEM (COM FOLDER ID) ==============

async function uploadImagem(file, nomeArquivo) {
    try {
        console.log('📤 Enviando imagem para o Drive:', nomeArquivo);

        const base64Completo = await fileToBase64(file);
        const base64Puro     = base64Completo.split(',')[1];

        const formData = new FormData();
        formData.append('data', base64Puro);
        formData.append('name', nomeArquivo);
        formData.append('mime', file.type);
        formData.append('folderId', PASTAS_DRIVE.LIVROS);

        const response  = await fetch(API_UPLOAD_URL, { method: 'POST', body: formData });
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

// ============== FORMULÁRIO: ADICIONAR LIVRO ==============

if (formLivro) {
    formLivro.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('📝 Processando formulário...');

        const autor      = document.getElementById('autor')?.value.trim()   || '';
        const titulo     = document.getElementById('titulo')?.value.trim()  || '';
        const cbl        = document.getElementById('cbl')?.value.trim()     || '';
        const categoria  = document.getElementById('categoria')?.value      || '';
        const ano        = document.getElementById('ano')?.value            || '';
        const edicao     = document.getElementById('edicao')?.value.trim()  || '1';
        const editora    = document.getElementById('editora')?.value.trim() || '';
        const quantidade = document.getElementById('quantidade')?.value     || '1';

        if (!autor || !titulo || !cbl || !categoria || !ano || !edicao || !editora) {
            mostrarNotificacao('❌ Preencha todos os campos obrigatórios!', 'error');
            return;
        }

        const submitBtn    = formLivro.querySelector('.btn-submit');
        const originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        submitBtn.disabled  = true;

        try {
            let linkImagem = '';

            const imagemFile = imagemInput?.files[0];
            if (imagemFile) {
                const extensao    = imagemFile.name.split('.').pop();
                const nomeArquivo = `${titulo.replace(/[^a-zA-Z0-9]/g, '_')}_${ano}.${extensao}`;

                const uploadResult = await uploadImagem(imagemFile, nomeArquivo);

                if (uploadResult.success) {
                    linkImagem = uploadResult.url;
                    console.log('✅ Upload concluído! URL:', linkImagem);
                } else {
                    console.warn('⚠️ Upload falhou, continuando sem imagem:', uploadResult.error);
                }
            }

            const livroData = {
                action:     'addBook',
                autor,
                titulo,
                cbl,
                categoria,
                ano:        parseInt(ano),
                edicao:     parseInt(edicao),
                editora,
                quantidade: parseInt(quantidade),
                link:       linkImagem
            };

            console.log('📤 Adicionando livro:', livroData);

            const response  = await fetch(API_URL, {
                method: 'POST',
                body:   JSON.stringify(livroData)
            });
            const resultado = await response.json();
            console.log('📨 Resposta:', resultado);

            if (resultado.success) {
                mostrarNotificacao('✅ Livro adicionado com sucesso!', 'success');
                closeModal();
                setTimeout(() => carregarLivros(), 500);
            } else {
                throw new Error(resultado.error || 'Erro ao adicionar livro');
            }

        } catch (error) {
            console.error('❌ Erro:', error);
            mostrarNotificacao('❌ ' + error.message, 'error');
        } finally {
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled  = false;
        }
    });
}

// ============== CARREGAR LIVROS ==============

async function carregarLivros() {
    console.log('📚 Carregando livros...');

    const booksGrid = document.getElementById('booksGrid');
    if (!booksGrid) return;

    booksGrid.innerHTML = '<p class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando...</p>';

    try {
        const response  = await fetch(`${API_URL}?action=getAllBooks`);
        const resultado = await response.json();

        if (resultado.success) {
            console.log(`✅ ${resultado.data.length} livros carregados`);
            exibirLivros(resultado.data);
        } else {
            throw new Error(resultado.error || 'Erro desconhecido');
        }

    } catch (error) {
        console.error('❌ Erro ao carregar livros:', error);
        booksGrid.innerHTML = '<p class="no-books">❌ Erro ao carregar livros. Tente novamente.</p>';
    }
}

// ============== EXIBIR LIVROS (VERSÃO COM FILTROS) ==============

function exibirLivros(livros) {
    const booksGrid = document.getElementById('booksGrid');
    if (!booksGrid) return;

    livrosCompletos = livros || [];
    
    atualizarCategorias(livrosCompletos);
    
    aplicarFiltros();
}

// ============== APLICAR FILTROS ==============

function aplicarFiltros() {
    const booksGrid = document.getElementById('booksGrid');
    if (!booksGrid) return;
    
    let livrosFiltrados = livrosCompletos;
    
    if (categoriaAtiva !== 'todos') {
        livrosFiltrados = livrosFiltrados.filter(livro => {
            const cat = String(livro.categoria || livro.CATEGORIA || '').toLowerCase();
            return cat === categoriaAtiva.toLowerCase();
        });
    }
    
    if (termoBusca.trim() !== '') {
        const termo = termoBusca.toLowerCase().trim();
        livrosFiltrados = livrosFiltrados.filter(livro => {
            const titulo = String(livro.titulo || livro.TITULO || '').toLowerCase();
            const autor = String(livro.autor || livro.AUTOR || '').toLowerCase();
            
            return titulo.includes(termo) || autor.includes(termo);
        });
    }
    
    booksGrid.innerHTML = '';
    
    if (livrosFiltrados.length === 0) {
        booksGrid.innerHTML = `
            <div class="no-books">
                <i class="fas fa-search" style="font-size: 3rem; opacity: 0.5; margin-bottom: 1rem; display: block;"></i>
                <p>Nenhum livro encontrado</p>
                <small style="opacity: 0.7; display: block; margin-top: 0.5rem;">Tente outro título ou autor</small>
            </div>
        `;
    } else {
        livrosFiltrados.forEach(livro => booksGrid.appendChild(criarCardLivro(livro)));
    }
    
    atualizarContadorResultados(livrosFiltrados.length);
}

// ============== ATUALIZAR CATEGORIAS ==============

function atualizarCategorias(livros) {
    const container = document.getElementById('categoriasContainer');
    if (!container) return;
    
    const categorias = new Set();
    livros.forEach(livro => {
        const cat = livro.categoria || livro.CATEGORIA;
        if (cat && cat.trim() !== '') {
            categorias.add(cat.trim());
        }
    });
    
    const categoriasArray = Array.from(categorias).sort();
    
    container.innerHTML = '';
    
    categoriasArray.forEach(categoria => {
        const count = livros.filter(l => 
            (l.categoria || l.CATEGORIA || '').toLowerCase() === categoria.toLowerCase()
        ).length;
        
        const btn = document.createElement('button');
        btn.className = 'categoria-btn';
        btn.dataset.categoria = categoria.toLowerCase();
        btn.innerHTML = `
            <i class="fas fa-tag"></i> ${categoria}
            <span class="categoria-count">${count}</span>
        `;
        
        btn.addEventListener('click', () => {
            document.querySelectorAll('.categoria-btn').forEach(b => 
                b.classList.remove('active')
            );
            
            btn.classList.add('active');
            
            categoriaAtiva = categoria.toLowerCase();
            
            aplicarFiltros();
        });
        
        container.appendChild(btn);
    });
    
    const btnTodos = document.querySelector('[data-categoria="todos"]');
    if (btnTodos) {
        const totalLivros = livros.length;
        btnTodos.innerHTML = `
            <i class="fas fa-books"></i> Todos
            <span class="categoria-count">${totalLivros}</span>
        `;
    }
}

// ============== ATUALIZAR CONTADOR DE RESULTADOS ==============

function atualizarContadorResultados(count) {
    const countElement = document.getElementById('resultadosCount');
    if (countElement) {
        countElement.textContent = count;
    }
}

// ============== INICIALIZAR BUSCA E FILTROS ==============

function inicializarBuscaEFiltros() {
    const searchInput = document.getElementById('searchInput');
    const clearSearch = document.getElementById('clearSearch');
    const btnTodos = document.querySelector('[data-categoria="todos"]');
    
    const filtrosContainer = document.querySelector('.filtros-container');
    if (filtrosContainer && !document.getElementById('resultadosInfo')) {
        const resultadosInfo = document.createElement('div');
        resultadosInfo.id = 'resultadosInfo';
        resultadosInfo.className = 'resultados-info';
        resultadosInfo.innerHTML = `
            <i class="fas fa-list"></i>
            <span>Mostrando <strong id="resultadosCount">0</strong> livro(s)</span>
        `;
        filtrosContainer.appendChild(resultadosInfo);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            termoBusca = e.target.value;
            
            if (clearSearch) {
                clearSearch.style.display = termoBusca ? 'flex' : 'none';
            }
            
            aplicarFiltros();
        });
    }
    
    if (clearSearch) {
        clearSearch.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                termoBusca = '';
                clearSearch.style.display = 'none';
                aplicarFiltros();
                searchInput.focus();
            }
        });
    }
    
    if (btnTodos) {
        btnTodos.addEventListener('click', () => {
            document.querySelectorAll('.categoria-btn').forEach(b => 
                b.classList.remove('active')
            );
            btnTodos.classList.add('active');
            categoriaAtiva = 'todos';
            aplicarFiltros();
        });
    }
}

// ============== CRIAR CARD DO LIVRO ==============

function criarCardLivro(livro) {
    const card = document.createElement('div');
    card.className = 'livro-card';

    const img = document.createElement('img');
    img.className = 'livro-imagem';
    img.alt       = livro.titulo || livro.TITULO || 'Livro';

    const linkBruto        = livro.link || livro.LINK || '';
    const linksConvertidos = converterLinksDrive(linkBruto);
    const linkImagem       = linksConvertidos[0] || '';

    img.src = linkImagem || criarIconeLivro(img.alt, livro.autor || livro.AUTOR || '');
    img.onerror = function () {
        this.src = criarIconeLivro(img.alt, livro.autor || livro.AUTOR || '');
    };

    const titulo = document.createElement('h4');
    titulo.className   = 'livro-titulo';
    titulo.textContent = livro.titulo || livro.TITULO || 'Título não informado';

    const autor = document.createElement('p');
    autor.className   = 'livro-autor';
    autor.textContent = livro.autor || livro.AUTOR || 'Autor desconhecido';

    const infoLinha = document.createElement('div');
    infoLinha.className = 'info-linha';

    const anoSpan = document.createElement('span');
    anoSpan.className = 'livro-ano';
    anoSpan.innerHTML = `<i class="far fa-calendar-alt"></i> ${livro.ano || livro.ANO || 'N/A'}`;

    const qtdSpan = document.createElement('span');
    qtdSpan.className = 'livro-quantidade';
    qtdSpan.innerHTML = `<i class="fas fa-cubes"></i> ${livro.quantidade || livro.QUANTIDADE || 0}`;

    infoLinha.appendChild(anoSpan);
    infoLinha.appendChild(qtdSpan);

    const hr = document.createElement('hr');

    const botoesContainer = document.createElement('div');
    botoesContainer.style.cssText = 'display:flex; gap:8px; width:100%;';

    const btnEmprestimo = document.createElement('button');
    btnEmprestimo.innerHTML = '<i class="fas fa-hand-holding-heart"></i> Empréstimo';
    btnEmprestimo.style.cssText = 'flex:1; font-size:0.7rem; padding:6px 8px;';
    btnEmprestimo.onclick = () => abrirModalEmprestimo(livro);

    const btnExcluir = document.createElement('button');
    btnExcluir.innerHTML = '<i class="fas fa-trash"></i>';
    btnExcluir.style.cssText = 'background:#f44336; padding:6px 10px;';
    btnExcluir.onclick = () => excluirLivro(livro);

    botoesContainer.appendChild(btnEmprestimo);
    botoesContainer.appendChild(btnExcluir);

    card.appendChild(img);
    card.appendChild(titulo);
    card.appendChild(autor);
    card.appendChild(infoLinha);
    card.appendChild(hr);
    card.appendChild(botoesContainer);

    return card;
}

// ============== ÍCONE GERADO POR CANVAS ==============

function criarIconeLivro(titulo, autor) {
    const canvas  = document.createElement('canvas');
    canvas.width  = 200;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    const hash = titulo.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue  = hash % 360;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, `hsl(${hue}, 70%, 50%)`);
    gradient.addColorStop(1, `hsl(${hue}, 80%, 35%)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font         = 'bold 70px Arial';
    ctx.fillStyle    = 'rgba(255,255,255,0.25)';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📚', canvas.width / 2, 100);

    ctx.font      = 'bold 15px Arial';
    ctx.fillStyle = 'white';

    const palavras = titulo.split(' ');
    const linhas   = [];
    let linhaAtual = '';

    palavras.forEach(palavra => {
        if ((linhaAtual + ' ' + palavra).length > 18) {
            linhas.push(linhaAtual);
            linhaAtual = palavra;
        } else {
            linhaAtual = linhaAtual ? linhaAtual + ' ' + palavra : palavra;
        }
    });
    if (linhaAtual) linhas.push(linhaAtual);

    linhas.forEach((linha, index) => {
        ctx.fillText(linha, canvas.width / 2, 180 + index * 20);
    });

    ctx.font      = '12px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(autor.substring(0, 20), canvas.width / 2, 250);

    return canvas.toDataURL('image/png');
}

// ============== EXCLUIR LIVRO ==============

async function excluirLivro(livro) {
    const tituloLivro = livro.titulo || livro.TITULO || 'este livro';
    if (!confirm(`Excluir "${tituloLivro}"?`)) return;

    try {
        const cbl = livro.cbl || livro.CBL;

        const response  = await fetch(API_URL, {
            method: 'POST',
            body:   JSON.stringify({ action: 'deleteBook', cbl })
        });
        const resultado = await response.json();

        if (resultado.success) {
            mostrarNotificacao('✅ Livro excluído com sucesso!', 'success');
            carregarLivros();
        } else {
            throw new Error(resultado.error || 'Erro ao excluir');
        }

    } catch (error) {
        console.error('❌ Erro ao excluir:', error);
        mostrarNotificacao('❌ Erro ao excluir: ' + error.message, 'error');
    }
}

// ================================================
// ============== MODAL DE EMPRÉSTIMO ==============
// ================================================

// Carregar turmas ao iniciar
async function carregarTurmas() {
    try {
        const response = await fetch(`${API_EMPRESTIMO_URL}?action=getTurmas`);
        const resultado = await response.json();
        
        if (resultado.success) {
            turmasDisponiveis = resultado.data;
            console.log('✅ Turmas carregadas:', turmasDisponiveis);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar turmas:', error);
    }
}

// Carregar estudantes de uma turma específica
async function carregarEstudantes(turma) {
    try {
        const response = await fetch(`${API_EMPRESTIMO_URL}?action=getEstudantes&turma=${encodeURIComponent(turma)}`);
        const resultado = await response.json();
        
        if (resultado.success) {
            estudantesPorTurma[turma] = resultado.data;
            console.log(`✅ Estudantes carregados para ${turma}:`, resultado.data.length);
            return resultado.data;
        }
        return [];
    } catch (error) {
        console.error('❌ Erro ao carregar estudantes:', error);
        return [];
    }
}

// Verificar disponibilidade do livro (em segundo plano)
async function verificarDisponibilidadeLivro(livro) {
    try {
        const titulo = livro.titulo || livro.TITULO || '';
        const response = await fetch(`${API_EMPRESTIMO_URL}?action=checkDisponibilidade&livro=${encodeURIComponent(titulo)}`);
        const resultado = await response.json();
        
        if (resultado.success) {
            return resultado;
        }
        return { disponivel: true, quantidadeTotal: 0, emprestados: 0, disponiveis: 0 };
    } catch (error) {
        console.error('Erro ao verificar disponibilidade:', error);
        return { disponivel: true, quantidadeTotal: 0, emprestados: 0, disponiveis: 0 };
    }
}

// Preencher select de turmas
function preencherSelectTurmas() {
    const selectTurma = document.getElementById('turma');
    if (!selectTurma) return;
    
    selectTurma.innerHTML = '<option value="">Selecione a turma...</option>';
    
    turmasDisponiveis.forEach(turma => {
        const option = document.createElement('option');
        option.value = turma;
        option.textContent = turma;
        selectTurma.appendChild(option);
    });
}

// Preencher datalist de estudantes
function preencherDatalistEstudantes(estudantes) {
    const datalist = document.getElementById('listaEstudantes');
    if (!datalist) return;
    
    datalist.innerHTML = '';
    
    estudantes.forEach(est => {
        const option = document.createElement('option');
        option.value = est.nome;
        datalist.appendChild(option);
    });
}

// 🆕 ABRIR MODAL RÁPIDO - Abre primeiro, verifica depois
function abrirModalEmprestimo(livro) {
    if (!modalEmprestimo) return;
    
    // Salvar o livro atual para uso no submit
    livroAtualEmprestimo = livro;

    // Abrir modal IMEDIATAMENTE
    const inputLivro = document.getElementById('livro');
    if (inputLivro) {
        inputLivro.value = `${livro.titulo || livro.TITULO} (Verificando disponibilidade...)`;
        inputLivro.style.color = '#666';
    }

    // Preencher datas
    const hoje = new Date();
    const devolucao = new Date();
    devolucao.setDate(devolucao.getDate() + 15);
    
    const hojeStr = hoje.toISOString().split('T')[0];
    const devolucaoStr = devolucao.toISOString().split('T')[0];

    const dataEmprestimo = document.getElementById('data_emprestimo');
    const dataDevolucao = document.getElementById('data_devolucao');
    
    if (dataEmprestimo) dataEmprestimo.value = hojeStr;
    if (dataDevolucao) dataDevolucao.value = devolucaoStr;
    
    // Limpar outros campos
    const estudanteInput = document.getElementById('estudante');
    const selectTurma = document.getElementById('turma');
    const observacoesInput = document.getElementById('observacoes');
    
    if (estudanteInput) {
        estudanteInput.value = '';
        estudanteInput.disabled = true;
        estudanteInput.placeholder = 'Selecione a turma primeiro';
    }
    if (selectTurma) selectTurma.value = '';
    if (observacoesInput) observacoesInput.value = '';
    
    // Preencher select de turmas
    if (turmasDisponiveis.length > 0) {
        preencherSelectTurmas();
    }
    
    // Limpar datalist de estudantes
    const datalist = document.getElementById('listaEstudantes');
    if (datalist) datalist.innerHTML = '';
    
    // Pegar botão de submit
    const submitBtn = formEmprestimo?.querySelector('.btn-submit');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Registrar Empréstimo';
        submitBtn.disabled = false;
    }
    
    // Abrir o modal
    modalEmprestimo.classList.add('active');
    
    // VERIFICAR DISPONIBILIDADE EM SEGUNDO PLANO
    verificarDisponibilidadeLivro(livro).then(disponibilidade => {
        if (!disponibilidade.disponivel) {
            // Livro INDISPONÍVEL
            if (inputLivro) {
                inputLivro.value = `${livro.titulo || livro.TITULO} (❌ INDISPONÍVEL)`;
                inputLivro.style.color = '#f44336';
                inputLivro.style.fontWeight = 'bold';
            }
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-ban"></i> Indisponível';
                submitBtn.style.background = '#f44336';
            }
            mostrarNotificacao(
                `⚠️ Todos os ${disponibilidade.quantidadeTotal} exemplares de "${livro.titulo || livro.TITULO}" já estão emprestados!`, 
                'error'
            );
        } else if (disponibilidade.disponiveis <= 3) {
            // Poucos exemplares
            if (inputLivro) {
                inputLivro.value = `${livro.titulo || livro.TITULO} (⚠️ Apenas ${disponibilidade.disponiveis} de ${disponibilidade.quantidadeTotal})`;
                inputLivro.style.color = '#ff9800';
            }
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Registrar Empréstimo';
                submitBtn.style.background = '';
            }
        } else {
            // Disponível normalmente
            if (inputLivro) {
                inputLivro.value = `${livro.titulo || livro.TITULO} (${disponibilidade.disponiveis} disponíveis)`;
                inputLivro.style.color = '#4CAF50';
            }
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Registrar Empréstimo';
                submitBtn.style.background = '';
            }
        }
    }).catch(error => {
        console.error('Erro ao verificar disponibilidade:', error);
        if (inputLivro) {
            inputLivro.value = livro.titulo || livro.TITULO;
            inputLivro.style.color = '';
        }
    });
}

function closeModalEmprestimo() {
    if (!modalEmprestimo) return;
    
    modalEmprestimo.classList.remove('active');
    
    if (formEmprestimo) {
        formEmprestimo.reset();
        
        const submitBtn = formEmprestimo.querySelector('.btn-submit');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Registrar Empréstimo';
            submitBtn.disabled = false;
            submitBtn.style.background = '';
        }
    }
    
    const estudanteInput = document.getElementById('estudante');
    const selectTurma = document.getElementById('turma');
    const datalist = document.getElementById('listaEstudantes');
    const inputLivro = document.getElementById('livro');
    
    if (estudanteInput) {
        estudanteInput.value = '';
        estudanteInput.disabled = true;
        estudanteInput.placeholder = 'Selecione a turma primeiro';
    }
    if (selectTurma) selectTurma.value = '';
    if (datalist) datalist.innerHTML = '';
    if (inputLivro) {
        inputLivro.style.color = '';
        inputLivro.style.fontWeight = '';
    }
    
    livroAtualEmprestimo = null;
}

// Event listeners do modal de empréstimo
if (modalEmprestimo) {
    document.getElementById('btnCloseModalEmprestimo')?.addEventListener('click', closeModalEmprestimo);
    document.getElementById('btnCancelModalEmprestimo')?.addEventListener('click', closeModalEmprestimo);
    modalEmprestimo.addEventListener('click', (e) => {
        if (e.target === modalEmprestimo) closeModalEmprestimo();
    });
    
    const selectTurma = document.getElementById('turma');
    if (selectTurma) {
        selectTurma.addEventListener('change', async (e) => {
            const turmaSelecionada = e.target.value;
            const estudanteInput = document.getElementById('estudante');
            
            if (!turmaSelecionada) {
                const datalist = document.getElementById('listaEstudantes');
                if (datalist) datalist.innerHTML = '';
                if (estudanteInput) {
                    estudanteInput.value = '';
                    estudanteInput.disabled = true;
                    estudanteInput.placeholder = 'Selecione a turma primeiro';
                }
                return;
            }
            
            if (estudanteInput) {
                estudanteInput.placeholder = 'Carregando estudantes...';
                estudanteInput.disabled = true;
            }
            
            let estudantes = estudantesPorTurma[turmaSelecionada];
            if (!estudantes) {
                estudantes = await carregarEstudantes(turmaSelecionada);
            }
            
            preencherDatalistEstudantes(estudantes);
            
            if (estudanteInput) {
                estudanteInput.placeholder = 'Digite ou selecione o nome do estudante';
                estudanteInput.disabled = false;
                estudanteInput.focus();
            }
        });
    }
}

// ================================================
// ========= FUNÇÕES DE EMPRÉSTIMO ================
// ================================================

async function realizarEmprestimo(dadosEmprestimo) {
    try {
        const response = await fetch(API_EMPRESTIMO_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'addEmprestimo',
                ...dadosEmprestimo
            })
        });

        const resultado = await response.json();
        
        if (resultado.success) {
            mostrarNotificacao(resultado.message, 'success');
            closeModalEmprestimo();
            setTimeout(() => carregarLivros(), 500);
            return { success: true, data: resultado };
        } else {
            mostrarNotificacao(resultado.error, 'error');
            return { success: false, error: resultado.error };
        }
        
    } catch (error) {
        console.error('Erro ao realizar empréstimo:', error);
        mostrarNotificacao('Erro na conexão: ' + error.message, 'error');
        return { success: false, error: error.message };
    }
}

async function carregarEmprestimos(status = 'todos') {
    try {
        const response = await fetch(`${API_EMPRESTIMO_URL}?action=getEmprestimos&status=${status}`);
        const resultado = await response.json();
        
        if (resultado.success) {
            return resultado.data;
        } else {
            throw new Error(resultado.error);
        }
        
    } catch (error) {
        console.error('Erro ao carregar empréstimos:', error);
        return [];
    }
}

async function devolverLivro(id) {
    try {
        const response = await fetch(API_EMPRESTIMO_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'devolverLivro',
                id: id
            })
        });

        const resultado = await response.json();
        
        if (resultado.success) {
            mostrarNotificacao(resultado.message, 'success');
            return { success: true };
        } else {
            mostrarNotificacao(resultado.error, 'error');
            return { success: false, error: resultado.error };
        }
        
    } catch (error) {
        console.error('Erro ao devolver livro:', error);
        mostrarNotificacao('Erro na conexão: ' + error.message, 'error');
        return { success: false, error: error.message };
    }
}

// Handler do formulário de empréstimo
if (formEmprestimo) {
    formEmprestimo.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = formEmprestimo.querySelector('.btn-submit');
        if (!submitBtn) {
            console.error('Botão submit não encontrado!');
            return;
        }
        
        if (!livroAtualEmprestimo) {
            mostrarNotificacao('❌ Nenhum livro selecionado!', 'error');
            return;
        }

        const estudante = document.getElementById('estudante')?.value.trim();
        const turma = document.getElementById('turma')?.value;
        const dataEmprestimo = document.getElementById('data_emprestimo')?.value;
        const dataDevolucao = document.getElementById('data_devolucao')?.value;
        const observacoes = document.getElementById('observacoes')?.value.trim();

        if (!turma) {
            mostrarNotificacao('❌ Selecione a turma!', 'error');
            return;
        }
        
        if (!estudante) {
            mostrarNotificacao('❌ Informe o nome do estudante!', 'error');
            return;
        }
        
        const estudantesDaTurma = estudantesPorTurma[turma] || [];
        const estudanteExiste = estudantesDaTurma.some(e => 
            e.nome.toLowerCase() === estudante.toLowerCase()
        );
        
        if (!estudanteExiste) {
            mostrarNotificacao('❌ Estudante não encontrado na turma selecionada!', 'error');
            return;
        }

        if (!dataEmprestimo || !dataDevolucao) {
            mostrarNotificacao('❌ Datas inválidas!', 'error');
            return;
        }

        if (new Date(dataDevolucao) <= new Date(dataEmprestimo)) {
            mostrarNotificacao('❌ Data de devolução deve ser posterior à data de empréstimo!', 'error');
            return;
        }

        const originalHTML = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        submitBtn.disabled = true;

        try {
            const resultado = await realizarEmprestimo({
                livro: livroAtualEmprestimo.titulo || livroAtualEmprestimo.TITULO,
                estudante: estudante,
                turma: turma,
                data_emprestimo: dataEmprestimo,
                data_devolucao: dataDevolucao,
                observacoes: observacoes
            });

            if (!resultado.success) {
                submitBtn.innerHTML = originalHTML;
                submitBtn.disabled = false;
            }
            
        } catch (error) {
            console.error('Erro no submit:', error);
            submitBtn.innerHTML = originalHTML;
            submitBtn.disabled = false;
            mostrarNotificacao('❌ Erro ao processar empréstimo!', 'error');
        }
    });
}

// ================================================
// ============== NOTIFICAÇÕES ====================
// ================================================

function mostrarNotificacao(mensagem, tipo = 'info') {
    const icone = tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle';
    const cor   = tipo === 'success' ? '#4CAF50'       : tipo === 'error' ? '#f44336'            : '#2196F3';

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

// ================================================
// ============== INICIALIZAÇÃO ===================
// ================================================

if (refreshButton) {
    refreshButton.addEventListener('click', carregarLivros);
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Sistema iniciado!');
    
    await carregarTurmas();
    
    inicializarBuscaEFiltros();
    
    carregarLivros();
});

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
`;
document.head.appendChild(style);

console.log('✅ acervo.js carregado!');