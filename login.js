document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('username').value.trim(); // Supondo que seja email
  const password = document.getElementById('password').value.trim();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    alert('Login falhou: ' + error.message);
    return;
  }

  sessionStorage.setItem('currentUser', JSON.stringify(data.user));
  window.location.href = 'dashboard.html';
});