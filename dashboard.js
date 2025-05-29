document.addEventListener('DOMContentLoaded', async function () {
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  // Mostrar/ocultar links de admin
  document.getElementById('adminLinks').style.display = currentUser.isAdmin ? 'inline-block' : 'none';

  // Adicionar logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
  });

  applySavedTheme();
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  
  await loadDashboard();
  setInterval(loadDashboard, 60000);
});

async function loadDashboard() {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Buscar todos os funcionários
  const { data: employees, error } = await supabase.from('employees').select('*');

  if (error) {
    console.error('Erro ao carregar funcionários:', error);
    return;
  }

  // Filtrar funcionários em férias no mês atual
  const onVacation = employees.filter(e => {
    if (!e.on_vacation || !e.vacation_start_date) return false;
    const start = new Date(e.vacation_start_date);
    return start.getMonth() === currentMonth && start.getFullYear() === currentYear;
  });

  // Filtrar funcionários com férias disponíveis
  const available = employees.filter(e => {
    if (e.on_vacation) return false;
    return calcDisponibilidade(e.hire_date, e.last_vacation);
  });

  // Verificar conflitos por equipe
  const teams = {};
  onVacation.forEach(emp => {
    if (!teams[emp.team]) teams[emp.team] = [];
    teams[emp.team].push(emp);
  });

  let conflictCount = 0;
  for (const team in teams) {
    if (teams[team].length > 1) {
      conflictCount += teams[team].length - 1;
    }
  }

  // Atualizar UI
  document.getElementById('totalEmployees').textContent = employees.length;
  document.getElementById('onVacation').textContent = onVacation.length;
  document.getElementById('availableVacation').textContent = available.length;
  document.getElementById('conflicts').textContent = conflictCount;
}