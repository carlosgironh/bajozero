// ============================================
// CATALOG MODULE (Productos)
// ============================================

const catalogModule = {
  render() {
    const products = DB.getAll('products');
    const search = document.getElementById('productSearch')?.value?.toLowerCase() || '';
    
    const filtered = products.filter(p => 
      !search || p.name?.toLowerCase().includes(search)
    );

    const tbody = document.getElementById('catalogTableBody');
    if (tbody) {
      tbody.innerHTML = filtered.map(p => {
        const price = (p.cost || 0) * (1 + (p.margin || 30) / 100);
        const stockClass = (p.stock || 0) < 5 ? 'text-red-400' : 'text-emerald-400';
        
        return `
        <tr class="hover:bg-slate-800/50 transition-colors">
          <td>
            <div class="font-medium text-white">${p.name}</div>
            <div class="text-xs text-slate-500">${p.sku || 'Sin SKU'}</div>
          </td>
          <td class="text-blue-400 font-medium">${UI.formatMoney(price)}</td>
          <td class="${stockClass} font-bold">${p.stock || 0}</td>
          <td>
            <button onclick="catalogModule.edit('${p.id}')" class="text-blue-400 hover:text-blue-300 mr-3">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="catalogModule.delete('${p.id}')" class="text-red-400 hover:text-red-300">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `}).join('') || '<tr><td colspan="4" class="text-center py-8 text-slate-500">No hay productos registrados</td></tr>';
    }
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
          <div class="grid grid-cols-2 gap-3">
            <input type="number" id="newProdCost" placeholder="Costo" step="0.01" class="bg-slate-800 border-slate-600 text-white placeholder-slate-500">
            <input type="number" id="newProdMargin" placeholder="Margen %" value="30" class="bg-slate-800 border-slate-600 text-white placeholder-slate-500">
          </div>
          <input type="number" id="newProdStock" placeholder="Stock inicial" value="0" class="bg-slate-800 border-slate-600 text-white placeholder-slate-500">
        </div>
        <div class="flex gap-3 mt-6">
          <button onclick="catalogModule.save()" class="btn-primary flex-1">Guardar</button>
          <button onclick="document.getElementById('productModal').remove()" class="btn-secondary flex-1">Cancelar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  save() {
    const name = document.getElementById('newProdName')?.value.trim();
    if (!name) {
      UI.showToast('El nombre es obligatorio', 'error');
      return;
    }

    DB.save('products', {
      id: crypto.randomUUID(),
      name,
      sku: document.getElementById('newProdSKU')?.value || '',
      cost: parseFloat(document.getElementById('newProdCost')?.value || 0),
      margin: parseFloat(document.getElementById('newProdMargin')?.value || 30),
      stock: parseInt(document.getElementById('newProdStock')?.value || 0),
      active: true
    });

    document.getElementById('productModal')?.remove();
    UI.showToast('Producto guardado');
    this.render();
  },

  edit(id) {
    // Implementación similar a clients
    const p = DB.getById('products', id);
    const newName = prompt('Editar nombre:', p.name);
    if (newName) {
      p.name = newName;
      DB.save('products', p);
      this.render();
    }
  },

  delete(id) {
    if (confirm('¿Eliminar este producto?')) {
      DB.delete('products', id);
      this.render();
      UI.showToast('Producto eliminado');
    }
  }
};