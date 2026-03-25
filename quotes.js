// ============================================
// QUOTES MODULE (Cotizaciones)
// ============================================

const quotesModule = {
  render() {
    const quotes = DB.getAll('quotes').sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const tbody = document.getElementById('quotesTableBody');
    if (tbody) {
      tbody.innerHTML = quotes.map(q => {
        const statusColors = {
          'pendiente': 'bg-yellow-500/20 text-yellow-300',
          'aprobada': 'bg-emerald-500/20 text-emerald-300',
          'rechazada': 'bg-red-500/20 text-red-300'
        };
        
        return `
        <tr class="hover:bg-slate-800/50 transition-colors">
          <td class="font-mono text-xs text-slate-400">${q.number}</td>
          <td class="text-xs text-slate-400">${UI.formatDate(q.date)}</td>
          <td class="text-white">${q.client_name || 'N/A'}</td>
          <td class="text-right font-medium text-blue-400">${UI.formatMoney(q.total)}</td>
          <td>
            <span class="px-2 py-1 rounded-full text-xs ${statusColors[q.status] || 'bg-slate-500/20 text-slate-300'}">
              ${q.status}
            </span>
          </td>
          <td>
            <button onclick="quotesModule.view('${q.id}')" class="text-blue-400 hover:text-blue-300 mr-2" title="Ver">
              <i class="fas fa-eye"></i>
            </button>
            <button onclick="quotesModule.print('${q.id}')" class="text-slate-400 hover:text-white" title="Imprimir">
              <i class="fas fa-print"></i>
            </button>
          </td>
        </tr>
      `}).join('') || '<tr><td colspan="6" class="text-center py-8 text-slate-500">Sin cotizaciones registradas</td></tr>';
    }
  },

  openModal() {
    const clients = DB.getAll('clients');
    const products = DB.getAll('products');
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'quoteModal';
    modal.innerHTML = `
      <div class="card w-full max-w-2xl m-auto max-h-[90vh] overflow-y-auto">
        <h3 class="font-bold text-xl mb-4">Nueva Cotización #${DB.getNextNumber('quote')}</h3>
        
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm text-slate-400 mb-1">Cliente *</label>
            <select id="quoteClient" class="bg-slate-800 border-slate-600 text-white">
              <option value="">Seleccionar cliente...</option>
              ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-sm text-slate-400 mb-1">Válido hasta</label>
            <input type="date" id="quoteValid" class="bg-slate-800 border-slate-600 text-white" 
              value="${new Date(Date.now() + 30*86400000).toISOString().split('T')[0]}">
          </div>
        </div>

        <div class="border-t border-slate-700 pt-4 mb-4">
          <label class="block text-sm text-slate-400 mb-2">Agregar Items</label>
          <div class="flex gap-2 mb-2">
            <select id="quoteProduct" class="flex-1 bg-slate-800 border-slate-600 text-white">
              <option value="">Seleccionar producto...</option>
              ${products.map(p => `<option value="${p.id}" data-price="${(p.cost * 1.3).toFixed(2)}">${p.name} - ${UI.formatMoney(p.cost * 1.3)}</option>`).join('')}
            </select>
            <input type="number" id="quoteQty" placeholder="Cant" value="1" min="1" class="w-20 bg-slate-800 border-slate-600 text-white">
            <button onclick="quotesModule.addItem()" class="btn-primary px-4">
              <i class="fas fa-plus"></i>
            </button>
          </div>
          <div id="quoteItems" class="space-y-2 max-h-40 overflow-y-auto"></div>
        </div>

        <div class="flex justify-between items-center border-t border-slate-700 pt-4">
          <div class="text-2xl font-bold text-blue-400">Total: <span id="quoteTotal">B/. 0.00</span></div>
          <div class="flex gap-3">
            <button onclick="quotesModule.save()" class="btn-primary">Guardar Cotización</button>
            <button onclick="document.getElementById('quoteModal').remove()" class="btn-secondary">Cancelar</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    this.items = [];
    this.updateTotal();
  },

  items: [],

  addItem() {
    const select = document.getElementById('quoteProduct');
    const qty = parseInt(document.getElementById('quoteQty')?.value || 1);
    const productId = select?.value;
    
    if (!productId) return;
    
    const product = DB.getById('products', productId);
    const price = parseFloat(select.options[select.selectedIndex].dataset.price);
    
    this.items.push({
      id: crypto.randomUUID(),
      product_id: productId,
      name: product.name,
      qty,
      price,
      total: qty * price
    });
    
    this.renderItems();
  },

  renderItems() {
    const container = document.getElementById('quoteItems');
    if (container) {
      container.innerHTML = this.items.map((item, idx) => `
        <div class="flex justify-between items-center p-2 bg-slate-800 rounded">
          <span>${item.qty}x ${item.name}</span>
          <div class="flex items-center gap-3">
            <span class="text-blue-400">${UI.formatMoney(item.total)}</span>
            <button onclick="quotesModule.removeItem(${idx})" class="text-red-400">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      `).join('');
    }
    this.updateTotal();
  },

  removeItem(idx) {
    this.items.splice(idx, 1);
    this.renderItems();
  },

  updateTotal() {
    const total = this.items.reduce((a, i) => a + i.total, 0);
    const el = document.getElementById('quoteTotal');
    if (el) el.textContent = UI.formatMoney(total);
  },

  save() {
    const clientId = document.getElementById('quoteClient')?.value;
    if (!clientId) {
      UI.showToast('Selecciona un cliente', 'error');
      return;
    }
    
    if (this.items.length === 0) {
      UI.showToast('Agrega al menos un item', 'error');
      return;
    }

    const client = DB.getById('clients', clientId);
    const total = this.items.reduce((a, i) => a + i.total, 0);

    DB.save('quotes', {
      id: crypto.randomUUID(),
      number: DB.getNextNumber('quote'),
      client_id: clientId,
      client_name: client.name,
      date: new Date().toISOString().split('T')[0],
      valid_until: document.getElementById('quoteValid')?.value,
      items: [...this.items],
      total,
      status: 'pendiente',
      notes: ''
    });

    document.getElementById('quoteModal')?.remove();
    UI.showToast('Cotización guardada');
    this.render();
  },

  view(id) {
    // Implementar vista detallada
  },

  print(id) {
    // Implementar impresión/PDF
    UI.showToast('Función de impresión en desarrollo');
  }
};