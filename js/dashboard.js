document.addEventListener('DOMContentLoaded', async () => {
  try {
    document.body.classList.add('loading');
    
    // 1. Aguardar Supabase
    await ensureSupabaseReady();
    
    // 2. Verificar autenticação
    const user = await getCurrentUser();
    if (!user) return redirectToLogin();
    
    // 3. Carregar perfil
    const userProfile = await loadUserProfile(user.id);
    
    // 4. Atualizar UI
    updateUserUI(userProfile);
    toggleAdminSection(userProfile.is_admin);
    
    // 5. Carregar dados
    await loadDashboardData();
    
  } catch (error) {
    handleDashboardError(error);
  } finally {
    document.body.classList.remove('loading');
  }
});

// --- Funções Auxiliares --- //

async function ensureSupabaseReady() {
  return new Promise((resolve) => {
    if (window.supabase) return resolve();
    document.addEventListener('supabase-ready', resolve, { once: true });
  });
}

async function loadUserProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error('Perfil não encontrado');
  }
  return data;
}

function updateUserUI(userProfile) {
  const safeName = userProfile?.name || 'Usuário';
  
  // Atualizar nome
  const usernameEl = document.getElementById('username');
  if (usernameEl) {
    usernameEl.textContent = safeName;
    usernameEl.title = `Logado como: ${safeName}`;
  }
  
  // Ícone de admin
  const userIcon = document.querySelector('.user-info i');
  if (userIcon) {
    userIcon.classList.toggle('admin', userProfile?.is_admin);
    userIcon.title = userProfile?.is_admin ? 'Administrador' : 'Usuário';
  }
}

function toggleAdminSection(isAdmin) {
  const adminSection = document.getElementById('adminSection');
  if (adminSection) {
    adminSection.style.display = isAdmin ? 'block' : 'none';
  }
}

async function loadDashboardData() {
   try {
    const hoje = new Date();
    
    // Consultas otimizadas
    const [{ data: employees }, { data: conflicts }] = await Promise.all([
      supabase.from('employees').select('*, vacation_periods(start_date, end_date)'),
      supabase.rpc('get_conflicts')
    ]);
    
    // Cálculos
    const stats = calculateVacationStats(employees, hoje);
    
    // Atualizar UI
    updateDashboardUI(stats, conflicts?.length || 0);
    
  } catch (error) {
    console.error('Erro nos dados:', error);
    throw error;
  }
}

function calculateVacationStats(employees, date) {
  // Lógica de cálculo permanece igual
  return { total, onVacation, available };
}

function updateDashboardUI(stats, conflictsCount) {
  // Atualização segura dos elementos
  const updateElement = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  
  updateElement('totalEmployees', stats.total);
  updateElement('onVacation', stats.onVacation);
  updateElement('availableVacation', stats.available);
  updateElement('conflicts', conflictsCount);
}

function handleDashboardError(error) {
  console.error('Erro no dashboard:', error);
  
  // Feedback amigável
  const message = error.message.includes('Perfil')
    ? 'Seu perfil não foi encontrado'
    : 'Erro ao carregar dados';
    
  Swal.fire({
    icon: 'error',
    title: 'Oops...',
    text: message,
    willClose: () => window.location.href = 'login.html'
  });
}
