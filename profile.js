import { supabase } from 'supabase.js';

const params = new URLSearchParams(window.location.search);
const funcionarioId = params.get('id');

if (!funcionarioId) {
  alert('Funcionário não encontrado.');
  window.location.href = 'dashboard.html';
}

// Carrega dados do funcionário
async function carregarPerfil() {
  const { data: funcionario, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', funcionarioId)
    .single();

  if (error || !funcionario) {
    alert('Erro ao carregar funcionário.');
    console.error(error);
    return;
  }

  document.getElementById('nome').textContent = funcionario.name;
  document.getElementById('email').textContent = funcionario.role;
  document.getElementById('equipe').textContent = funcionario.team;

  const { data: ferias, error: errorFerias } = await supabase
    .from('vacation_periods')
    .select('*')
    .eq('employee_id', funcionarioId)
    .order('start', { ascending: true });

  if (errorFerias) {
    console.error('Erro ao carregar períodos de férias:', errorFerias);
    return;
  }

  const lista = document.getElementById('listaFerias');
  lista.innerHTML = '';

  ferias.forEach(p => {
    const li = document.createElement('li');
    li.textContent = `${formatarData(p.start)} até ${formatarData(p.end)}`;
    lista.appendChild(li);
  });
}

function formatarData(data) {
  return new Date(data).toLocaleDateString('pt-BR');
}

// Botão Voltar
document.getElementById('voltar').addEventListener('click', () => {
  history.back();
});

// Iniciar carregamento
carregarPerfil();
