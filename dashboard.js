async function ensureSupabaseReady() {
  return new Promise((resolve) => {
    if (window.supabase) return resolve();
    document.addEventListener('supabase-ready', () => resolve());
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await ensureSupabaseReady();
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  const { funcionarios, ferias } = await carregarDashboard();
  atualizarUI(funcionarios, ferias);
});

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

 function atualizarUI(funcionarios, ferias) {
  try {
    const hoje = new Date();
    const emFeriasIds = new Set(
      ferias.filter(p => {
        const inicio = new Date(p.start);
        const fim = new Date(p.end);
        return inicio <= hoje && hoje <= fim;
      }).map(p => p.employee_id)
    );

    const total = funcionarios.length;
    const emFerias = funcionarios.filter(f => emFeriasIds.has(f.id)).length;
    const disponiveis = funcionarios.filter(f => !emFeriasIds.has(f.id)).length;
    const conflitos = detectarConflitos(ferias, funcionarios).length;

    document.getElementById('totalEmployees').textContent = total;
    document.getElementById('onVacation').textContent = emFerias;
    document.getElementById('availableVacation').textContent = disponiveis;
    document.getElementById('conflicts').textContent = conflitos;
  } catch (error) {
    console.error('Erro ao atualizar UI:', error);
  }
}

 function detectarConflitos(ferias, funcionarios) {
  const conflitos = [];
  const equipeMap = {};

  ferias.forEach(p => {
    const funcionario = funcionarios.find(f => f.id === p.employee_id);
    if (!funcionario) return;

    const equipe = funcionario.team;
    if (!equipeMap[equipe]) equipeMap[equipe] = [];

    equipeMap[equipe].push({ ...p, funcionario });
  });

  for (const equipe in equipeMap) {
    const lista = equipeMap[equipe];
    for (let i = 0; i < lista.length; i++) {
      for (let j = i + 1; j < lista.length; j++) {
        if (sobrepoe(lista[i], lista[j])) {
          conflitos.push([lista[i].funcionario.name, lista[j].funcionario.name]);
        }
      }
    }
  }

  return conflitos;
}

function sobrepoe(a, b) {
  const aInicio = new Date(a.start);
  const aFim = new Date(a.end);
  const bInicio = new Date(b.start);
  const bFim = new Date(b.end);
  return aInicio <= bFim && bInicio <= aFim;
}
 