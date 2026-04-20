// ============================================
// CONFIGURAÇÕES GLOBAIS - BIBLIOTECA
// ============================================
// API Principal (Acervo e Didáticos)
const API_URL = 'https://script.google.com/macros/s/AKfycbxo61TuWCo-538Q6EaWJGYw748RZzB6u2CDQ07CNbH6hdgBLQUowIhOMjAPm58aknE/exec';

// API de Upload de Imagens
const API_UPLOAD_URL = 'https://script.google.com/macros/s/AKfycbxdJNG-QIXAZL2SYUO4bwkmdcJmujWXaUFqXcCGX5_XkqsY7qywl1AcgCOYk2m0Y5E/exec';

// API de Empréstimos
const API_EMPRESTIMO_URL = 'https://script.google.com/macros/s/AKfycbxjyfir-xM--j2QotMZ-PSM-X9t96EPh496OyhqThfLD3lXnTQM7gMp9J3DMra0nLg8/exec';

// API de Estudantes 
const API_ESTUDANTES_URL = 'https://script.google.com/macros/s/AKfycbyBITY6872yZXxMtRwOxEGqakIa6QeTNUD2QoBbrkjlbp2mE9vp0QjUB3joiNn5iEdg/exec';

// API de Atestados 
const API_ATESTADOS_URL = 'https://script.google.com/macros/s/AKfycbzqG--WPruWDk_IeJv7cByXKgGT7MF1-TKHyi0gD_2MvU-CHkOoPQGkBlCPY76S-Vw/exec';


const API_URL_ALUNO = API_ESTUDANTES_URL;
const PASTAS_DRIVE = {
    LIVROS: '1AQv6okGDhUHEuFH5yo7s66BFRYXE3TNv',      
    ATESTADOS: '1hp-uuqN3Tp92ctHv43zpbjqhVZwJxcIF'  
};

console.log('✅ Configurações carregadas!');