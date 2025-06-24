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

// Torna as funções disponíveis globalmente
window.utils = {
  formatDate,
  formatStatus
};