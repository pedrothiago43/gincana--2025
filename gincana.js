// O sistema usa localStorage compartilhado + eventos
localStorage.setItem('gincana_escolar_shared_data', dados);

// Dispara eventos para outras abas
window.dispatchEvent(new CustomEvent('gincanaDataUpdated'));

// Escuta por mudanças
window.addEventListener('storage', function(event) {
    // Atualiza quando outros usuários fazem mudanças
});