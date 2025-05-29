function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

function formatStatus(status) {
  const map = {
    'staff': 'Staff',
    'operacional': 'Operacional',
    'aprendiz': 'Aprendiz',
    'suspenso': 'Suspenso'
  };
  return map[status] || status;
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'staff': return 'badge-primary';
    case 'operacional': return 'badge-info';
    case 'aprendiz': return 'badge-warning';
    case 'suspenso': return 'badge-danger';
    default: return 'badge-secondary';
  }
}

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  document.getElementById('themeToggle').innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

function applySavedTheme() {
  const theme = localStorage.getItem('theme') || 'light';
  if (theme === 'dark') document.body.classList.add('dark-mode');
  document.getElementById('themeToggle').innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// Nova função para calcular disponibilidade de férias
function calcDisponibilidade(hireDate, lastVacation) {
  const ref = lastVacation ? new Date(lastVacation) : new Date(hireDate);
  const now = new Date();
  const months = (now.getFullYear() - ref.getFullYear()) * 12 + (now.getMonth() - ref.getMonth());
  return months >= 12;
}