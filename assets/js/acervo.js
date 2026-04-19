// ============================================
// SISTEMA DE BIBLIOTECA - acervo.js
// ============================================

// ✅ URLs separadas: CRUD (Sheets) e Upload (Drive)
const API_URL        = 'https://script.google.com/macros/s/AKfycbwQE5Rh2LJlB0AGNQQwVHB0kFfrju8vzGhwxlsI6TwA9Tx5-iegXw91WXsGbEtJZEE/exec';
const API_UPLOAD_URL = 'https://script.google.com/macros/s/AKfycbzeI5tgdhy2bmIsTe5H8FRBWM8EJWZOXUbiZu8Qe3qpqexyYBHSA2dA7TYzH8JCzOGX/exec';

// ============== ELEMENTOS DO DOM ==============

const btnAddLivro      = document.getElementById('btnAddLivro');
const modal            = document.getElementById('modalLivro');
const btnCloseModal    = document.getElementById('btnCloseModal');
const btnCancelModal   = document.getElementById('btnCancelModal');
const formLivro        = document.getElementById('formLivro');
const refreshButton    = document.getElementById('refreshBooks');
const imagemInput      = document.getElementById('imagemLivro');
const previewContainer = document.getElementById('previewContainer');
const imagemPreview    = document.getElementById('imagemPreview');

// ============================================
// CONVERTER LINKS DO DRIVE
// ============================================

function converterLinksDrive(urlString) {
    if (!urlString || urlString.trim() === '') return [];

    const urls = urlString.split(',').map(url => url.trim()).filter(url => url !== '');
    const urlsConvertidas = [];

    urls.forEach(url => {
        // Formato: /d/FILE_ID/
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);

        if (match) {
            urlsConvertidas.push(`https://lh3.googleusercontent.com/d/${match[1]}`);
        }
        // Já é uma URL de imagem direta ou lh3 ou drive/uc
        else if (
            url.match(/\.(jpg|jpeg|png|gif|webp|bmp)/i) ||
            url.includes('lh3.googleusercontent.com') ||
            url.includes('drive.google.com/uc')
        ) {
            urlsConvertidas.push(url);
        }
        // Outros formatos do Drive com id=
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

// ============== UPLOAD DE IMAGEM ==============

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
        const base64Puro     = base64Completo.split(',')[1];

        const formData = new FormData();
        formData.append('data', base64Puro);
        formData.append('name', nomeArquivo);
        formData.append('mime', file.type);

        const response  = await fetch(API_UPLOAD_URL, { method: 'POST', body: formData });
        const resultado = await response.json();

        console.log('📨 Resposta do upload:', resultado);

        if (resultado.status === 'ok') {
            return { success: true, url: resultado.url };
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
        const editora    = document.getElementById('editora')?.value.trim() || '';
        const quantidade = document.getElementById('quantidade')?.value     || '1';

        if (!autor || !titulo || !cbl || !categoria || !ano || !editora) {
            mostrarNotificacao('❌ Preencha todos os campos obrigatórios!', 'error');
            return;
        }

        const submitBtn    = formLivro.querySelector('.btn-submit');
        const originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        submitBtn.disabled  = true;

        try {
            let linkImagem = '';

            // 1. Upload da imagem (se houver) → API_UPLOAD_URL
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

            // 2. Salvar livro na planilha → API_URL
            const livroData = {
                action:     'addBook',
                autor,
                titulo,
                cbl,
                categoria,
                ano:        parseInt(ano),
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

// ============== EXIBIR LIVROS ==============

function exibirLivros(livros) {
    const booksGrid = document.getElementById('booksGrid');
    if (!booksGrid) return;

    booksGrid.innerHTML = '';

    if (!livros || livros.length === 0) {
        booksGrid.innerHTML = '<p class="no-books"><i class="fas fa-book-open"></i> Nenhum livro cadastrado.</p>';
        return;
    }

    livros.forEach(livro => booksGrid.appendChild(criarCardLivro(livro)));
}

// ============== CRIAR CARD DO LIVRO ==============

function criarCardLivro(livro) {
    const card = document.createElement('div');
    card.className = 'livro-card';

    const img = document.createElement('img');
    img.className = 'livro-imagem';
    img.alt       = livro.titulo || livro.TITULO || 'Livro';

    // ✅ Converte o link do Drive para URL de exibição direta
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

// ============== MODAL DE EMPRÉSTIMO ==============

const modalEmprestimo = document.getElementById('modalEmprestimo');

function abrirModalEmprestimo(livro) {
    if (!modalEmprestimo) return;

    const inputLivro = document.getElementById('livro');
    if (inputLivro) inputLivro.value = livro.titulo || livro.TITULO || '';

    const hoje      = new Date().toISOString().split('T')[0];
    const devolucao = new Date();
    devolucao.setDate(devolucao.getDate() + 15);

    const dataEmprestimo = document.getElementById('data_emprestimo');
    const dataDevolucao  = document.getElementById('data_devolucao');
    if (dataEmprestimo) dataEmprestimo.value = hoje;
    if (dataDevolucao)  dataDevolucao.value  = devolucao.toISOString().split('T')[0];

    modalEmprestimo.classList.add('active');
}

function closeModalEmprestimo() {
    if (!modalEmprestimo) return;
    modalEmprestimo.classList.remove('active');
    document.getElementById('formEmprestimo')?.reset();
}

if (modalEmprestimo) {
    document.getElementById('btnCloseModalEmprestimo')?.addEventListener('click', closeModalEmprestimo);
    document.getElementById('btnCancelModalEmprestimo')?.addEventListener('click', closeModalEmprestimo);
    modalEmprestimo.addEventListener('click', (e) => {
        if (e.target === modalEmprestimo) closeModalEmprestimo();
    });
}

const formEmprestimo = document.getElementById('formEmprestimo');
if (formEmprestimo) {
    formEmprestimo.addEventListener('submit', (e) => {
        e.preventDefault();
        mostrarNotificacao('✅ Empréstimo registrado com sucesso!', 'success');
        closeModalEmprestimo();
    });
}

// ============== NOTIFICAÇÕES ==============

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
    `;

    document.body.appendChild(notificacao);
    setTimeout(() => notificacao.remove(), 3500);
}

// ============== INICIALIZAÇÃO ==============

if (refreshButton) {
    refreshButton.addEventListener('click', carregarLivros);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Sistema iniciado!');
    carregarLivros();
});

console.log('✅ acervo.js carregado!');