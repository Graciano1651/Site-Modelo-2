const supabaseUrl = 'https://kqvhbcbjrkyfknegnbce.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdmhiY2Jqcmt5ZmtuZWduYmNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NTg0NjUsImV4cCI6MjA2NDAzNDQ2NX0.6fHcOtVH59DVJ3J2KF19phtiCriAsHDr5vWLnxwW8kY';

// Carrega diretamente do arquivo local
const script = document.createElement('script');
script.src = 'lib/supabase-local.js';
script.onload = () => {
  window.supabase = supabase.createClient(supabaseUrl, supabaseKey);
  console.log('⚡ Supabase carregado localmente!');
  document.dispatchEvent(new Event('supabase-ready'));
};
document.head.appendChild(script);