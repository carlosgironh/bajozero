// ============================================
// CLIENTE SUPABASE INICIALIZADO
// ============================================

import { CONFIG } from './config.js';

// Usar el objeto global de Supabase desde el CDN
export const supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper para llamar Edge Functions
export async function callEdgeFunction(functionName, body) {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(`${CONFIG.SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.access_token || CONFIG.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  
  return response.json();
}