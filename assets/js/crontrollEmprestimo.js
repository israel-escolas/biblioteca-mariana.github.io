document.addEventListener('DOMContentLoaded', function() {
    
    const modalEmprestimo = document.getElementById('modalEmprestimo');
    const btnCloseModalEmprestimo = document.getElementById('btnCloseModalEmprestimo');
    const btnCancelModalEmprestimo = document.getElementById('btnCancelModalEmprestimo');
    const formEmprestimo = document.getElementById('formEmprestimo');
    const livroInput = document.getElementById('livro');
    
    let livroAtual = null;
    
    function openModalEmprestimo(tituloLivro) {
        if (!modalEmprestimo) return;
        
        livroInput.value = tituloLivro;
        livroAtual = tituloLivro;
        
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('data_emprestimo').value = hoje;
        
        const dataDevolucao = new Date();
        dataDevolucao.setDate(dataDevolucao.getDate() + 15);
        document.getElementById('data_devolucao').value = dataDevolucao.toISOString().split('T')[0];
        
        modalEmprestimo.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeModalEmprestimo() {
        if (!modalEmprestimo) return;
        modalEmprestimo.classList.remove('active');
        document.body.style.overflow = '';
        formEmprestimo.reset();
        livroAtual = null;
    }
    
    const botoesEmprestimo = document.querySelectorAll('.livro-card button');
    botoesEmprestimo.forEach((botao, index) => {
        botao.addEventListener('click', (e) => {
            e.preventDefault();
            
            const card = botao.closest('.livro-card');
            const tituloLivro = card.querySelector('.livro-titulo').textContent;
            
            openModalEmprestimo(tituloLivro);
        });
    });
    
    if (btnCloseModalEmprestimo) {
        btnCloseModalEmprestimo.addEventListener('click', closeModalEmprestimo);
    }
    
    if (btnCancelModalEmprestimo) {
        btnCancelModalEmprestimo.addEventListener('click', closeModalEmprestimo);
    }

    if (formEmprestimo) {
        formEmprestimo.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const emprestimoData = {
                livro: document.getElementById('livro').value,
                estudante: document.getElementById('estudante').value,
                data_emprestimo: document.getElementById('data_emprestimo').value,
                data_devolucao: document.getElementById('data_devolucao').value,
                observacoes: document.getElementById('observacoes').value,
                status: 'Em andamento'
            };
            
            console.log('Empréstimo realizado:', emprestimoData);
            
            alert(`Empréstimo do livro "${emprestimoData.livro}" para ${emprestimoData.estudante} realizado com sucesso!`);
            
            closeModalEmprestimo();
        });
    }
    
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                const novosBotoes = document.querySelectorAll('.livro-card button');
                novosBotoes.forEach(botao => {
                    botao.removeEventListener('click', () => {});
                    botao.addEventListener('click', (e) => {
                        e.preventDefault();
                        const card = botao.closest('.livro-card');
                        const tituloLivro = card.querySelector('.livro-titulo').textContent;
                        openModalEmprestimo(tituloLivro);
                    });
                });
            }
        });
    });
    
    const cardsContainer = document.querySelector('.cards-livros');
    if (cardsContainer) {
        observer.observe(cardsContainer, { childList: true, subtree: true });
    }
    
});