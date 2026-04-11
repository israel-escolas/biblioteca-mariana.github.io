// Aguardar o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    
    // Elementos do modal de empréstimo
    const modalEmprestimo = document.getElementById('modalEmprestimo');
    const btnCloseModalEmprestimo = document.getElementById('btnCloseModalEmprestimo');
    const btnCancelModalEmprestimo = document.getElementById('btnCancelModalEmprestimo');
    const formEmprestimo = document.getElementById('formEmprestimo');
    const livroInput = document.getElementById('livro');
    
    // Variável para armazenar o livro atual
    let livroAtual = null;
    
    // Função para abrir modal de empréstimo
    function openModalEmprestimo(tituloLivro) {
        if (!modalEmprestimo) return;
        
        // Pré-preenche o campo do livro
        livroInput.value = tituloLivro;
        livroAtual = tituloLivro;
        
        // Preenche a data atual automaticamente
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('data_emprestimo').value = hoje;
        
        // Calcula data de devolução (15 dias após)
        const dataDevolucao = new Date();
        dataDevolucao.setDate(dataDevolucao.getDate() + 15);
        document.getElementById('data_devolucao').value = dataDevolucao.toISOString().split('T')[0];
        
        // Abre o modal
        modalEmprestimo.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // Função para fechar modal de empréstimo
    function closeModalEmprestimo() {
        if (!modalEmprestimo) return;
        modalEmprestimo.classList.remove('active');
        document.body.style.overflow = '';
        formEmprestimo.reset();
        livroAtual = null;
    }
    
    // Adicionar evento de clique em todos os botões de empréstimo
    const botoesEmprestimo = document.querySelectorAll('.livro-card button');
    botoesEmprestimo.forEach((botao, index) => {
        botao.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Encontrar o card do livro
            const card = botao.closest('.livro-card');
            const tituloLivro = card.querySelector('.livro-titulo').textContent;
            
            // Abrir modal com o título do livro
            openModalEmprestimo(tituloLivro);
        });
    });
    
    // Fechar modal apenas com os botões (NÃO FECHA MAIS CLICANDO FORA)
    if (btnCloseModalEmprestimo) {
        btnCloseModalEmprestimo.addEventListener('click', closeModalEmprestimo);
    }
    
    if (btnCancelModalEmprestimo) {
        btnCancelModalEmprestimo.addEventListener('click', closeModalEmprestimo);
    }
    
    // REMOVIDO: evento que fechava ao clicar fora do modal
    // Agora o modal SÓ fecha clicando em Fechar ou Cancelar
    
    // Salvar empréstimo
    if (formEmprestimo) {
        formEmprestimo.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Coletar dados do empréstimo
            const emprestimoData = {
                livro: document.getElementById('livro').value,
                estudante: document.getElementById('estudante').value,
                data_emprestimo: document.getElementById('data_emprestimo').value,
                data_devolucao: document.getElementById('data_devolucao').value,
                observacoes: document.getElementById('observacoes').value,
                status: 'Em andamento'
            };
            
            console.log('Empréstimo realizado:', emprestimoData);
            
            // Aqui você pode adicionar a lógica para salvar o empréstimo
            // Exemplo: enviar para API, salvar no localStorage, etc.
            
            // Mostrar mensagem de sucesso
            alert(`Empréstimo do livro "${emprestimoData.livro}" para ${emprestimoData.estudante} realizado com sucesso!`);
            
            // Fechar modal
            closeModalEmprestimo();
        });
    }
    
    // Se houver livros adicionados dinamicamente, usar MutationObserver
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                // Reaplicar eventos aos novos botões
                const novosBotoes = document.querySelectorAll('.livro-card button');
                novosBotoes.forEach(botao => {
                    // Remove event listener antigo se existir
                    botao.removeEventListener('click', () => {});
                    // Adiciona novo event listener
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
    
    // Observar mudanças no container de livros
    const cardsContainer = document.querySelector('.cards-livros');
    if (cardsContainer) {
        observer.observe(cardsContainer, { childList: true, subtree: true });
    }
    
});