let currentTenants = [];
let currentLogoFile = null;

async function loadTenants() {
  try {
    const { data: profiles, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .neq('role', 'admin')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    currentTenants = profiles || [];
    renderTenants();
  } catch (error) {
    alert('Error cargando usuarios: ' + error.message);
  }
}

function renderTenants() {
  const container = document.getElementById('tenantsGrid');
  const search = document.getElementById('searchTenant')?.value?.toLowerCase() || '';
  
  const filtered = currentTenants.filter(t => 
    t.company_name?.toLowerCase().includes(search) ||
    t.username?.toLowerCase().includes(search)
  );
  
  container.innerHTML = filtered.map(t => `
    <div class="card hover:border-blue-500/50 transition-all group">
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
            ${t.logo_url 
              ? `<img src="${t.logo_url}" class="w-full h-full object-contain p-1">` 
              : '<i class="fas fa-building text-slate-600"></i>'}
          </div>
          <div>
            <h3 class="font-bold text-white">${t.company_name || 'Sin nombre'}</h3>
            <p class="text-xs text-slate-400">${t.username}</p>
          </div>
        </div>
        <div class="opacity-0 group-hover:opacity-100 transition-opacity">
          <button onclick="impersonateUser('${t.id}')" class="text-blue-400 hover:text-blue-300 mr-2" title="Ver como usuario">
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </div>
      
      <div class="space-y-2 text-sm text-slate-400 mb-4">
        <div class="flex justify-between">
          <span>ID:</span>
          <span class="font-mono text-xs">${t.id.slice(0, 8)}...</span>
        </div>
        <div class="flex justify-between">
          <span>Creado:</span>
          <span>${new Date(t.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      
      <div class="flex gap-2">
        <button onclick="editTenant('${t.id}')" class="flex-1 btn-secondary text-xs py-2">
          <i class="fas fa-edit mr-1"></i>Editar
        </button>
        <button onclick="deleteTenant('${t.id}')" class="flex-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-xs py-2 transition-all">
          <i class="fas fa-trash mr-1"></i>Eliminar
        </button>
      </div>
    </div>
  `).join('') || '<p class="col-span-3 text-center text-slate-500 py-8">No hay usuarios registrados</p>';
}

function filterTenants() {
  renderTenants();
}

function previewLogo(input) {
  if (input.files && input.files[0]) {
    currentLogoFile = input.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      const preview = document.getElementById('logoPreview');
      preview.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-contain p-2">`;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function clearLogo() {
  currentLogoFile = null;
  document.getElementById('logoInput').value = '';
  document.getElementById('logoPreview').innerHTML = '<i class="fas fa-image text-3xl text-slate-600"></i>';
}

async function handleCreateTenant(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creando...';
  
  try {
    // 1. Crear usuario en Auth
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email: form.email.value,
      password: form.password.value,
      options: {
        data: {
          username: form.username.value,
          company_name: form.company_name.value
        }
      }
    });
    
    if (authError) throw authError;
    
    let logoUrl = null;
    // 2. Subir logo si existe
    if (currentLogoFile && authData.user) {
      logoUrl = await uploadLogo(currentLogoFile, authData.user.id);
    }
    
    // 3. Actualizar perfil con datos adicionales
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        company_ruc: form.company_ruc.value,
        company_phone: form.company_phone.value,
        company_address: form.company_address.value,
        logo_url: logoUrl
      })
      .eq('id', authData.user.id);
    
    if (updateError) throw updateError;
    
    alert('Usuario creado exitosamente');
    resetForm();
    loadTenants();
    showSection('tenants');
    
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Crear Usuario y Empresa';
  }
}

function resetForm() {
  document.getElementById('createTenantForm').reset();
  clearLogo();
}

function editTenant(userId) {
  const tenant = currentTenants.find(t => t.id === userId);
  if (!tenant) return;
  
  const form = document.getElementById('editTenantForm');
  form.user_id.value = tenant.id;
  form.company_name.value = tenant.company_name || '';
  form.company_ruc.value = tenant.company_ruc || '';
  form.company_phone.value = tenant.company_phone || '';
  form.company_address.value = tenant.company_address || '';
  
  document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('active');
}

async function saveEditTenant() {
  const form = document.getElementById('editTenantForm');
  const userId = form.user_id.value;
  
  try {
    const updates = {
      company_name: form.company_name.value,
      company_ruc: form.company_ruc.value,
      company_phone: form.company_phone.value,
      company_address: form.company_address.value
    };
    
    // Si hay nuevo logo
    const logoInput = document.getElementById('editLogoInput');
    if (logoInput.files && logoInput.files[0]) {
      updates.logo_url = await uploadLogo(logoInput.files[0], userId);
    }
    
    const { error } = await supabaseClient
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    
    if (error) throw error;
    
    closeEditModal();
    loadTenants();
    alert('Cambios guardados');
    
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function deleteTenant(userId) {
  if (!confirm('¿Eliminar este usuario y TODOS sus datos permanentemente?')) return;
  
  try {
    const result = await callEdgeFunction('admin', {
      action: 'delete_user',
      user_id: userId
    });
    
    if (result.error) throw new Error(result.error);
    
    loadTenants();
    alert('Usuario eliminado');
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function impersonateUser(userId) {
  // Guardar sesión actual admin
  const adminSession = JSON.parse(sessionStorage.getItem('a3_session'));
  sessionStorage.setItem('a3_admin_backup', JSON.stringify(adminSession));
  
  // Cargar datos del usuario seleccionado
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  // Crear sesión temporal de usuario
  sessionStorage.setItem('a3_session', JSON.stringify({
    user_id: userId,
    role: 'user',
    username: profile.username,
    company: profile.company_name,
    impersonated: true
  }));
  
  window.open('erp.html', '_blank');
}

async function loadGlobalStats() {
  try {
    // Contar usuarios
    const { count: userCount } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .neq('role', 'admin');
    
    document.getElementById('statTotalUsers').textContent = userCount || 0;
    
    // Contar cotizaciones y facturas de todos los usuarios
    const { data: stats } = await callEdgeFunction('admin', {
      action: 'get_global_stats'
    });
    
    if (stats) {
      document.getElementById('statTotalQuotes').textContent = stats.total_quotes || 0;
      document.getElementById('statTotalInvoices').textContent = stats.total_invoices || 0;
      document.getElementById('statTotalRevenue').textContent = formatMoney(stats.total_revenue || 0);
    }
  } catch (error) {
    console.error('Error cargando estadísticas:', error);
  }
}

function formatMoney(amount) {
  return 'B/. ' + parseFloat(amount).toFixed(2);
}