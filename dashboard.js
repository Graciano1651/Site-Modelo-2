document.addEventListener('DOMContentLoaded', function () {
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
  loadDashboard();
  setInterval(loadDashboard, 60000);
});

function loadDashboard() {
  const employees = JSON.parse(localStorage.getItem('employees')) || [];
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const onVacation = employees.filter(e => {
    if (!e.onVacation || !e.vacationStartDate) return false;
    const start = new Date(e.vacationStartDate);
    return start.getMonth() === currentMonth && start.getFullYear() === currentYear;
  });

  const available = employees.filter(e => {
    if (e.onVacation) return false;
    const refDate = e.lastVacation ? new Date(e.lastVacation) : new Date(e.hireDate);
    const monthsDiff = (today.getFullYear() - refDate.getFullYear()) * 12 + (today.getMonth() - refDate.getMonth());
    return monthsDiff >= 12;
  });

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

  document.getElementById('totalEmployees').textContent = employees.length;
  document.getElementById('onVacation').textContent = onVacation.length;
  document.getElementById('availableVacation').textContent = available.length;
  document.getElementById('conflicts').textContent = conflictCount;
}
