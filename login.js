if (!window.supabase) {
  console.error('Supabase não carregado!');
  alert('Sistema não carregou corretamente. Recarregue a página.');
  throw new Error('Supabase não disponível');
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    // 1. Autenticação
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) throw error;

    // 2. Busca dados adicionais do usuário (se necessário)
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    // 3. Armazena dados na sessão
    sessionStorage.setItem('currentUser', JSON.stringify({
      auth: data.user,
      profile: userProfile || null
    }));

    // 4. Redireciona
    window.location.href = 'dashboard.html';

  } catch (err) {
    console.error('Erro no login:', err);
    alert('Falha no login: ' + err.message);
  }
});