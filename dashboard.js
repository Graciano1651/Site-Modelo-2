import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
  await carregarDashboard();
});

async function carregarDashboard() {
  try {
    const { data: funcionarios, error: erroFuncionarios } = await supabase
      .from('employees')
      .select('*');

    if (erroFuncionarios) throw erroFuncionarios;

    const { data: ferias, error: erroFerias } = await supabase
      .from('vacation_periods')
      .select('*');

    if (erroFerias) throw erroFerias;

    const totalFuncionarios = funcionarios.length;

    const emFerias = ferias.filter(p => {
      const hoje = new Date();
      const inicio = new Date(p.data_inicio);
      const fim = new Date(p.data_fim);
      return hoje >= inicio && hoje <= fim;
    });

    const funcionariosComFerias = new Set(ferias.map(p => p.employee_id));
    const comFeriasDisponiveis = funcionarios.filter(f => !funcionariosComFerias.has(f.id));

    const conflitos = detectarConflitos(ferias, funcionarios);

    // Atualiza blocos do dashboard
    document.getElementById('totalFuncionarios').textContent = totalFuncionarios;
    document.getElementById('emFerias').textContent = emFerias.length;
    document.getElementById('feriasDisponiveis').textContent = comFeriasDisponiveis.length;
    document.getElementById('conflitos').textContent = conflitos.length;

    // Clique para redirecionamento
    document.getElementById('blocoTotal').onclick = () => {
      window.location.href = 'index.html';
    };
    document.getElementById('blocoFerias').onclick = () => {
      window.location.href = 'list-em-ferias.html';
    };
    document.getElementById('blocoDisponiveis').onclick = () => {
      window.location.href = 'list-disponiveis.html';
    };
    document.getElementById('blocoConflitos').onclick = () => {
      window.location.href = 'list-conflitos.html';
    };
  } catch (e) {
    console.error('Erro ao carregar dados do dashboard:', e);
    alert('Erro ao carregar dados. Verifique o console.');
  }
}

function detectarConflitos(ferias, funcionarios) {
  const conflitos = [];

  // Agrupa por equipe
  const funcionariosMap = {};
  funcionarios.forEach(f => {
    funcionariosMap[f.id] = f;
  });

  const porEquipe = {};

  ferias.forEach(f => {
    const funcionario = funcionariosMap[f.employee_id];
    if (!funcionario) return;

    const equipe = funcionario.equipe;
    if (!porEquipe[equipe]) porEquipe[equipe] = [];
    porEquipe[equipe].push({ ...f, funcionario });
  });

  for (const equipe in porEquipe) {
    const lista = porEquipe[equipe];

    // Verifica sobreposição entre membros da mesma equipe
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
  const inicioA = new Date(a.data_inicio);
  const fimA = new Date(a.data_fim);
  const inicioB = new Date(b.data_inicio);
  const fimB = new Date(b.data_fim);

  return inicioA <= fimB && fimA >= inicioB;
}
