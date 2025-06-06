export function formatDateBR(dateStr) {
  const date = new Date(dateStr);
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

// Função para formatar data no padrão ISO (aaaa-mm-dd)
export function formatDateISO(dateStr) {
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0];
}

// Calcular dias restantes de férias
export function calcularDiasFaltantes(dataFim) {
  const hoje = new Date();
  const fim = new Date(dataFim);
  const diff = fim - hoje;

  if (diff < 0) return 0;

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Verificar se duas datas se sobrepõem
export function periodosSobrepostos(inicio1, fim1, inicio2, fim2) {
  return !(new Date(fim1) < new Date(inicio2) || new Date(inicio1) > new Date(fim2));
}

// Retorna true se a data fornecida está dentro do mês atual
export function estaNoMesAtual(dataStr) {
  const hoje = new Date();
  const data = new Date(dataStr);
  return (
    data.getFullYear() === hoje.getFullYear() &&
    data.getMonth() === hoje.getMonth()
  );
}

// Gera um ID aleatório (usado somente em situações não críticas)
export function gerarIdAleatorio(tamanho = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < tamanho; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}
