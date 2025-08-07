document.addEventListener('DOMContentLoaded', async () => {
  try {
    document.body.classList.add('loading');
    
    // 1. Aguarda Supabase estar pronto
    await ensureSupabaseReady();
    
    // 2. Verifica autenticação
    const user = await getCurrentUser();
    if (!user) return redirectToLogin();
    
    // 3. Carrega perfil do usuário
    const userProfile = await loadUserProfile(user.id);
    if (!userProfile) throw new Error('Perfil não encontrado');
    
    // 4. Atualiza UI
    updateUserUI(userProfile);
    toggleAdminSection(userProfile.is_admin);
    
    // 5. Carrega dados do dashboard
    await loadDashboardData();
    
  } catch (error) {
    const enhancedError = await enhanceSupabaseError(error);
    handleDashboardError(enhancedError);
  } finally {
    document.body.classList.remove('loading');
  }
});

// ========== FUNÇÕES AUXILIARES ========== //

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
    throw new Error(`Erro ao carregar perfil: ${error?.message || 'Dados não encontrados'}`);
  }
  return data;
}

function updateUserUI(userProfile) {
 const usernameEl = document.getElementById('username');
  const userIcon = document.querySelector('.user-info i');

  if (usernameEl) {
    usernameEl.textContent = userProfile?.name || 'Usuário';
    usernameEl.title = `Logado como: ${userProfile.name}`;
  }

  if (userIcon) {
    userIcon.classList.toggle('admin', userProfile?.is_admin);
    userIcon.title = userProfile?.is_admin ? 'Administrador' : 'Usuário';
  }
}

function toggleAdminSection(isAdmin) {
  const adminSection = document.getElementById('adminSection');
  if (adminSection) adminSection.style.display = isAdmin ? 'block' : 'none';
}

async function loadDashboardData() {
  try {
    const hoje = new Date();

    // Consulta paralela para melhor performance
    const [{ data: employees, error: empError }, { data: conflicts, error: confError }] = await Promise.all([
      supabase.from('employees').select('*, vacation_periods(start_date, end_date)'),
      supabase.rpc('get_conflicts').select('*').limit(100)
    ]);

    if (empError) throw empError;
    if (confError) throw confError;

     const stats = calculateVacationStats(employees, hoje);
    updateDashboardUI(stats, conflicts?.length || 0);

  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    throw error;
  }
}

function calculateVacationStats(employees = [], date = new Date()) {
  if (!employees?.length) return { total: 0, onVacation: 0, available: 0 };

  try {
    const total = employees.length;
    
    const onVacation = employees.filter(emp =>
      emp.vacation_periods?.some(p => {
        try {
          const inicio = new Date(p.start_date);
          const fim = new Date(p.end_date);
          return inicio <= date && date <= fim;
        } catch (e) {
          console.warn('Data inválida:', p);
          return false;
        }
      })
    ).length;

    const available = employees.filter(emp => {
      const hasActiveVacation = emp.vacation_periods?.some(p => {
        try {
          const inicio = new Date(p.start_date);
          const fim = new Date(p.end_date);
          return inicio <= date && date <= fim;
        } catch (e) {
          return false;
        }
      });
      return !hasActiveVacation && window.utils?.calcDisponibilidade?.(emp.hire_date, emp.last_vacation);
    }).length;

    return { total, onVacation, available };

  } catch (error) {
    console.error('Erro no cálculo:', error);
    return { total: 0, onVacation: 0, available: 0 };
  }
}

function updateDashboardUI(stats, conflictsCount) {
const updateElement = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  updateElement('totalEmployees', stats.total);
  updateElement('onVacation', stats.onVacation);
  updateElement('availableVacation', stats.available);
  updateElement('conflicts', conflictsCount);
}

async function enhanceSupabaseError(error) {
  if (error.supabaseError) return error;

  try {
    const { data: session, error: authError } = await supabase.auth.getSession();
    return {
      ...error,
      supabaseError: {
        authState: authError || session,
        tables: await supabase.rpc('list_tables').catch(e => e.message),
        lastRpcError: error.config?.url?.includes('/rpc/') ? {
          endpoint: error.config.url,
          payload: error.config.data
        } : null
      }
    };
  } catch (e) {
    return error;
  }
}

function handleDashboardError(error) {
  console.error('Erro completo:', error);

  let userMessage = 'Erro no sistema';
  let technicalDetails = '';

  if (error.message.includes('Perfil')) userMessage = 'Perfil não encontrado';
  if (error.supabaseError?.authState?.error) userMessage = 'Falha na autenticação';
  if (error.supabaseError?.lastRpcError) technicalDetails = `Função: ${error.supabaseError.lastRpcError.endpoint.split('/').pop()}`;

  Swal.fire({
    icon: 'error',
    title: 'Erro',
    html: `<p>${userMessage}</p><small>${technicalDetails}</small>`,
    footer: '<button id="debugBtn" class="swal-debug-btn">Detalhes</button>',
    willClose: () => window.location.href = 'login.html'
  }).then(() => {
    document.getElementById('debugBtn')?.addEventListener('click', () => {
      Swal.fire({
        title: 'Detalhes técnicos',
        html: `<pre style="text-align: left; font-size: 12px">${JSON.stringify(error, null, 2)}</pre>`,
        confirmButtonText: 'Fechar'
      });
    });
  });
}

function redirectToLogin() {
  window.location.href = 'login.html';
}