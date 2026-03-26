// ============================================
// CLIENTS MODULE
// ============================================

const clientsModule = {
  clients: [],

  async load() {
    await this.render();
  },

  async render() {
    const search = document.getElementById('clientSearch')?.value?.toLowerCase() || '';
    
    try {
      let query = supabaseClient
        .from('clients')
        .select('*')
        .eq('user_id', Auth.currentUser.id)
        .order('name');

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      this.clients = data || [];
      this.renderTable();
    } catch (error) {
      UI.showToast('Error cargando clientes: ' + error.message, 'error');
    }
  },

  renderTable() {
    const tbody = document.getElementById('clientsTableBody');
    if (!tbody) return;

    tbody.innerHTML = this.clients.map(c => `
      <tr class="hover:bg-slate-800/50 transition-colors">
        <td class="font-medium text-white">${UI.escapeHtml(c.name)}</td>
        <td class="text-slate-400 text-xs">${c.ruc || '-'}</td>
        <td class="text-slate-400 text-xs">
          ${c.phone ? `<div><i class="fas fa-phone text-xs mr-1"></i>${c.phone}</div>` : ''}
          ${c.email ? `<div><i class="fas fa-envelope text-xs mr-1"></i>${c.email}</div>` : ''}
        </td>
        <td class="text-right">
          <button onclick="clientsModule.edit('${c.id}')" class="text-blue-400 hover:text-blue-300 mr-3">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="clientsModule.delete('${c.id}')" class="text-red-400 hover:text-red-300">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="4" class="text-center py-8 text-slate-500">No hay clientes registrados</td></tr>';
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

  async save() {
    const name = document.getElementById('newClientName')?.value.trim();
    if (!name) {
      UI.showToast('El nombre es obligatorio', 'error');
      return;
    }

    try {
      const { data, error } = await supabaseClient
        .from('clients')
        .insert({
          user_id: Auth.currentUser.id,
          name,
          ruc: document.getElementById('newClientRUC')?.value || '',
          phone: document.getElementById('newClientPhone')?.value || '',
          email: document.getElementById('newClientEmail')?.value || '',
          address: document.getElementById('newClientAddress')?.value || ''
        })
        .select()
        .single();

      if (error) throw error;

      document.getElementById('clientModal')?.remove();
      UI.showToast('Cliente guardado');
      await this.render();
    } catch (error) {
      UI.showToast('Error: ' + error.message, 'error');
    }
  },

  async edit(id) {
    const client = this.clients.find(c => c.id === id);
    const newName = prompt('Editar nombre:', client.name);
    if (newName && newName.trim()) {
      try {
        const { error } = await supabaseClient
          .from('clients')
          .update({ name: newName.trim() })
          .eq('id', id);

        if (error) throw error;
        
        UI.showToast('Cliente actualizado');
        await this.render();
      } catch (error) {
        UI.showToast('Error: ' + error.message, 'error');
      }
    }
  },

  async delete(id) {
    if (!UI.confirm('¿Eliminar este cliente permanentemente?')) return;

    try {
      const { error } = await supabaseClient
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      UI.showToast('Cliente eliminado');
      await this.render();
    } catch (error) {
      UI.showToast('Error: ' + error.message, 'error');
    }
  }
};