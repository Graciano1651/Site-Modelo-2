async function ensureSupabaseReady() {
  return new Promise((resolve) => {
    if (window.supabase) return resolve();
    document.addEventListener('supabase-ready', () => resolve());
  });
}

// Carrega dados do dashboard
async function carregarDashboard() {
  try {
    const { data: funcionarios = [], error: errFunc } = await supabase
      .from('employees')
      .select('*');
    
    if (errFunc) throw errFunc;

    const { data: ferias = [], error: errFerias } = await supabase
      .from('vacation_periods')
      .select('*');

    if (errFerias) throw errFerias;

    return { funcionarios, ferias };
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    return { funcionarios: [], ferias: [] };
  }
}

// Atualiza a interface do usuário
function atualizarUI(funcionarios, ferias) {
  try {
    document.getElementById('totalEmployees').textContent = funcionarios.length;
    document.getElementById('onVacation').textContent = funcionarios.filter(f => f.on_vacation).length;
    document.getElementById('availableVacation').textContent = funcionarios.filter(f => 
      !f.on_vacation && calcDisponibilidade(f.hire_date, f.last_vacation)).length;
    document.getElementById('conflicts').textContent = detectarConflitos(ferias, funcionarios).length;
  } catch (error) {
    console.error('Erro ao atualizar UI:', error);
  }
}

// Funções originais mantidas
function detectarConflitos(ferias, funcionarios) {
  const conflitos = [];
  const funcionariosMap = {};
  
  funcionarios.forEach(f => {
    funcionariosMap[f.id] = f;
  });

  const porEquipe = {};
  ferias.forEach(f => {
    const funcionario = funcionariosMap[f.employee_id];
    if (!funcionario) return;

    const equipe = funcionario.team;
    if (!porEquipe[equipe]) porEquipe[equipe] = [];
    porEquipe[equipe].push({ ...f, funcionario });
  });

  for (const equipe in porEquipe) {
    const lista = porEquipe[equipe];
    for (let i = 0; i < lista.length; i++) {
      for (let j = i + 1; j < lista.length; j++) {
        if (periodosConflitantes(lista[i], lista[j])) {
          conflitos.push([lista[i], lista[j]]);
        }
      }
    }
  }

  return conflitos;
}

function periodosConflitantes(a, b) {
  const inicioA = new Date(a.start_date);
  const fimA = new Date(inicioA);
  fimA.setDate(inicioA.getDate() + a.days);

  const inicioB = new Date(b.start_date);
  const fimB = new Date(inicioB);
  fimB.setDate(inicioB.getDate() + b.days);

  return inicioA <= fimB && fimA >= inicioB;
}

// Inicialização principal
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await ensureSupabaseReady();
    
    // Verifica autenticação
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) {
      window.location.href = 'login.html';
      return;
    }

    // Controle de acesso
    if (currentUser.profile?.userType === 'admin') {
      document.getElementById('adminLinks').style.display = 'inline-block';
    }

    // Carrega dados
    const { funcionarios, ferias } = await carregarDashboard();
    atualizarUI(funcionarios, ferias);

    // Configura eventos
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('logoutBtn').addEventListener('click', () => {
      sessionStorage.removeItem('currentUser');
      window.location.href = 'login.html';
    });
    
    applySavedTheme();

  } catch (error) {
    console.error('Erro no dashboard:', error);
    alert('Erro ao carregar dashboard. Verifique o console.');
  }
});