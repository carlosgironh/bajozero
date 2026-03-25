// ============================================
// INVOICES MODULE
// ============================================

import { supabase, callEdgeFunction } from './supabase-client.js';
import { Auth } from './auth.js';
import { UI } from './ui.js';

export const invoicesModule = {
  invoices: [],
  clients: [],

  async load() {
    await this.loadClients();
    await this.render();
  },

  async loadClients() {
    const { data } = await supabase
      .from('clients')
      .select('id, name')
      .eq('user_id', Auth.currentUser.id);
    this.clients = data || [];
  },

  async render() {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`*, clients (name)`)
        .eq('user_id', Auth.currentUser.id)
        .order('date', { ascending: false });

      if (error) throw error;

      this.invoices = data || [];
      this.renderTable();
    } catch (error) {
      UI.showToast('Error cargando facturas: ' + error.message, 'error');
    }
  },

  renderTable() {
    const tbody = document.getElementById('invoicesTableBody');
    if (!tbody) return;

    tbody.innerHTML = this.invoices.map(i => {
      const statusColors = {
        'emitido': 'bg-blue-500/20 text-blue-300',
        'pagado': 'bg-emerald-500/20 text-emerald-300',
        'parcial': 'bg-yellow-500/20 text-yellow-300',
        'vencido': 'bg-red-500/20 text-red-300',
        'anulado': 'bg-slate-500/20 text-slate-300'
      };

      const pending = i.total - i.paid;

      return `
      <tr class="hover:bg-slate-800/50 transition-colors">
        <td class="font-mono text-xs text-slate-400">${i.number}</td>
        <td class="text-xs text-slate-400">${UI.formatDate(i.date)}</td>
        <td class="text-white">${i.clients?.name || 'N/A'}</td>
        <td class="text-right font-medium text-emerald-400">${UI.formatMoney(i.total)}</td>
        <td>
          <span class="px-2 py-1 rounded-full text-xs ${statusColors[i.status] || 'bg-slate-500/20 text-slate-300'}">
            ${i.status}
          </span>
          ${pending > 0 && i.status !== 'anulado' ? `<div class="text-xs text-red-400 mt-1">Por cobrar: ${UI.formatMoney(pending)}</div>` : ''}
        </td>
        <td>
          <button onclick="invoicesModule.recordPayment('${i.id}')" class="text-emerald-400 hover:text-emerald-300 mr-2" title="Registrar Pago">
            <i class="fas fa-dollar-sign"></i>
          </button>
          <button onclick="invoicesModule.view('${i.id}')" class="text-blue-400 hover:text-blue-300 mr-2">
            <i class="fas fa-eye"></i>
          </button>
        </td>
      </tr>
    `}).join('') || '<tr><td colspan="6" class="text-center py-8 text-slate-500">Sin facturas registradas</td></tr>';
  },

  openModal() {
    UI.showToast('Crear factura desde cotización');
  },

  async recordPayment(invoiceId) {
    const invoice = this.invoices.find(i => i.id === invoiceId);
    const pending = invoice.total - invoice.paid;
    
    const amount = parseFloat(prompt(`Monto a pagar (pendiente: ${UI.formatMoney(pending)}):`, pending));
    
    if (!amount || amount <= 0) return;

    try {
      const result = await callEdgeFunction('documents', {
        action: 'record_payment',
        invoice_id: invoiceId,
        amount,
        method: 'efectivo',
        reference: '',
        notes: ''
      });

      if (result.error) throw new Error(result.error);

      UI.showToast('Pago registrado');
      await this.render();
    } catch (error) {
      UI.showToast('Error: ' + error.message, 'error');
    }
  },

  view(id) {
    UI.showToast('Vista detallada en desarrollo');
  }
};

window.invoicesModule = invoicesModule;