document.addEventListener('DOMContentLoaded', async () => {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const userProfile = await getUserProfile(user.id);
  const isAdmin = userProfile?.is_admin;

  const cadastrarBtn = document.getElementById('cadastrarFuncionarioBtn');
  if (cadastrarBtn) {
    cadastrarBtn.style.display = isAdmin ? 'inline-block' : 'none';
  }

  document.getElementById('username').textContent = userProfile?.username || 'Usuário';

  await carregarDadosDashboard();
});

async function carregarDadosDashboard() {
  try {
    const { data: employees, error } = await supabase
      .from('employees')
      .select('*');

    if (error) throw error;

    const totalArmarios = employees.length;
    const b2c = employees.filter(emp => emp.tipo === 'B2C').length;
    const b2b = employees.filter(emp => emp.tipo === 'B2B').length;

    document.getElementById('totalArmarios').textContent = totalArmarios;
    document.getElementById('b2c').textContent = b2c;
    document.getElementById('b2b').textContent = b2b;

    const agora = new Date();
    const mesAtual = agora.getMonth() + 1;
    const anoAtual = agora.getFullYear();

    const { data: ferias, error: feriasError } = await supabase
      .from('vacation_periods')
      .select('employee_id, start_date')
      .gte('start_date', `${anoAtual}-${mesAtual.toString().padStart(2, '0')}-01`)
      .lte('start_date', `${anoAtual}-${mesAtual.toString().padStart(2, '0')}-31`);

    if (feriasError) throw feriasError;

    const emFeriasIds = ferias.map(f => f.employee_id);
    const concluidos = employees.filter(emp => emFeriasIds.includes(emp.id)).length;
    const pendentes = employees.filter(emp => !emp.ferias_confirmadas).length;
    const propensos = employees.filter(emp =>
      emp.status === 'ativo' && emp.ferias_disponiveis
    ).length;

    document.getElementById('concluidos').textContent = concluidos;
    document.getElementById('pendentes').textContent = pendentes;
    document.getElementById('propensos').textContent = propensos;
  } catch (err) {
    console.error('Erro ao carregar dados do dashboard:', err.message);
  }
}
