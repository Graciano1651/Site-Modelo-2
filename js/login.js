document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  try {
    // 1. Obter credenciais do formulário
    const email = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // 2. Autenticação no Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) throw error;

    // 3. Buscar informações adicionais do usuário
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    // 4. Armazenar sessão
    sessionStorage.setItem('currentUser', JSON.stringify({
      auth: data.user,
      profile: userProfile || { userType: 'common' } // Padrão para usuário comum
    }));

    // 5. Redirecionar para dashboard
    window.location.href = 'dashboard.html';

  } catch (error) {
    // 6. Tratamento de erros
    console.error('Erro no login:', error);
    
    const errorMessage = error.message.includes('Invalid login credentials') 
      ? 'E-mail ou senha incorretos' 
      : 'Erro ao conectar com o servidor';
    
    alert(errorMessage);
  }
});