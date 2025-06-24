const supabaseUrl = 'https://kqvhbcbjrkyfknegnbce.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdmhiY2Jqcmt5ZmtuZWduYmNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NTg0NjUsImV4cCI6MjA2NDAzNDQ2NX0.6fHcOtVH59DVJ3J2KF19phtiCriAsHDr5vWLnxwW8kY';

// Carrega o Supabase local
const script = document.createElement('script');
script.src = 'lib/supabase-local.js';
script.onload = () => {
  if (typeof supabase === 'function') {
    window.supabase = supabase.createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase inicializado!');
    document.dispatchEvent(new Event('supabase-ready'));
  } else {
    console.error('Biblioteca Supabase não carregou corretamente');
  }
};
document.head.appendChild(script);