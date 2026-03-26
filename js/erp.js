let currentUser = null;
let companySettings = null;

async function initializeERP(session) {
  currentUser = session;
  
  // Cargar configuración de la empresa
  const { data: settings } = await supabaseClient
    .from('settings')
    .select('*')
    .eq('user_id', session.user_id)
    .single();
  
  companySettings = settings || {};
  
  // Actualizar UI con datos de la empresa
  document.getElementById('companyNameDisplay').textContent = 
    settings?.company_name || session.company || 'Mi Empresa';
  document.getElementById('userDisplay').textContent = session.username;
  document.getElementById('currentDate').textContent = 
    new Date().toLocaleDateString('es-PA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  // Cargar logo si existe
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('logo_url')
    .eq('id', session.user_id)
    .single();
  
  if (profile?.logo_url) {
    document.getElementById('companyLogo').src = profile.logo_url;
    document.getElementById('companyLogo').classList.remove('hidden');
    const largeLogo = document.getElementById('companyLogoLarge');
    if (largeLogo) {
      largeLogo.innerHTML = `<img src="${profile.logo_url}" class="w-full h-full object-contain p-2">`;
    }
  }
  
  // Cargar estadísticas del overview
  await loadOverviewStats();
  
  // Verificar si viene de impersonación
  if (session.impersonated) {
    showImpersonationBanner();
  }
}

function showImpersonationBanner() {
  const banner = document.createElement('div');
  banner.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-yellow-500/90 text-black px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-3 animate-bounce';
  banner.innerHTML = `
    <i class="fas fa-user-secret"></i>
    <span class="font-bold">Modo Visualización: Viendo como ${currentUser.username}</span>
    <button onclick="returnToAdmin()" class="ml-2 bg-black/20 hover:bg-black/30 px-3 py-1 rounded-full text-sm">Volver a Admin</button>
  `;
  document.body.appendChild(banner);
}

function returnToAdmin() {
  const adminSession = JSON.parse(sessionStorage.getItem('a3_admin_backup'));
  if (adminSession) {
    sessionStorage.setItem('a3_session', JSON.stringify(adminSession));
    sessionStorage.removeItem('a3_admin_backup');
  }
  window.location.href = 'control.html';
}

async function loadOverviewStats() {
  const userId = currentUser.user_id;
  
  // Cotizaciones
  const { count: quotesCount } = await supabaseClient
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  // Facturas
  const { count: invoicesCount } = await supabaseClient
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  // Clientes
  const { count: clientsCount } = await supabaseClient
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  // Por cobrar
  const { data: pendingInvoices } = await supabaseClient
    .from('invoices')
    .select('total, paid')
    .eq('user_id', userId)
    .in('status', ['emitido', 'parcial']);
  
  const pending = pendingInvoices?.reduce((a, i) => a + (i.total - i.paid), 0) || 0;
  
  const stats = [
    { label: 'Cotizaciones', value: quotesCount || 0, icon: 'file-invoice-dollar', color: 'blue' },
    { label: 'Facturas', value: invoicesCount || 0, icon: 'file-invoice', color: 'emerald' },
    { label: 'Clientes', value: clientsCount || 0, icon: 'users', color: 'purple' },
    { label: 'Por Cobrar', value: 'B/. ' + pending.toFixed(2), icon: 'clock', color: 'yellow' }
  ];
  
  document.getElementById('statsContainer').innerHTML = stats.map(s => `
    <div class="card hover:scale-105 transition-transform cursor-pointer border-l-4 border-${s.color}-500">
      <div class="flex justify-between items-start">
        <div>
          <p class="text-slate-400 text-sm">${s.label}</p>
          <p class="text-2xl font-bold text-${s.color}-400">${s.value}</p>
        </div>
        <div class="w-10 h-10 rounded-xl bg-${s.color}-500/20 flex items-center justify-center text-${s.color}-400">
          <i class="fas fa-${s.icon}"></i>
        </div>
      </div>
    </div>
  `).join('');
  
  // Cargar actividad reciente
  await loadRecentActivity();
}

async function loadRecentActivity() {
  const { data: recent } = await supabaseClient
    .from('quotes')
    .select('number, date, total, status')
    .eq('user_id', currentUser.user_id)
    .order('date', { ascending: false })
    .limit(5);
  
  const container = document.getElementById('recentActivity');
  if (!recent || recent.length === 0) {
    container.innerHTML = '<p class="text-slate-500 text-center py-4">Sin actividad reciente</p>';
    return;
  }
  
  container.innerHTML = recent.map(q => `
    <div class="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
          <i class="fas fa-file-invoice-dollar"></i>
        </div>
        <div>
          <p class="font-medium text-white text-sm">${q.number}</p>
          <p class="text-xs text-slate-400">${new Date(q.date).toLocaleDateString()}</p>
        </div>
      </div>
      <div class="text-right">
        <p class="font-medium text-emerald-400 text-sm">B/. ${parseFloat(q.total).toFixed(2)}</p>
        <span class="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">${q.status}</span>
      </div>
    </div>
  `).join('');
}

// Funciones para Cotizaciones
async function loadQuotes() {
  const { data: quotes } = await supabaseClient
    .from('quotes')
    .select('*, clients(name)')
    .eq('user_id', currentUser.user_id)
    .order('date', { ascending: false });
  
  const tbody = document.getElementById('quotesTable');
  tbody.innerHTML = (quotes || []).map(q => `
    <tr class="border-b border-slate-700 hover:bg-slate-800/50">
      <td class="py-3 font-mono text-sm">${q.number}</td>
      <td class="py-3 text-sm text-slate-400">${new Date(q.date).toLocaleDateString()}</td>
      <td class="py-3 text-sm">${q.clients?.name || 'N/A'}</td>
      <td class="py-3 text-sm font-medium text-emerald-400">B/. ${parseFloat(q.total).toFixed(2)}</td>
      <td class="py-3"><span class="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">${q.status}</span></td>
      <td class="py-3 text-right">
        <button onclick="viewQuote('${q.id}')" class="text-blue-400 hover:text-blue-300 mr-2"><i class="fas fa-eye"></i></button>
        <button onclick="printQuote('${q.id}')" class="text-slate-400 hover:text-white"><i class="fas fa-print"></i></button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="6" class="py-8 text-center text-slate-500">Sin cotizaciones</td></tr>';
}

function openQuoteModal() {
  // Implementar modal de cotización
  alert('Modal de nueva cotización - Implementar formulario completo');
}

// Funciones para Facturas
async function loadInvoices() {
  const { data: invoices } = await supabaseClient
    .from('invoices')
    .select('*, clients(name)')
    .eq('user_id', currentUser.user_id)
    .order('date', { ascending: false });
  
  const tbody = document.getElementById('invoicesTable');
  tbody.innerHTML = (invoices || []).map(i => {
    const statusColors = {
      'emitido': 'bg-blue-500/20 text-blue-400',
      'pagado': 'bg-emerald-500/20 text-emerald-400',
      'parcial': 'bg-yellow-500/20 text-yellow-400',
      'vencido': 'bg-red-500/20 text-red-400'
    };
    return `
    <tr class="border-b border-slate-700 hover:bg-slate-800/50">
      <td class="py-3 font-mono text-sm">${i.number}</td>
      <td class="py-3 text-sm text-slate-400">${new Date(i.date).toLocaleDateString()}</td>
      <td class="py-3 text-sm">${i.clients?.name || 'N/A'}</td>
      <td class="py-3 text-sm font-medium text-emerald-400">B/. ${parseFloat(i.total).toFixed(2)}</td>
      <td class="py-3"><span class="px-2 py-1 rounded-full text-xs ${statusColors[i.status] || 'bg-slate-500/20 text-slate-400'}">${i.status}</span></td>
      <td class="py-3 text-right">
        <button onclick="viewInvoice('${i.id}')" class="text-blue-400 hover:text-blue-300 mr-2"><i class="fas fa-eye"></i></button>
        <button onclick="printInvoice('${i.id}')" class="text-slate-400 hover:text-white"><i class="fas fa-print"></i></button>
      </td>
    </tr>
  `}).join('') || '<tr><td colspan="6" class="py-8 text-center text-slate-500">Sin facturas</td></tr>';
}

// Funciones para Clientes
async function loadClients() {
  const search = document.getElementById('clientSearch')?.value || '';
  
  let query = supabaseClient
    .from('clients')
    .select('*')
    .eq('user_id', currentUser.user_id);
  
  if (search) {
    query = query.ilike('name', `%${search}%`);
  }
  
  const { data: clients } = await query.order('name');
  
  const tbody = document.getElementById('clientsTable');
  tbody.innerHTML = (clients || []).map(c => `
    <tr class="border-b border-slate-700 hover:bg-slate-800/50">
      <td class="py-3 font-medium">${c.name}</td>
      <td class="py-3 text-sm text-slate-400">${c.ruc || '-'}</td>
      <td class="py-3 text-sm text-slate-400">
        ${c.phone ? `<div><i class="fas fa-phone text-xs mr-1"></i>${c.phone}</div>` : ''}
        ${c.email ? `<div><i class="fas fa-envelope text-xs mr-1"></i>${c.email}</div>` : ''}
      </td>
      <td class="py-3 text-right">
        <button onclick="editClient('${c.id}')" class="text-blue-400 hover:text-blue-300 mr-2"><i class="fas fa-edit"></i></button>
        <button onclick="deleteClient('${c.id}')" class="text-red-400 hover:text-red-300"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="4" class="py-8 text-center text-slate-500">Sin clientes registrados</td></tr>';
}

// Funciones para Productos
async function loadProducts() {
  const { data: products } = await supabaseClient
    .from('products')
    .select('*')
    .eq('user_id', currentUser.user_id)
    .order('name');
  
  const tbody = document.getElementById('productsTable');
  tbody.innerHTML = (products || []).map(p => `
    <tr class="border-b border-slate-700 hover:bg-slate-800/50">
      <td class="py-3 font-medium">${p.name}</td>
      <td class="py-3 text-sm text-slate-400 font-mono">${p.sku || '-'}</td>
      <td class="py-3 text-sm text-emerald-400 font-medium">B/. ${parseFloat(p.price || 0).toFixed(2)}</td>
      <td class="py-3 text-sm ${(p.stock || 0) < 5 ? 'text-red-400' : 'text-slate-300'}">${p.stock || 0}</td>
      <td class="py-3 text-right">
        <button onclick="editProduct('${p.id}')" class="text-blue-400 hover:text-blue-300 mr-2"><i class="fas fa-edit"></i></button>
        <button onclick="deleteProduct('${p.id}')" class="text-red-400 hover:text-red-300"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="5" class="py-8 text-center text-slate-500">Sin productos registrados</td></tr>';
}

// Configuración de Empresa
async function loadCompanyConfig() {
  document.getElementById('configCompanyName').value = companySettings?.company_name || '';
  document.getElementById('configCompanyRUC').value = companySettings?.company_ruc || '';
  document.getElementById('configCompanyPhone').value = companySettings?.company_phone || '';
  document.getElementById('configCompanyEmail').value = companySettings?.company_email || '';
  document.getElementById('configCompanyAddress').value = companySettings?.company_address || '';
  document.getElementById('configPrefixQuotes').value = companySettings?.prefix_quotes || 'COT-';
  document.getElementById('configPrefixInvoices').value = companySettings?.prefix_invoices || 'FAC-';
  document.getElementById('configTaxRate').value = companySettings?.tax_rate || 7;
}

async function saveCompanyConfig() {
  try {
    const data = {
      user_id: currentUser.user_id,
      company_name: document.getElementById('configCompanyName').value,
      company_ruc: document.getElementById('configCompanyRUC').value,
      company_phone: document.getElementById('configCompanyPhone').value,
      company_email: document.getElementById('configCompanyEmail').value,
      company_address: document.getElementById('configCompanyAddress').value,
      prefix_quotes: document.getElementById('configPrefixQuotes').value,
      prefix_invoices: document.getElementById('configPrefixInvoices').value,
      tax_rate: parseFloat(document.getElementById('configTaxRate').value)
    };
    
    const { error } = await supabaseClient
      .from('settings')
      .upsert(data, { onConflict: 'user_id' });
    
    if (error) throw error;
    alert('Configuración guardada exitosamente');
    
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function updateCompanyLogo(input) {
  if (input.files && input.files[0]) {
    try {
      const logoUrl = await uploadLogo(input.files[0], currentUser.user_id);
      
      await supabaseClient
        .from('profiles')
        .update({ logo_url: logoUrl })
        .eq('id', currentUser.user_id);
      
      // Actualizar vista previa
      document.getElementById('companyLogo').src = logoUrl;
      document.getElementById('companyLogoLarge').innerHTML = `<img src="${logoUrl}" class="w-full h-full object-contain p-2">`;
      
      alert('Logo actualizado');
    } catch (error) {
      alert('Error subiendo logo: ' + error.message);
    }
  }
}

// Utilidades de impresión (placeholder)
function printQuote(id) {
  window.open(`quote-print.html?id=${id}`, '_blank');
}

function printInvoice(id) {
  window.open(`invoice-print.html?id=${id}`, '_blank');
}

function quickAction(type) {
  if (type === 'quote') openQuoteModal();
}