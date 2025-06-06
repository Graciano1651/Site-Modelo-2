import { supabase } from './supabase.js';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value.trim();

  const { data, error } = await supabase
    .from('users')
    .select('id, nome, is_admin')
    .eq('email', email)
    .eq('senha', senha)
    .single();

  if (error || !data) {
    alert('Email ou senha inválidos!');
    return;
  }

  // Salva os dados do usuário logado no localStorage
  localStorage.setItem('usuarioLogado', JSON.stringify(data));

  // Redireciona com base no tipo de usuário
  if (data.is_admin) {
    window.location.href = 'dashboard.html';
  } else {
    window.location.href = `profile.html?id=${data.id}`;
  }
});
