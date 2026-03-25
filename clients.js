// ============================================
// CLIENTS MODULE
// ============================================

const clientsModule = {
  render() {
    const clients = DB.getAll('clients');
    const search = document.getElementById('clientSearch')?.value?.toLowerCase() || '';
    
    const filtered = clients.filter(c => 
      !search || 
      c.name?.toLowerCase().includes(search) ||
      c.ruc?.toLowerCase().includes(search)
    );
    
    const tbody = document.getElementById('clientsTableBody');
    if (tbody) {
      tbody.innerHTML = filtered.map(c => `
        <tr class="hover:bg-slate-800/50 transition-colors">
          <td class="font-medium text-white">${c.name}</td>
          <td class="text-slate-400 text-xs">${c.ruc || '-'}</td>
          <td class="text-slate-400 text-xs">
            ${c.phone ? `<div><i class="fas fa-phone text-xs mr-1"></i>${c.phone}</div>` : ''}
            ${c.email ? `<div><i class="fas fa-envelope text-xs mr-1"></i>${c.email}</div>` : ''}
          </td>
          <td>
            <button onclick="clientsModule.edit('${c.id}')" class="text-blue-400 hover:text-blue-300 mr-3" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="clientsModule.delete('${c.id}')" class="text-red-400 hover:text-red-300" title="Eliminar">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `).join('') || '<tr><td colspan="4" class="text-center py-8 text-slate-500">No hay clientes registrados</td></tr>';
    }
  },

  openModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'clientModal';
    modal.innerHTML = `
      <div class="card w-full max-w-md m-auto">
        <h3 class="font-bold text-xl mb-4">Nuevo Cliente</h3>
        <div class="space-y-3">
          <input type="text" id="newClientName" placeholder="Nombre completo *" class="bg-slate-800 border-slate-600 text-white placeholder-slate-500">
          <input type="text" id="newClientRUC" placeholder="RUC/CIU" class="bg-slate-800 border-slate-600 text-white placeholder-slate-500">
          <input type="text" id="newClientPhone" placeholder="Teléfono" class="bg-slate-800 border-slate-600 text-white placeholder-slate-500">
          <input type="email" id="newClientEmail" placeholder="Email" class="bg-slate-800 border-slate-600 text-white placeholder-slate-500">
          <textarea id="newClientAddress" rows="2" placeholder="Dirección" class="bg-slate-800 border-slate-600 text-white placeholder-slate-500"></textarea>
        </div>
        <div class="flex gap-3 mt-6">
          <button onclick="clientsModule.save()" class="btn-primary flex-1">Guardar</button>
          <button onclick="document.getElementById('clientModal').remove()" class="btn-secondary flex-1">Cancelar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => document.getElementById('newClientName')?.focus(), 100);
  },

  save() {
    const name = document.getElementById('newClientName')?.value.trim();
    if (!name) {
      UI.showToast('El nombre es obligatorio', 'error');
      return;
    }

    DB.save('clients', {
      id: crypto.randomUUID(),
      name,
      ruc: document.getElementById('newClientRUC')?.value || '',
      phone: document.getElementById('newClientPhone')?.value || '',
      email: document.getElementById('newClientEmail')?.value || '',
      address: document.getElementById('newClientAddress')?.value || '',
      active: true
    });

    document.getElementById('clientModal')?.remove();
    UI.showToast('Cliente guardado');
    this.render();
  },

  edit(id) {
    const c = DB.getById('clients', id);
    const newName = prompt('Editar nombre:', c.name);
    if (newName && newName.trim()) {
      c.name = newName.trim();
      DB.save('clients', c);
      this.render();
      UI.showToast('Cliente actualizado');
    }
  },

  delete(id) {
    if (confirm('¿Eliminar este cliente permanentemente?')) {
      DB.delete('clients', id);
      this.render();
      UI.showToast('Cliente eliminado');
    }
  }
};