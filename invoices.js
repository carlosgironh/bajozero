// ============================================
// INVOICES MODULE (Facturas)
// ============================================

const invoicesModule = {
  render() {
    const invoices = DB.getAll('invoices').sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const tbody = document.getElementById('invoicesTableBody');
    if (tbody) {
      tbody.innerHTML = invoices.map(i => {
        const statusColors = {
          'emitido': 'bg-blue-500/20 text-blue-300',
          'pagado': 'bg-emerald-500/20 text-emerald-300',
          'anulado': 'bg-red-500/20 text-red-300',
          'vencido': 'bg-yellow-500/20 text-yellow-300'
        };
        
        const pending = (i.total || 0) - (i.paid || 0);
        
        return `
        <tr class="hover:bg-slate-800/50 transition-colors">
          <td class="font-mono text-xs text-slate-400">${i.number}</td>
          <td class="text-xs text-slate-400">${UI.formatDate(i.date)}</td>
          <td class="text-white">${i.client_name || 'N/A'}</td>
          <td class="text-right font-medium text-emerald-400">${UI.formatMoney(i.total)}</td>
          <td>
            <span class="px-2 py-1 rounded-full text-xs ${statusColors[i.status] || 'bg-slate-500/20 text-slate-300'}">
              ${i.status}
            </span>
            ${pending > 0 && i.status !== 'anulado' ? `<div class="text-xs text-red-400 mt-1">Por cobrar: ${UI.formatMoney(pending)}</div>` : ''}
          </td>
          <td>
            <button onclick="invoicesModule.view('${i.id}')" class="text-blue-400 hover:text-blue-300 mr-2">
              <i class="fas fa-eye"></i>
            </button>
            <button onclick="invoicesModule.recordPayment('${i.id}')" class="text-emerald-400 hover:text-emerald-300 mr-2" title="Registrar Pago">
              <i class="fas fa-dollar-sign"></i>
            </button>
            <button onclick="invoicesModule.print('${i.id}')" class="text-slate-400 hover:text-white">
              <i class="fas fa-print"></i>
            </button>
          </td>
        </tr>
      `}).join('') || '<tr><td colspan="6" class="text-center py-8 text-slate-500">Sin facturas registradas</td></tr>';
    }
  },

  openModal() {
    // Similar a quotes pero para facturas
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'invoiceModal';
    
    const clients = DB.getAll('clients');
    const products = DB.getAll('products');
    
    modal.innerHTML = `
      <div class="card w-full max-w-2xl m-auto">
        <h3 class="font-bold text-xl mb-4">Nueva Factura #${DB.getNextNumber('invoice')}</h3>
        
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm text-slate-400 mb-1">Cliente *</label>
            <select id="invClient" class="bg-slate-800 border-slate-600 text-white">
              <option value="">Seleccionar...</option>
              ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-sm text-slate-400 mb-1">Vencimiento</label>
            <input type="date" id="invDue" class="bg-slate-800 border-slate-600 text-white" 
              value="${new Date(Date.now() + 15*86400000).toISOString().split('T')[0]}">
          </div>
        </div>

        <div class="border-t border-slate-700 pt-4">
          <div class="flex gap-2 mb-2">
            <select id="invProduct" class="flex-1 bg-slate-800 border-slate-600 text-white">
              <option value="">Producto...</option>
              ${products.map(p => `<option value="${p.id}" data-price="${(p.cost * 1.3).toFixed(2)}">${p.name}</option>`).join('')}
            </select>
            <input type="number" id="invQty" value="1" min="1" class="w-20 bg-slate-800 border-slate-600 text-white">
            <button onclick="invoicesModule.addItem()" class="btn-primary px-4"><i class="fas fa-plus"></i></button>
          </div>
          <div id="invItems" class="space-y-2 max-h-40 overflow-y-auto mb-4"></div>
        </div>

        <div class="flex justify-between items-center border-t border-slate-700 pt-4">
          <div class="text-2xl font-bold text-emerald-400">Total: <span id="invTotal">B/. 0.00</span></div>
          <div class="flex gap-3">
            <button onclick="invoicesModule.save()" class="btn-primary">Emitir Factura</button>
            <button onclick="document.getElementById('invoiceModal').remove()" class="btn-secondary">Cancelar</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    this.items = [];
  },

  items: [],

  addItem() {
    const select = document.getElementById('invProduct');
    const qty = parseInt(document.getElementById('invQty')?.value || 1);
    if (!select?.value) return;
    
    const product = DB.getById('products', select.value);
    const price = parseFloat(select.options[select.selectedIndex].dataset.price);
    
    this.items.push({
      product_id: select.value,
      name: product.name,
      qty,
      price,
      total: qty * price
    });
    this.renderItems();
  },

  renderItems() {
    const container = document.getElementById('invItems');
    if (container) {
      container.innerHTML = this.items.map((item, idx) => `
        <div class="flex justify-between p-2 bg-slate-800 rounded">
          <span>${item.qty}x ${item.name}</span>
          <span class="text-emerald-400">${UI.formatMoney(item.total)}</span>
        </div>
      `).join('');
    }
    const total = this.items.reduce((a, i) => a + i.total, 0);
    const el = document.getElementById('invTotal');
    if (el) el.textContent = UI.formatMoney(total);
  },

  save() {
    const clientId = document.getElementById('invClient')?.value;
    if (!clientId || this.items.length === 0) {
      UI.showToast('Completa todos los campos', 'error');
      return;
    }

    const client = DB.getById('clients', clientId);
    const total = this.items.reduce((a, i) => a + i.total, 0);

    DB.save('invoices', {
      id: crypto.randomUUID(),
      number: DB.getNextNumber('invoice'),
      client_id: clientId,
      client_name: client.name,
      date: new Date().toISOString().split('T')[0],
      due_date: document.getElementById('invDue')?.value,
      items: [...this.items],
      total,
      paid: 0,
      status: 'emitido'
    });

    document.getElementById('invoiceModal')?.remove();
    UI.showToast('Factura emitida');
    this.render();
  },

  recordPayment(id) {
    const inv = DB.getById('invoices', id);
    const pending = inv.total - (inv.paid || 0);
    const amount = parseFloat(prompt(`Monto a pagar (pendiente: ${UI.formatMoney(pending)}):`, pending));
    
    if (amount && amount > 0) {
      inv.paid = (inv.paid || 0) + amount;
      if (inv.paid >= inv.total) inv.status = 'pagado';
      DB.save('invoices', inv);
      
      // Registrar en pagos
      DB.save('payments', {
        id: crypto.randomUUID(),
        invoice_id: id,
        amount,
        date: new Date().toISOString().split('T')[0],
        method: 'efectivo'
      });
      
      this.render();
      UI.showToast('Pago registrado');
    }
  },

  view(id) {},
  print(id) {
    UI.showToast('Imprimiendo factura...');
  }
};