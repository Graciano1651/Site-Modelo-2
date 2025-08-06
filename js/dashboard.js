document.addEventListener('DOMContentLoaded', async () => {
  // Ativa estado de loading
  document.body.classList.add('loading');
  
  try {
    // Debug: verificar tempo de carregamento
    console.time('DashboardInitialization');
    
    // 1. Aguardar inicialização do Supabase
    await new Promise((resolve) => {
      if (window.supabase) {
        console.log('Supabase já carregado');
        return resolve();
      }
      console.log('Aguardando supabase-ready...');
      document.addEventListener('supabase-ready', resolve, { once: true });
    });

    // 2. Verificar autenticação do usuário
    const user = await getCurrentUser();
    if (!user) {
      console.warn('Usuário não autenticado - redirecionando');
      window.location.href = 'login.html';
      return;
    }

    // 3. Carregar perfil do usuário
    const userProfile = await getUserProfile(user.id);
    if (!userProfile) {
      throw new Error('Perfil não encontrado no banco de dados');
    }

    // 4. Atualizar UI
    document.getElementById('username').textContent = userProfile.name;
    
    // 5. Gerenciar visibilidade de links de admin
    const adminLinks = document.getElementById('adminLinks');
    if (adminLinks) {
      adminLinks.style.display = userProfile.is_admin ? 'block' : 'none';
    }

    // 6. Carregar dados do dashboard
    await carregarDadosDashboard();

    // Debug: tempo total
    console.timeEnd('DashboardInitialization');

  } catch (error) {
    console.error('Falha na inicialização:', error);
    
    // Mostrar feedback visual se Swal estiver disponível
    if (window.Swal) {
      await Swal.fire({
        icon: 'error',
        title: 'Erro de inicialização',
        text: error.message
      });
    }
    
    // Redirecionar com fallback
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    
  } finally {
    // Garantir que o loading seja removido em qualquer caso
    document.body.classList.remove('loading');
  }
});

async function carregarDadosDashboard() {
  try {
    console.log('Iniciando carregamento de dados...');
    
    const hoje = new Date();
    
    // 1. Buscar funcionários com períodos de férias
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select(`
        *,
        vacation_periods (
          start_date,
          end_date
        )
      `)
      .order('name', { ascending: true });

    if (empError) throw empError;
    if (!employees?.length) throw new Error('Nenhum funcionário encontrado');

    // 2. Calcular métricas
    const totalFuncionarios = employees.length;
    
    const emFerias = employees.filter(emp => 
      emp.vacation_periods?.some(p => {
        const inicio = new Date(p.start_date);
        const fim = new Date(p.end_date);
        return inicio <= hoje && hoje <= fim;
      })
    ).length;

    const disponiveis = employees.filter(emp => 
      !emp.vacation_periods?.some(p => {
        const inicio = new Date(p.start_date);
        const fim = new Date(p.end_date);
        return inicio <= hoje && hoje <= fim;
      }) && 
      window.utils.calcDisponibilidade(emp.hire_date, emp.last_vacation)
    ).length;

    // 3. Buscar conflitos
    const { data: conflitos, error: conflitosError } = await supabase
      .rpc('get_conflicts');

    if (conflitosError) throw conflitosError;

    // 4. Atualizar UI
    document.getElementById('totalEmployees').textContent = totalFuncionarios;
    document.getElementById('onVacation').textContent = emFerias;
    document.getElementById('availableVacation').textContent = disponiveis;
    document.getElementById('conflicts').textContent = conflitos?.length || 0;

    console.log('Dados carregados com sucesso!');

  } catch (error) {
    console.error('Erro no carregamento de dados:', error);
    
    // Feedback visual mais amigável
    const errorMessage = error.message.includes('Nenhum funcionário encontrado')
      ? 'Base de dados vazia'
      : 'Erro ao conectar com o servidor';
    
    if (window.Swal) {
      Swal.fire('Erro', errorMessage, 'error');
    } else {
      alert(errorMessage);
    }
    
    throw error; // Propaga para o bloco catch externo
  }
}