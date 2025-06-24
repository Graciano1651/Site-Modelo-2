function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
}

function formatStatus(status) {
  const statusMap = {
    staff: 'Staff',
    operacional: 'Operacional',
    aprendiz: 'Aprendiz',
    suspenso: 'Suspenso'
  };
  return statusMap[status] || status;
}

// =============================================
// FUNÇÕES DE TEMA (CORREÇÃO DO ERRO ATUAL)
// =============================================
function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
  updateThemeIcon();
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem('darkMode');
  if (savedTheme === 'enabled') {
    document.body.classList.add('dark-mode');
  }
  updateThemeIcon();
}

function updateThemeIcon() {
  const icon = document.querySelector('#themeToggle i');
  if (icon) {
    icon.className = document.body.classList.contains('dark-mode') 
      ? 'fas fa-sun' 
      : 'fas fa-moon';
  }
}

// =============================================
// FUNÇÕES DE DISPONIBILIDADE (ORIGINAIS)
// =============================================
function calcDisponibilidade(hireDate, lastVacationDate) {
  if (!hireDate) return false;
  
  const now = new Date();
  const hire = new Date(hireDate);
  const lastVac = lastVacationDate ? new Date(lastVacationDate) : hire;
  
  const monthsSinceHire = (now.getFullYear() - hire.getFullYear()) * 12 
    + (now.getMonth() - hire.getMonth());
  
  const monthsSinceLastVac = (now.getFullYear() - lastVac.getFullYear()) * 12 
    + (now.getMonth() - lastVac.getMonth());
  
  return monthsSinceHire >= 12 && monthsSinceLastVac >= 12;
}

// =============================================
// EXPORTAÇÃO DAS FUNÇÕES (MANTENDO COMPATIBILIDADE)
// =============================================
window.utils = {
  formatDate,
  formatStatus,
  calcDisponibilidade
};

// Disponibiliza funções de tema globalmente
window.toggleTheme = toggleTheme;
window.applySavedTheme = applySavedTheme;