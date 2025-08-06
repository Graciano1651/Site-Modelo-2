 document.addEventListener('DOMContentLoaded', async () => {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const userProfile = await getUserProfile(user.id);
  const isAdmin = userProfile?.is_admin;

  document.getElementById('username').textContent = userProfile?.name || 'Usuário';

  await carregarDadosDashboard();
});

async function carregarDadosDashboard() {
  try {
    const hoje = new Date();
    
    // Busca funcionários com seus períodos de férias
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select(`
        *,
        vacation_periods (
          start_date,
          end_date
        )
      `);

    if (empError) throw empError;

    // Calcula estatísticas
    const totalFuncionarios = employees.length;
    
    const emFerias = employees.filter(emp => 
      emp.vacation_periods.some(p => {
        const inicio = new Date(p.start_date);
        const fim = new Date(p.end_date);
        return inicio <= hoje && hoje <= fim;
      })
    ).length;

    const disponiveis = employees.filter(emp => 
      !emp.vacation_periods.some(p => {
        const inicio = new Date(p.start_date);
        const fim = new Date(p.end_date);
        return inicio <= hoje && hoje <= fim;
      }) && 
      window.utils.calcDisponibilidade(emp.hire_date, emp.last_vacation)
    ).length;

    // Busca conflitos
    const { data: conflitos, error: conflitosError } = await supabase
      .rpc('get_conflicts');
    
    if (conflitosError) throw conflitosError;

    // Atualiza a UI
    document.getElementById('totalEmployees').textContent = totalFuncionarios;
    document.getElementById('onVacation').textContent = emFerias;
    document.getElementById('availableVacation').textContent = disponiveis;
    document.getElementById('conflicts').textContent = conflitos.length;

  } catch (err) {
    console.error('Erro ao carregar dados do dashboard:', err);
    Swal.fire('Erro', 'Não foi possível carregar os dados do dashboard', 'error');
  }
}