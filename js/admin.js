// ============================================
// ADMIN MODULE
// ============================================

import { callEdgeFunction } from './supabase-client.js';
import { Auth } from './auth.js';
import { UI } from './ui.js';

export const adminModule = {
  users: [],

  async loadUsers() {
    if (!Auth.isAdmin()) {
      UI.showToast('Acceso denegado', 'error');
      window.router.navigate('dashboard');
      return;
    }

    try {
      const result = await callEdgeFunction('admin', {
        action: 'get_all_users'
      });

      if (result.error) throw new Error(result.error);

      this.users = result.users || [];
      this.renderUsersTable();
    } catch (error) {
      UI.showToast('Error: ' + error.message, 'error');
    }
  },

  renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    const currentUser = Auth.currentUser;

    tbody.innerHTML = this.users.map(u => {
      const isCurrent = u.id === currentUser?.id;
      const isImpersonating = Auth.isImpersonating() && Auth.currentUser?.id === u.id;

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
              class="btn-success text-xs mr-2 ${isImpersonating ? 'ring-2 ring-yellow-400' : ''}">
              <i class="fas fa-user-secret mr-1"></i>${isImpersonating ? 'Activo' : 'Ver como'}
            </button>
            <button onclick="adminModule.deleteUser('${u.id}')" class="btn-danger text-xs">
              <i class="fas fa-trash"></i>
            </button>
          ` : '<span class="text-slate-600 text-xs">No editable</span>'}
        </td>
      </tr>
    `}).join('');
  },

  async impersonate(userId) {
    const result = await Auth.impersonate(userId);
    
    if (result.success) {
      UI.showToast(`Ingresando como ${result.user.username}...`);
      setTimeout(() => location.reload(), 500);
    } else {
      UI.showToast(result.error, 'error');
    }
  },

  async deleteUser(userId) {
    const user = this.users.find(u => u.id === userId);
    
    if (!UI.confirm(`¿Eliminar a ${user.username} y TODOS sus datos permanentemente?`)) {
      return;
    }

    try {
      const result = await callEdgeFunction('admin', {
        action: 'delete_user',
        user_id: userId
      });

      if (result.error) throw new Error(result.error);

      UI.showToast('Usuario eliminado');
      await this.loadUsers();
    } catch (error) {
      UI.showToast('Error: ' + error.message, 'error');
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
          <input type="email" id="newUserEmail" placeholder="Email *" class="bg-slate-800 border-slate-600 text-white placeholder-slate-500">
          <input type="password" id="newUserPassword" placeholder="Contraseña *" class="bg-slate-800 border-slate-600 text-white placeholder-slate-500">
          <input type="text" id="newUserUsername" placeholder="Nombre de usuario *" class="bg-slate-800 border-slate-600 text-white placeholder-slate-500">
          <input type="text" id="newUserCompany" placeholder="Nombre de la empresa" class="bg-slate-800 border-slate-600 text-white placeholder-slate-500">
        </div>
        <div class="flex gap-3 mt-6">
          <button onclick="adminModule.createUser()" class="btn-primary flex-1">Crear Usuario</button>
          <button onclick="document.getElementById('createUserModal').remove()" class="btn-secondary flex-1">Cancelar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async createUser() {
    const email = document.getElementById('newUserEmail')?.value.trim();
    const password = document.getElementById('newUserPassword')?.value;
    const username = document.getElementById('newUserUsername')?.value.trim();
    const company = document.getElementById('newUserCompany')?.value.trim();

    if (!email || !password || !username) {
      UI.showToast('Email, usuario y contraseña son obligatorios', 'error');
      return;
    }

    try {
      const result = await Auth.register(email, password, username, company);
      
      if (result.success) {
        document.getElementById('createUserModal')?.remove();
        UI.showToast('Usuario creado exitosamente');
        await this.loadUsers();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      UI.showToast('Error: ' + error.message, 'error');
    }
  },

  loadDataView() {
    if (!Auth.isAdmin()) {
      window.router.navigate('dashboard');
      return;
    }
    this.renderDataButtons();
  },

  async renderDataButtons() {
    const container = document.getElementById('userDataButtons');
    if (!container) return;

    container.innerHTML = this.users
      .filter(u => u.role !== 'admin')
      .map(u => `
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
  },

  async loadUserData(userId) {
    UI.showToast('Cargando datos...');
  }
};

window.adminModule = adminModule;