document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  try {
    const { data, error } = await window.supabase.auth.signInWithPassword({
      email: document.getElementById('username').value.trim(),
      password: document.getElementById('password').value.trim()
    });

    if (error) throw error;

    sessionStorage.setItem('currentUser', JSON.stringify({
      auth: data.user,
      profile: data.session
    }));

    window.location.href = 'dashboard.html';

  } catch (err) {
    console.error('Erro no login:', err);
    alert('Falha no login: ' + (err.message || 'Credenciais inválidas'));
  }
});

// Função de teste (MANTIDA ORIGINAL)
window.testAuth = async () => {
  const email = prompt("E-mail para teste:", "teste@exemplo.com");
  const password = prompt("Senha para teste:", "123456");
  
  if (!email || !password) return;
  
  try {
    const { error } = await window.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    alert("✅ Login teste bem-sucedido!");
  } catch (err) {
    alert("❌ Erro: " + err.message);
  }
};