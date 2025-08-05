const supabaseUrl = 'https://kqvhbcbjrkyfknegnbce.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxdmhiY2Jqcmt5ZmtuZWduYmNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NTg0NjUsImV4cCI6MjA2NDAzNDQ2NX0.6fHcOtVH59DVJ3J2KF19phtiCriAsHDr5vWLnxwW8kY';

// Inicialização robusta
(function() {
  if (window.supabase) return;

  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  script.onload = () => {
    window.supabase = supabase.createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    console.log('✅ Supabase inicializado com sucesso');
    document.dispatchEvent(new Event('supabase-ready'));
  };
  script.onerror = () => console.error('❌ Falha ao carregar Supabase');
  document.head.appendChild(script);
})();