document.addEventListener('DOMContentLoaded', () => {
  // 1. Primeiro verifique se os elementos existem
  const themeToggle = document.getElementById('themeToggle');
  const loginForm = document.getElementById('loginForm');
  
  if (!themeToggle || !loginForm) {
    console.error('Elementos essenciais não encontrados na página!');
    return;
  }

  // 2. Aplicar tema salvo de forma segura
  const applyTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.toggle('dark-mode', savedTheme === 'dark');
    themeToggle.innerHTML = `<i class="fas fa-${savedTheme === 'dark' ? 'sun' : 'moon'}"></i>`;
  };

  // 3. Configurar tema inicial
  applyTheme();

  // 4. Verificar usuário logado
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  if (currentUser) {
    window.location.href = 'dashboard.html';
    return;
  }

  // 5. Criar usuário admin padrão
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([{
      username: 'admin',
      password: 'admin123',
      isAdmin: true
    }]));
  }

  // 6. Configurar evento de login
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
      alert('Por favor, preencha ambos os campos!');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => 
      u.username.toLowerCase() === username.toLowerCase() && 
      u.password === password
    );

    if (user) {
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      window.location.href = 'dashboard.html';
    } else {
      alert('Credenciais inválidas! Tente novamente.');
      document.getElementById('password').value = '';
    }
  });

  // 7. Configurar botão de tema (com verificação)
  themeToggle.addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    this.innerHTML = `<i class="fas fa-${isDark ? 'sun' : 'moon'}"></i>`;
  });
});
