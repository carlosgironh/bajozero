const CONFIG = {
  SUPABASE_URL: 'https://jqiqeyopvjsnutyihczh.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxaXFleW9wdmpzbnV0eWloY3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MjY0MDUsImV4cCI6MjA5OTEwMjQwNX0.v0a0G_hsRmaAKCTPBH5WHDtRF2gsTCBBJET2zXFLBTM',
  
  APP_NAME: 'Bajo Zero Panamá',
  VERSION: '2.0.0',
  
  ROLES: {
    ADMINISTRADOR: 'administrador',
    SECRETARIA: 'secretaria',
    TECNICO: 'tecnico'
  }
};

// Inicializar cliente global de Supabase si la librería está cargada
if (window.supabase) {
    window.supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
} else {
    console.warn("Librería de Supabase no encontrada. Asegúrate de incluirla antes de config.js");
}