// ============================================
// QUOTES MODULE
// ============================================

import { supabase, callEdgeFunction } from './supabase-client.js';
import { Auth } from './auth.js';
import { UI } from './ui.js';

export const quotesModule = {
  quotes: [],
  clients: [],
  products: [],
  items: [],

  async load() {
    await this.loadClients();
    await this.loadProducts();
    await this.render();
  },

  async loadClients() {
    const { data } = await supabase
      .from('clients')
      .select('id, name')
      .eq('user_id', Auth.currentUser.id)
      .order('name');
    this.clients = data || [];
  },

  async loadProducts() {
    const { data } = await supabase
      .from('products')
      .select('id, name, price')
      .eq('user_id', Auth.currentUser.id)
      .order('name');
    this.products = data || [];
  },

  async render() {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select(`*, clients (name)`)
        .eq('user_id', Auth.currentUser.id)
        .order('date', { ascending: false });

      if (error) throw error;

      this.quotes = data || [];
      this.renderTable();
    } catch (error) {
      UI.showToast('Error cargando cotizaciones: ' + error.message, 'error');
    }
  },

  renderTable() {
    const tbody = document.getElementById('quotesTableBody');
    if (!tbody) return;

    tbody.innerHTML = this.quotes.map(q => {
      const statusColors = {
        'pendiente': 'bg-yellow-500/20 text-yellow-300',
        'aprobada': 'bg-emerald-500/20 text-emerald-300',
        'rechazada': 'bg-red-500/20 text-red-300',
        'expirada': 'bg-slate-500/20 text-slate-300'
      };

      return `
      <tr class="hover:bg-slate-800/50 transition-colors">
        <td class="font-mono text-xs text-slate-400">${q.number}</td>
        <td class="text-xs text-slate-400">${UI.formatDate(q.date)}</td>
        <td class="text-white">${q.clients?.name || 'N/A'}</td>
        <td class="text-right font-medium text-blue-400">${UI.formatMoney(q.total)}</td>
        <td>
          <span class="px-2 py-1 rounded-full text-xs ${statusColors[q.status] || 'bg-slate-500/20 text-slate-300'}">
            ${q.status}
          </span>
        </td>
        <td>
          <button onclick="quotesModule.view('${q.id}')" class="text-blue-400 hover:text-blue-300 mr-2">
            <i class="fas fa-eye"></i>
          </button>
          <button onclick="quotesModule.convertToInvoice('${q.id}')" class="text-emerald-400 hover:text-emerald-300 mr-2" title="Convertir a Factura">
            <i class="fas fa-file-invoice"></i>
          </button>
        </td>
      </tr>
    `}).join('') || '<tr><td colspan="6" class="text-center py-8 text-slate-500">Sin cotizaciones registradas</td></tr>';
  },

  openModal() {
    this.items = [];
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'quoteModal';
    modal.innerHTML = `
      <div class="card w-full max-w-2xl m-auto max-h-[90vh] overflow-y-auto">
        <h3 class="font-bold text-xl mb-4">Nueva Cotización</h3>
        
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm text-slate-400 mb-1">Cliente *</label>
            <select id="quoteClient" class="bg-slate-800 border-slate-600 text-white">
              <option value="">Seleccionar...</option>
              ${this.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
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
              <option value="">Producto...</option>
              ${this.products.map(p => `<option value="${p.id}" data-price="${p.price}">${p.name} - ${UI.formatMoney(p.price)}</option>`).join('')}
            </select>
            <input type="number" id="quoteQty" value="1" min="1" class="w-20 bg-slate-800 border-slate-600 text-white">
            <button onclick="quotesModule.addItem()" class="btn-primary px-4">
              <i class="fas fa-plus"></i>
            </button>
          </div>
          <div id="quoteItems" class="space-y-2 max-h-40 overflow-y-auto mb-4"></div>
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
  },

  addItem() {
    const select = document.getElementById('quoteProduct');
    const qty = parseFloat(document.getElementById('quoteQty')?.value || 1);
    
    if (!select?.value) return;
    
    const product = this.products.find(p => p.id === select.value);
    const price = parseFloat(select.options[select.selectedIndex].dataset.price);
    
    this.items.push({
      product_id: select.value,
      description: product.name,
      qty,
      price,
      discount: 0
    });
    
    this.renderItems();
  },

  renderItems() {
    const container = document.getElementById('quoteItems');
    if (!container) return;

    container.innerHTML = this.items.map((item, idx) => `
      <div class="flex justify-between items-center p-2 bg-slate-800 rounded">
        <span>${item.qty}x ${item.description}</span>
        <div class="flex items-center gap-3">
          <span class="text-blue-400">${UI.formatMoney(item.qty * item.price)}</span>
          <button onclick="quotesModule.removeItem(${idx})" class="text-red-400">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    `).join('');

    const total = this.items.reduce((a, i) => a + (i.qty * i.price), 0);
    const el = document.getElementById('quoteTotal');
    if (el) el.textContent = UI.formatMoney(total);
  },

  removeItem(idx) {
    this.items.splice(idx, 1);
    this.renderItems();
  },

  async save() {
    const clientId = document.getElementById('quoteClient')?.value;
    
    if (!clientId) {
      UI.showToast('Selecciona un cliente', 'error');
      return;
    }
    
    if (this.items.length === 0) {
      UI.showToast('Agrega al menos un item', 'error');
      return;
    }

    try {
      const result = await callEdgeFunction('documents', {
        action: 'create_quote',
        client_id: clientId,
        items: this.items,
        valid_until: document.getElementById('quoteValid')?.value,
        notes: '',
        terms: ''
      });

      if (result.error) throw new Error(result.error);

      document.getElementById('quoteModal')?.remove();
      UI.showToast('Cotización guardada');
      await this.render();
    } catch (error) {
      UI.showToast('Error: ' + error.message, 'error');
    }
  },

  async convertToInvoice(quoteId) {
    const quote = this.quotes.find(q => q.id === quoteId);
    if (!quote) return;

    if (!UI.confirm(`¿Convertir cotización ${quote.number} a factura?`)) return;

    try {
      const { data: items } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quoteId);

      const result = await callEdgeFunction('documents', {
        action: 'create_invoice',
        client_id: quote.client_id,
        quote_id: quoteId,
        items: items.map(i => ({
          product_id: i.product_id,
          description: i.description,
          qty: i.qty,
          price: i.price,
          discount: i.discount
        })),
        due_date: new Date(Date.now() + 15*86400000).toISOString().split('T')[0]
      });

      if (result.error) throw new Error(result.error);

      UI.showToast('Factura creada exitosamente');
      window.router.navigate('invoices');
    } catch (error) {
      UI.showToast('Error: ' + error.message, 'error');
    }
  },

  view(id) {
    UI.showToast('Vista detallada en desarrollo');
  }
};

window.quotesModule = quotesModule;