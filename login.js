document.addEventListener('DOMContentLoaded', async () => {
  applySavedTheme();
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  
  // Verificar se já está logado
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    window.location.href = 'dashboard.html';
    return;
  }

  // Criar usuário admin padrão se não existir
  const { data: adminUser, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', 'admin')
    .single();

  if (!adminUser && !error) {
    const { data, error } = await supabase
      .from('users')
      .insert([
        { 
          username: 'admin',
          password: 'admin123', // Na prática, usaríamos hash
          is_admin: true 
        }
      ]);
  }

  // Configurar evento de login
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
      alert('Por favor, preencha ambos os campos!');
      return;
    }

    // Verificar credenciais
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password) // Na prática, usaríamos auth do Supabase
      .single();

    if (user) {
      // Armazenar informações do usuário na sessionStorage
      sessionStorage.setItem('currentUser', JSON.stringify({
        id: user.id,
        username: user.username,
        isAdmin: user.is_admin
      }));
      
      window.location.href = 'dashboard.html';
    } else {
      alert('Credenciais inválidas! Tente novamente.');
      document.getElementById('password').value = '';
    }
  });
});