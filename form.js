import { supabase } from './supabase.js';

// Carrega usuário logado
const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
if (!usuarioLogado || !usuarioLogado.is_admin) {
  alert('Apenas administradores podem acessar esta página.');
  window.location.href = 'login.html';
}

// Preenche o campo de ID oculto para edição
const params = new URLSearchParams(window.location.search);
const funcionarioId = params.get('id');

if (funcionarioId) {
  carregarFuncionario(funcionarioId);
}

async function carregarFuncionario(id) {
  const { data: funcionario, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    alert('Erro ao carregar funcionário.');
    console.error(error);
    return;
  }

  document.getElementById('nome').value = funcionario.nome;
  document.getElementById('email').value = funcionario.email;
  document.getElementById('equipe').value = funcionario.equipe;

  const { data: ferias, error: errorFerias } = await supabase
    .from('vacation_periods')
    .select('*')
    .eq('employee_id', id);

  if (errorFerias) {
    console.error('Erro ao carregar férias', errorFerias);
    return;
  }

  const feriasContainer = document.getElementById('feriasContainer');
  feriasContainer.innerHTML = '';

  ferias.forEach((ferias, index) => {
    adicionarPeriodoFerias(ferias.data_inicio, ferias.data_fim);
  });
}

// Adiciona novo período de férias
document.getElementById('adicionarFerias').addEventListener('click', () => {
  adicionarPeriodoFerias();
});

function adicionarPeriodoFerias(dataInicio = '', dataFim = '') {
  const container = document.getElementById('feriasContainer');
  const div = document.createElement('div');
  div.classList.add('periodo-ferias');
  div.innerHTML = `
    <input type="date" class="inicio" value="${dataInicio}">
    <input type="date" class="fim" value="${dataFim}">
    <button type="button" class="remover">Remover</button>
  `;
  container.appendChild(div);

  div.querySelector('.remover').addEventListener('click', () => {
    div.remove();
  });
}

// Salvar funcionário e férias
document.getElementById('formFuncionario').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const equipe = document.getElementById('equipe').value.trim();

  let funcionarioIdFinal;

  if (funcionarioId) {
    // Atualiza funcionário existente
    const { error } = await supabase
      .from('employees')
      .update({ nome, email, equipe })
      .eq('id', funcionarioId);

    if (error) {
      alert('Erro ao atualizar funcionário.');
      console.error(error);
      return;
    }

    funcionarioIdFinal = funcionarioId;

    // Remove períodos antigos
    await supabase.from('vacation_periods').delete().eq('employee_id', funcionarioIdFinal);
  } else {
    // Insere novo funcionário
    const { data, error } = await supabase
      .from('employees')
      .insert([{ nome, email, equipe }])
      .select()
      .single();

    if (error || !data) {
      alert('Erro ao cadastrar funcionário.');
      console.error(error);
      return;
    }

    funcionarioIdFinal = data.id;
  }

  // Insere novos períodos de férias
  const periodos = document.querySelectorAll('.periodo-ferias');
  const feriasData = [];

  periodos.forEach(p => {
    const data_inicio = p.querySelector('.inicio').value;
    const data_fim = p.querySelector('.fim').value;

    if (data_inicio && data_fim) {
      feriasData.push({
        employee_id: funcionarioIdFinal,
        data_inicio,
        data_fim
      });
    }
  });

  if (feriasData.length > 0) {
    const { error } = await supabase.from('vacation_periods').insert(feriasData);

    if (error) {
      alert('Erro ao salvar períodos de férias.');
      console.error(error);
      return;
    }
  }

  alert('Funcionário salvo com sucesso!');
  window.location.href = 'dashboard.html';
});
