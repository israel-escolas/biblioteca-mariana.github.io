// Abrir modal
const btnAddLivro = document.getElementById('btnAddLivro');
const modal = document.getElementById('modalLivro');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnCancelModal = document.getElementById('btnCancelModal');
const formLivro = document.getElementById('formLivro');

// Abrir modal
btnAddLivro.addEventListener('click', () => {
    modal.classList.add('active');
});

// Fechar modal
function closeModal() {
    modal.classList.remove('active');
    formLivro.reset(); // Limpa o formulário
}

btnCloseModal.addEventListener('click', closeModal);
btnCancelModal.addEventListener('click', closeModal);

// Fechar ao clicar fora do modal
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Salvar livro (AGORA COM IMAGEM)
formLivro.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Pegar a imagem se existir
    const imagemFile = document.getElementById('imagem').files[0];
    let imagemUrl = 'https://via.placeholder.com/200x300?text=Sem+Capa';
    
    if (imagemFile) {
        // Criar URL temporária da imagem
        imagemUrl = URL.createObjectURL(imagemFile);
    }
    
    // Coletar dados do formulário
    const livroData = {
        autor: document.getElementById('autor').value,
        titulo: document.getElementById('titulo').value,
        cbl: document.getElementById('cbl').value,
        categoria: document.getElementById('categoria').value,
        ano: document.getElementById('ano').value,
        editora: document.getElementById('editora').value,
        quantidade: document.getElementById('quantidade').value,
        imagem: imagemUrl
    };
    
    console.log('Livro adicionado:', livroData);
    
    // Aqui você pode adicionar a lógica para salvar o livro
    
    // Fechar modal e limpar formulário
    closeModal();
    
    // Mostrar mensagem de sucesso
    alert('Livro adicionado com sucesso!');
});