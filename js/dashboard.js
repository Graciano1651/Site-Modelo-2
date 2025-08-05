import { getCurrentUser } from './utils.js';
import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await getCurrentUser();
  // Verificar se é admin e mostrar botão de cadastro
  const cadastroBtn = document.getElementById('btnCadastro');
  if (user?.is_admin) {
    cadastroBtn.style.display = 'inline-block'; // ou 'flex', conforme o layout
  } else if (cadastroBtn) {
    cadastroBtn.style.display = 'none';
  }

  await carregarResumoDashboard();
});

async function carregarResumoDashboard() {
  const { data: employees, error } = await supabase
    .from('employees')
    .select('id, nome');

  const { data: ferias, error: errorFerias } = await supabase
    .from('vacation_periods')
    .select('*');

  if (error || errorFerias) {
    console.error('Erro ao carregar dados do Supabase:', error || errorFerias);
    return;
  }

  const totalFuncionarios = employees.length;
  const agora = new Date();
  const mesAtual = agora.getMonth() + 1;
  const anoAtual = agora.getFullYear();

  const emFerias = ferias.filter(f => {
    const inicio = new Date(f.inicio);
    const fim = new Date(f.fim);
    return inicio.getMonth() + 1 === mesAtual && inicio.getFullYear() === anoAtual;
  });

  const disponiveis = employees.filter(emp => {
    const feriasDoFuncionario = ferias.filter(f => f.funcionario_id === emp.id);
    return feriasDoFuncionario.length === 0;
  });

  const conflitos = detectarConflitos(ferias);

  document.getElementById('totalFuncionarios').textContent = totalFuncionarios;
  document.getElementById('totalEmFerias').textContent = emFerias.length;
  document.getElementById('totalDisponiveis').textContent = disponiveis.length;
  document.getElementById('totalConflitos').textContent = conflitos.length;
}

function detectarConflitos(ferias) {
  const conflitos = [];

  const agrupadosPorEquipe = {};
  for (const f of ferias) {
    if (!agrupadosPorEquipe[f.equipe]) agrupadosPorEquipe[f.equipe] = [];
    agrupadosPorEquipe[f.equipe].push(f);
  }

  for (const equipe in agrupadosPorEquipe) {
    const periodos = agrupadosPorEquipe[equipe];
    for (let i = 0; i < periodos.length; i++) {
      for (let j = i + 1; j < periodos.length; j++) {
        const a = periodos[i];
        const b = periodos[j];

        const aInicio = new Date(a.inicio);
        const aFim = new Date(a.fim);
        const bInicio = new Date(b.inicio);
        const bFim = new Date(b.fim);

        const sobrepoe = aInicio <= bFim && bInicio <= aFim;
        if (sobrepoe) {
          conflitos.push({ a, b });
        }
      }
    }
  }

  return conflitos;
}
