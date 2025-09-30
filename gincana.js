<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>

<script>
// =============================================
// CONFIGURAÇÃO FIREBASE - SINCRONIZAÇÃO REAL
// =============================================

// Dados iniciais
let teams = {};
let events = [];
let currentUser = null;

// Credenciais de administrador
const adminCredentials = {
    username: "admin",
    password: "gincana2023"
};

// Cores disponíveis para equipes
const teamColors = {
    'red': { name: 'Vermelho', class: 'red' },
    'blue': { name: 'Azul', class: 'blue' },
    'green': { name: 'Verde', class: 'green' },
    'yellow': { name: 'Amarelo', class: 'yellow' },
    'purple': { name: 'Roxo', class: 'purple' },
    'orange': { name: 'Laranja', class: 'orange' }
};

// Categorias
const categories = {
    '1': 'Ensino Fundamental I (6º e 7º Anos)',
    '2': 'Ensino Fundamental II (8º e 9º Anos)',
    '3': 'Ensino Médio'
};

// =============================================
// CONFIGURAÇÃO FIREBASE (VOCÊ VAI ATUALIZAR ISSO)
// =============================================
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "seu-projeto.firebaseapp.com",
    projectId: "seu-projeto-id",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "123456789",
    appId: "seu-app-id"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// =============================================
// SISTEMA DE SINCRONIZAÇÃO FIREBASE
// =============================================

// Carregar dados do Firestore
async function loadData() {
    try {
        console.log('🔍 Carregando dados do Firestore...');
        
        const doc = await db.collection('gincana').doc('dados').get();
        
        if (doc.exists) {
            const data = doc.data();
            teams = data.teams || {};
            events = data.events || [];
            console.log('✅ Dados carregados do Firestore');
        } else {
            console.log('📝 Nenhum dado no Firestore, inicializando...');
            initializeSampleData();
        }
        
        updateUI();
        
        // Escutar atualizações em tempo real
        db.collection('gincana').doc('dados')
            .onSnapshot((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    teams = data.teams || {};
                    events = data.events || {};
                    updateUI();
                    showUpdateNotification();
                    console.log('🔄 Dados atualizados em tempo real!');
                }
            });
            
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        initializeSampleData();
    }
}

// Salvar dados no Firestore
async function saveData() {
    try {
        const data = {
            teams: teams,
            events: events,
            lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: currentUser?.username || 'public'
        };
        
        await db.collection('gincana').doc('dados').set(data);
        console.log('💾 Dados salvos no Firestore');
        
    } catch (error) {
        console.error('❌ Erro ao salvar dados:', error);
        showConnectionError();
    }
}

// =============================================
// FUNÇÕES PRINCIPAIS (MANTIDAS)
// =============================================

function updateUI() {
    updateEventDropdown();
    updateTeamDropdowns();
    updatePublicRanking();
    
    if (currentUser) {
        document.getElementById('totalPoints').textContent = calculateTotalPoints();
        document.getElementById('totalTeams').textContent = Object.keys(teams).length;
        document.getElementById('totalEvents').textContent = events.filter(e => !e.isSystem).length;
        
        updateRanking();
        updateRecentActivities();
        updateEventsList();
        updateTeamsList();
        updateCategoryRankings();
    }
}

function updatePublicRanking() {
    const publicRankingElement = document.getElementById('publicRanking');
    publicRankingElement.innerHTML = '';
    
    const sortedTeams = Object.entries(teams)
        .map(([id, team]) => ({ id, ...team }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    
    if (sortedTeams.length === 0) {
        publicRankingElement.innerHTML = '<p style="padding: 1rem; text-align: center; color: #666;">Nenhuma pontuação ainda</p>';
        return;
    }
    
    sortedTeams.forEach(team => {
        const div = document.createElement('div');
        div.className = 'ranking-item';
        div.innerHTML = `
            <span class="ranking-team">${team.name}</span>
            <span class="ranking-score">${team.score} pts</span>
        `;
        publicRankingElement.appendChild(div);
    });
}

// ... (mantenha todas as outras funções de UI do código anterior)

function addPoints() {
    const eventSelect = document.getElementById('event');
    const teamSelect = document.getElementById('team');
    const pointsInput = document.getElementById('points');
    const reasonInput = document.getElementById('reason');
    
    const eventId = eventSelect.value;
    const teamId = teamSelect.value;
    const points = parseInt(pointsInput.value);
    const reason = reasonInput.value;
    
    if (!eventId || !teamId || !points || !reason) {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    
    const event = events.find(e => e.id === eventId);
    if (!event) {
        alert('Evento não encontrado.');
        return;
    }
    
    teams[teamId].score += points;
    
    teams[teamId].pointsHistory.push({
        type: 'addition',
        event: eventId,
        eventName: event.name,
        points: points,
        reason: reason,
        timestamp: new Date().toLocaleString()
    });
    
    saveData(); // Agora salva no Firestore
    updateUI();
    
    const successMessage = document.getElementById('successMessage');
    successMessage.style.display = 'block';
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 3000);
    
    eventSelect.value = '';
    teamSelect.value = '';
    pointsInput.value = '';
    reasonInput.value = '';
}

// ... (mantenha todas as outras funções)

// =============================================
// DADOS INICIAIS
// =============================================

function initializeSampleData() {
    events = [
        {
            id: 'event_quiz',
            name: 'Quiz Cultural',
            maxPoints: 150,
            location: 'Auditório',
            time: '15:30',
            description: 'Competição de perguntas sobre cultura geral',
            isSystem: false
        }
        // ... (mantenha os outros eventos)
    ];
    
    teams = {
        'team_6ano': {
            name: '6º Ano',
            color: 'red',
            category: '1',
            score: 320,
            pointsHistory: []
        }
        // ... (mantenha as outras equipes)
    };
    
    saveData(); // Salva no Firestore
}

// =============================================
// INICIALIZAÇÃO
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎉 Sistema de Gincana com Firebase Iniciado!');
    loadData();
});
</script>
