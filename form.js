document.addEventListener('DOMContentLoaded', async () => {
  const user = getCurrentUser(); // agora usando a função global

  const urlParams = new URLSearchParams(window.location.search);
  const employeeId = urlParams.get('id');

  if (employeeId) {
    preencherFormulario(employeeId);
    document.getElementById('formTitle').textContent = 'Editar Funcionário';
  } else {
    document.getElementById('formTitle').textContent = 'Cadastrar Funcionário';
  }

  document.getElementById('employeeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const dados = obterDadosFormulario();
    if (!dados) return;

    try {
      if (employeeId) {
        await supabase
          .from('employees')
          .update(dados)
          .eq('id', employeeId);
        alert('Funcionário atualizado com sucesso!');
      } else {
        dados.created_by = user.id;
        await supabase
          .from('employees')
          .insert([dados]);
        alert('Funcionário cadastrado com sucesso!');
      }
      window.location.href = 'dashboard.html';
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error.message);
      alert('Erro ao salvar. Verifique o console.');
    }
  });
});

function obterDadosFormulario() {
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const department = document.getElementById('department').value;
  const tipo = document.getElementById('tipo').value;
  const hire_date = document.getElementById('hire_date').value;
  const status = document.getElementById('status').value;

  if (!name || !email || !hire_date) {
    alert('Por favor, preencha todos os campos obrigatórios.');
    return null;
  }

  return {
    name,
    email,
    department,
    tipo,
    hire_date,
    status
  };
}

async function preencherFormulario(id) {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Erro ao buscar funcionário:', error);
    alert('Erro ao carregar dados do funcionário.');
    return;
  }
  document.getElementById('name').value = data.name || '';
  document.getElementById('email').value = data.email || '';
  document.getElementById('department').value = data.department || '';
  document.getElementById('tipo').value = data.tipo || '';
  document.getElementById('hire_date').value = data.hire_date || '';
  document.getElementById('status').value = data.status || '';
}
