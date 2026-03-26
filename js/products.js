// ============================================
// PRODUCTS MODULE (Catálogo)
// ============================================

const productsModule = {
  products: [],
  categories: [],

  async load() {
    await this.loadCategories();
    await this.render();
  },

  async loadCategories() {
    const { data } = await supabaseClient
      .from('categories')
      .select('*')
      .eq('user_id', Auth.currentUser.id);
    this.categories = data || [];
  },

  async render() {
    const search = document.getElementById('productSearch')?.value?.toLowerCase() || '';
    
    try {
      let query = supabaseClient
        .from('products')
        .select('*, categories(name)')
        .eq('user_id', Auth.currentUser.id)
        .order('name');

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      this.products = data || [];
      this.renderTable();
    } catch (error) {
      UI.showToast('Error cargando productos: ' + error.message, 'error');
    }
  },

  renderTable() {
    const tbody = document.getElementById('catalogTableBody');
    if (!tbody) return;

    tbody.innerHTML = this.products.map(p => {
      const price = p.price || 0;
      const stockClass = (p.stock || 0) < 5 ? 'text-red-400' : 'text-emerald-400';
      
      return `
      <tr class="hover:bg-slate-800/50 transition-colors">
        <td>
          <div class="font-medium text-white">${UI.escapeHtml(p.name)}</div>
          <div class="text-xs text-slate-500">${p.sku || 'Sin SKU'} | ${p.categories?.name || 'General'}</div>
        </td>
        <td class="text-blue-400 font-medium">${UI.formatMoney(price)}</td>
        <td class="${stockClass} font-bold">${p.stock || 0}</td>
        <td>
          <button onclick="productsModule.edit('${p.id}')" class="text-blue-400 hover:text-blue-300 mr-3">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="productsModule.delete('${p.id}')" class="text-red-400 hover:text-red-300">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `}).join('') || '<tr><td colspan="4" class="text-center py-8 text-slate-500">No hay productos registrados</td></tr>';
  },

  openModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'productModal';
    modal.innerHTML = `
      <div class="card w-full max-w-md m-auto">
        <h3 class="font-bold text-xl mb-4">Nuevo Producto</h3>
        <div class="space-y-3">
          <input type="text" id="newProdName" placeholder="Nombre del producto *" class="bg-slate-800 border-slate-600 text-white placeholder-slate-500">
          <input type="text" id="newProdSKU" placeholder="SKU/Código" class="bg-slate-800 border-slate-600 text-white placeholder-slate-500">
          <select id="newProdCategory" class="bg-slate-800 border-slate-600 text-white">
            ${this.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('') || '<option value="">Sin categorías</option>'}
          </select>
          <div class="grid grid-cols-2 gap-3">
            <input type="number" id="newProdCost" placeholder="Costo" step="0.01" class="bg-slate-800 border-slate-600 text-white placeholder-slate-500">
            <input type="number" id="newProdMargin" placeholder="Margen %" value="30" class="bg-slate-800 border-slate-600 text-white placeholder-slate-500">
          </div>
          <input type="number" id="newProdStock" placeholder="Stock inicial" value="0" class="bg-slate-800 border-slate-600 text-white placeholder-slate-500">
        </div>
        <div class="flex gap-3 mt-6">
          <button onclick="productsModule.save()" class="btn-primary flex-1">Guardar</button>
          <button onclick="document.getElementById('productModal').remove()" class="btn-secondary flex-1">Cancelar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async save() {
    const name = document.getElementById('newProdName')?.value.trim();
    if (!name) {
      UI.showToast('El nombre es obligatorio', 'error');
      return;
    }

    try {
      const { data, error } = await supabaseClient
        .from('products')
        .insert({
          user_id: Auth.currentUser.id,
          category_id: document.getElementById('newProdCategory')?.value || null,
          name,
          sku: document.getElementById('newProdSKU')?.value || '',
          cost: parseFloat(document.getElementById('newProdCost')?.value || 0),
          margin: parseFloat(document.getElementById('newProdMargin')?.value || 30),
          stock: parseInt(document.getElementById('newProdStock')?.value || 0)
        })
        .select()
        .single();

      if (error) throw error;

      document.getElementById('productModal')?.remove();
      UI.showToast('Producto guardado');
      await this.render();
    } catch (error) {
      UI.showToast('Error: ' + error.message, 'error');
    }
  },

  async edit(id) {
    const p = this.products.find(p => p.id === id);
    const newName = prompt('Editar nombre:', p.name);
    if (newName && newName.trim()) {
      try {
        const { error } = await supabaseClient
          .from('products')
          .update({ name: newName.trim() })
          .eq('id', id);

        if (error) throw error;
        
        UI.showToast('Producto actualizado');
        await this.render();
      } catch (error) {
        UI.showToast('Error: ' + error.message, 'error');
      }
    }
  },

  async delete(id) {
    if (!UI.confirm('¿Eliminar este producto?')) return;

    try {
      const { error } = await supabaseClient
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      UI.showToast('Producto eliminado');
      await this.render();
    } catch (error) {
      UI.showToast('Error: ' + error.message, 'error');
    }
  }
};