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

async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar perfil do usuário:', error);
    return null;
  }
}

// Formatar período de férias
function formatVacationPeriod(period) {
  if (!period) return 'N/A';
  return `${formatDate(period.start_date)} - ${formatDate(period.end_date)}`;
}

// Criar função RPC de conflitos no Supabase
async function createConflictsFunction() {
  await supabase.rpc(`
    create or replace function get_conflicts()
    returns table (
      employee1_name text,
      employee2_name text,
      team_name text,
      conflict_start date,
      conflict_end date
    ) as $$
    begin
      return query
      select 
        e1.name as employee1_name,
        e2.name as employee2_name,
        e1.team as team_name,
        greatest(v1.start_date, v2.start_date) as conflict_start,
        least(v1.end_date, v2.end_date) as conflict_end
      from 
        vacation_periods v1
        join vacation_periods v2 on 
          v1.employee_id != v2.employee_id and
          v1.team = v2.team and
          v1.start_date <= v2.end_date and 
          v2.start_date <= v1.end_date
        join employees e1 on v1.employee_id = e1.id
        join employees e2 on v2.employee_id = e2.id
      where 
        v1.employee_id < v2.employee_id;
    end;
    $$ language plpgsql;
  `);
}

// ===============================
// Função adicionada por mim 👇
// ===============================

/**
 * Calcula se o funcionário tem férias disponíveis com base na data de admissão e última saída.
 * Retorna true se já passou mais de 1 ano desde a última saída ou da contratação.
 */
window.utils = window.utils || {};
window.utils.calcDisponibilidade = function(hireDate, lastVacationDate) {
  const hoje = new Date();
  const dataBase = lastVacationDate ? new Date(lastVacationDate) : new Date(hireDate);
  const umAnoDepois = new Date(dataBase);
  umAnoDepois.setFullYear(umAnoDepois.getFullYear() + 1);
  return hoje >= umAnoDepois;
};

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

// =============================================
// FUNÇÃO DE VERIFICAÇÃO DE USUÁRIO LOGADO
// =============================================
function getCurrentUser() {
  const user = sessionStorage.getItem("currentUser");
  if (!user) {
    window.location.href = "login.html";
    throw new Error("Usuário não autenticado");
  }
  return JSON.parse(user);
}

window.getCurrentUser = getCurrentUser;

/**
 * Obtém os dados do usuário atualmente logado, incluindo se é admin.
 * @returns {Promise<Object|null>} Retorna o usuário ou null se não logado.
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    console.warn('Usuário não autenticado.');
    return null;
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    console.warn('Dados adicionais do usuário não encontrados.');
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    is_admin: userData.is_admin,
    ...userData
  };
}