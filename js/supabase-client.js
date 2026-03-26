// Cliente Supabase
const supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper para Edge Functions
async function callEdgeFunction(functionName, body) {
  const { data: { session } } = await supabaseClient.auth.getSession();
  
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

// Subir logo a Storage
async function uploadLogo(file, userId) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabaseClient
    .storage
    .from(CONFIG.STORAGE_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabaseClient
    .storage
    .from(CONFIG.STORAGE_BUCKET)
    .getPublicUrl(fileName);
    
  return publicUrl;
}