document.addEventListener('DOMContentLoaded', async () => {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const employeeId = params.get('id');
  if (!employeeId) {
    alert('Funcionário não especificado.');
    window.location.href = 'dashboard.html';
    return;
  }

  const userProfile = await getUserProfile(user.id);
  const isAdmin = userProfile?.is_admin;

  const { data: employee, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employeeId)
    .single();

  if (error) {
    console.error('Erro ao buscar funcionário:', error);
    window.location.href = 'dashboard.html';
    return;
  }

  if (!isAdmin && employee.created_by !== user.id) {
    window.location.href = 'dashboard.html';
    return;
  }

  preencherPerfil(employee);
});

function preencherPerfil(employee) {
  document.getElementById('nome').textContent = employee.name;
  document.getElementById('email').textContent = employee.email;
  document.getElementById('departamento').textContent = employee.department;
  document.getElementById('tipo').textContent = employee.tipo || '-';
 }