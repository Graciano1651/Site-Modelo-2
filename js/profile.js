document.addEventListener('DOMContentLoaded', async () => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const employeeId = params.get('id');
    if (!employeeId) {
      Swal.fire('Erro', 'Funcionário não especificado.', 'error');
      window.location.href = 'dashboard.html';
      return;
    }

    const { data: employee, error } = await supabase
      .from('employees')
      .select(`
        *,
        vacation_periods (
          *
        )
      `)
      .eq('id', employeeId)
      .single();

    if (error || !employee) {
      throw error || new Error('Funcionário não encontrado');
    }

    preencherPerfil(employee, user);
  } catch (error) {
    console.error('Erro:', error);
    Swal.fire('Erro', error.message, 'error');
    window.location.href = 'dashboard.html';
}
 });

function preencherPerfil(employee, currentUser) {
  // Preenche os dados básicos
  document.getElementById('nome').textContent = employee.name;
  document.getElementById('email').textContent = employee.email;
  document.getElementById('departamento').textContent = employee.department;
  document.getElementById('cargo').textContent = employee.role;
  document.getElementById('equipe').textContent = employee.team;

  // Mostra/oculta botão de edição
  const editBtn = document.getElementById('editBtn');
  if (currentUser.is_admin || currentUser.id === employee.created_by) {
    editBtn.style.display = 'inline-block';
    editBtn.addEventListener('click', () => {
      window.location.href = `cadastro.html?id=${employee.id}`;
    });
  } else {
    editBtn.style.display = 'none';
  }

  // Preenche histórico de férias
  const historyTable = document.getElementById('historyTable');
  if (employee.vacation_periods?.length > 0) {
    employee.vacation_periods.forEach(period => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${formatDate(period.start_date)}</td>
        <td>${formatDate(period.end_date)}</td>
        <td>${period.days} dias</td>
      `;
      historyTable.appendChild(row);
    });
  } else {
    historyTable.innerHTML = `
      <tr>
        <td colspan="3">Nenhum período de férias registrado</td>
      </tr>
    `;
  }
}