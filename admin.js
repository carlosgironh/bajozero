// ============================================
// ADMIN MODULE - Gestión de Usuarios
// ============================================

const adminModule = {
  renderUsers() {
    const users = Auth.getUsers();
    const currentUser = Auth.getCurrentUser();
    
    const tbody = document.getElementById('usersTableBody');
    if (tbody) {
      tbody.innerHTML = users.map(u => {
        const isCurrent = u.id === currentUser?.id;
        const isImpersonating = sessionStorage.getItem('a3_impersonate_user_id') === u.id;
        
        return `
        <tr class="hover:bg-slate-800/50 transition-colors ${isImpersonating ? 'bg-yellow-500/10' : ''}">
          <td class="font-medium text-white">
            ${u.username}
            ${isCurrent ? '<span class="ml-2 text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">Tú</span>' : ''}
          </td>
          <td class="text-slate-400">${u.company_name}</td>
          <td>
            <span class="badge badge-${u.role === 'admin' ? 'admin' : 'user'}">
              ${u.role}
            </span>
          </td>
          <td class="text-xs text-slate-500">${UI.formatDate(u.created_at)}</td>
          <td class="text-right">
            ${u.role !== 'admin' ? `
              <button onclick="adminModule.impersonate('${u.id}')" 
                class="btn-success text-xs mr-2 ${isImpersonating ? 'ring-2 ring-yellow-400' : ''}" 
                title="Ver como este usuario">
                <i class="fas fa-user-secret mr-1"></i>${isImpersonating ? 'Activo' : 'Ver como'}
              </button>
              <button onclick="adminModule.resetPassword('${u.id}')" class="btn-secondary text-xs mr-2">
                Reset Pass
              </button>
              <button onclick="adminModule.deleteUser('${u.id}')" class="btn-danger text-xs">
                <i class="fas fa-trash"></i>
              </button>
            ` : '<span class="text-slate-600 text-xs">No editable</span>'}
          </td>
        </tr>
      `}).join('');
    }
  },

  openCreateUserModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'createUserModal';
    modal.innerHTML = `
      <div class="card w-full max-w-md m-auto">
        <h3 class="font-bold text-xl mb-4 text-red-400">
          <i class="fas fa-user-plus mr-2"></i>Crear Nuevo Usuario
        </h3>
        <div class="space-y-3">
          <input type="text" id="newUsername" placeholder="Nombre de usuario *" class="bg-slate-800 border-slate-600 text-white placeholder-slate-500">
          <input type="password" id="newPassword" placeholder="Contraseña temporal *" class="bg-slate-800 border-slate-600 text-white placeholder-slate-500">
          <input type="text" id="newCompany" placeholder="Nombre de la empresa" class="bg-slate-800 border-slate-600 text-white placeholder-slate-500">
          <div class="text-xs text-slate-500 bg-slate-800/50 p-3 rounded">
            <i class="fas fa-info-circle mr-1"></i>
            El usuario será creado con rol "user" y tendrá acceso solo a sus propios datos.
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button onclick="adminModule.createUser()" class="btn-primary flex-1">Crear Usuario</button>
          <button onclick="document.getElementById('createUserModal').remove()" class="btn-secondary flex-1">Cancelar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  createUser() {
    const username = document.getElementById('newUsername')?.value.trim();
    const password = document.getElementById('newPassword')?.value;
    const company = document.getElementById('newCompany')?.value.trim();

    if (!username || !password) {
      UI.showToast('Usuario y contraseña son obligatorios', 'error');
      return;
    }

    const result = Auth.createUser(username, password, company, 'user');
    if (result.success) {
      document.getElementById('createUserModal')?.remove();
      UI.showToast('Usuario creado exitosamente');
      this.renderUsers();
    } else {
      UI.showToast(result.error, 'error');
    }
  },

  impersonate(userId) {
    const user = Auth.impersonate(userId);
    if (user) {
      UI.showToast(`Ingresando como ${user.username}...`);
      setTimeout(() => location.reload(), 500);
    }
  },

  resetPassword(userId) {
    const newPass = prompt('Nueva contraseña:');
    if (newPass) {
      const users = Auth.getUsers();
      const idx = users.findIndex(u => u.id === userId);
      if (idx >= 0) {
        users[idx].password = newPass;
        Auth.saveUsers(users);
        UI.showToast('Contraseña actualizada');
      }
    }
  },

  deleteUser(userId) {
    const user = Auth.getUsers().find(u => u.id === userId);
    if (user.role === 'admin') {
      UI.showToast('No se puede eliminar el administrador', 'error');
      return;
    }
    
    if (confirm(`¿Eliminar a ${user.username} y TODOS sus datos permanentemente?`)) {
      DB.clearUserData(userId);
      const users = Auth.getUsers().filter(u => u.id !== userId);
      Auth.saveUsers(users);
      this.renderUsers();
      UI.showToast('Usuario eliminado');
    }
  },

  // Data Viewer
  renderDataButtons() {
    const users = Auth.getUsers().filter(u => u.role !== 'admin');
    const container = document.getElementById('userDataButtons');
    if (container) {
      container.innerHTML = users.map(u => `
        <button onclick="adminModule.loadUserData('${u.id}')" 
          class="card hover:bg-slate-700/50 transition-all text-left border-l-4 border-blue-500">
          <div class="flex justify-between items-start">
            <div>
              <div class="text-lg font-bold text-blue-400">${u.username}</div>
              <div class="text-sm text-slate-400">${u.company_name}</div>
            </div>
            <i class="fas fa-database text-slate-600"></i>
          </div>
        </button>
      `).join('') || '<p class="text-slate-500 col-span-2">No hay usuarios adicionales</p>';
    }
  },

  loadUserData(userId) {
    const user = Auth.getUsers().find(u => u.id === userId);
    const data = DB.exportUserData(userId);
    
    const quotes = JSON.parse(data.quotes || '[]');
    const invoices = JSON.parse(data.invoices || '[]');
    const clients = JSON.parse(data.clients || '[]');
    const products = JSON.parse(data.products || '[]');
    
    const totalInvoiced = invoices.reduce((a, i) => a + (i.total || 0), 0);
    
    document.getElementById('dataViewTitle').innerHTML = `
      <span class="text-blue-400">${user.username}</span> - ${user.company_name}
    `;
    
    document.getElementById('globalDataView').innerHTML = `
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="card bg-blue-900/20">
          <div class="text-2xl font-bold text-blue-400">${quotes.length}</div>
          <div class="text-sm text-slate-400">Cotizaciones</div>
        </div>
        <div class="card bg-emerald-900/20">
          <div class="text-2xl font-bold text-emerald-400">${invoices.length}</div>
          <div class="text-sm text-slate-400">Facturas</div>
        </div>
        <div class="card bg-purple-900/20">
          <div class="text-2xl font-bold text-purple-400">${clients.length}</div>
          <div class="text-sm text-slate-400">Clientes</div>
        </div>
        <div class="card bg-yellow-900/20">
          <div class="text-2xl font-bold text-yellow-400">${UI.formatMoney(totalInvoiced)}</div>
          <div class="text-sm text-slate-400">Total Facturado</div>
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-6">
        <div class="card">
          <h4 class="font-bold mb-3 text-slate-300">Últimas Facturas</h4>
          <table class="data-table">
            <thead>
              <tr><th>Número</th><th>Fecha</th><th>Total</th><th>Estado</th></tr>
            </thead>
            <tbody>
              ${invoices.slice(-5).reverse().map(i => `
                <tr>
                  <td class="font-mono text-xs">${i.number}</td>
                  <td class="text-xs">${UI.formatDate(i.date)}</td>
                  <td class="text-emerald-400">${UI.formatMoney(i.total)}</td>
                  <td><span class="text-xs px-2 py-1 rounded bg-slate-700">${i.status}</span></td>
                </tr>
              `).join('') || '<tr><td colspan="4" class="text-center py-4 text-slate-600">Sin facturas</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="card">
          <h4 class="font-bold mb-3 text-slate-300">Últimas Cotizaciones</h4>
          <table class="data-table">
            <thead>
              <tr><th>Número</th><th>Fecha</th><th>Total</th><th>Estado</th></tr>
            </thead>
            <tbody>
              ${quotes.slice(-5).reverse().map(q => `
                <tr>
                  <td class="font-mono text-xs">${q.number}</td>
                  <td class="text-xs">${UI.formatDate(q.date)}</td>
                  <td class="text-blue-400">${UI.formatMoney(q.total)}</td>
                  <td><span class="text-xs px-2 py-1 rounded bg-slate-700">${q.status}</span></td>
                </tr>
              `).join('') || '<tr><td colspan="4" class="text-center py-4 text-slate-600">Sin cotizaciones</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div class="mt-6 flex gap-3">
        <button onclick="adminModule.downloadUserBackup('${userId}')" class="btn-primary">
          <i class="fas fa-download mr-2"></i>Descargar Backup JSON
        </button>
      </div>
    `;
  },

  downloadUserBackup(userId) {
    const user = Auth.getUsers().find(u => u.id === userId);
    const data = DB.exportUserData(userId);
    
    const backup = {
      metadata: {
        exported_at: new Date().toISOString(),
        exported_by: Auth.getCurrentUser()?.username,
        version: '1.0'
      },
      user_info: {
        id: user.id,
        username: user.username,
        company_name: user.company_name,
        created_at: user.created_at
      },
      data: data
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${user.username}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    UI.showToast('Backup descargado');
  }
};