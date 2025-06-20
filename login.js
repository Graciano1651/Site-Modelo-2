document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    // Usa o supabase global (definido em supabase.js)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)  // Verifique se o campo na tabela é 'email' ou 'username'
      .eq('password', password)
      .single();

    if (error || !data) {
      alert('Email ou senha inválidos!');
      return;
    }

    // Salva o usuário no sessionStorage
    sessionStorage.setItem('currentUser', JSON.stringify(data));
    
    // Redireciona
    window.location.href = 'dashboard.html';
  } catch (err) {
    console.error('Erro no login:', err);
    alert('Erro ao fazer login. Tente novamente.');
  }
 });