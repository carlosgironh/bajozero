// ============================================
// DASHBOARD MODULE
// ============================================

import { supabase } from './supabase-client.js';
import { Auth } from './auth.js';
import { UI } from './ui.js';

export const dashboardModule = {
  async init() {
    this.updateDate();
    await this.renderStats();
    await this.renderSummary();
  },

  updateDate() {
    const el = document.getElementById('dashboardDate');
    if (el) {
      el.textContent = new Date().toLocaleDateString('es-PA', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    }
  },

  async renderStats() {
    try {
      const { data: quotes } = await supabase
        .from('quotes')
        .select('id, status')
        .eq('user_id', Auth.currentUser.id);

      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, status, total, paid')
        .eq('user_id', Auth.currentUser.id);

      const { data: clients } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', Auth.currentUser.id);

      const pending = invoices
        ?.filter(i => i.status !== 'anulado' && i.status !== 'pagado')
        .reduce((a, i) => a + (i.total - i.paid), 0) || 0;

      const stats = [
        { label: 'Cotizaciones', value: quotes?.length || 0, icon: 'file-invoice-dollar', color: 'blue' },
        { label: 'Facturas', value: invoices?.filter(i => i.status !== 'anulado').length || 0, icon: 'file-invoice', color: 'emerald' },
        { label: 'Clientes', value: clients?.length || 0, icon: 'users', color: 'purple' },
        { label: 'Por Cobrar', value: UI.formatMoney(pending), icon: 'clock', color: 'yellow' }
      ];

      const container = document.getElementById('dashboardStats');
      if (container) {
        container.innerHTML = stats.map(s => `
          <div class="card hover:scale-105 transition-transform cursor-pointer">
            <div class="flex justify-between items-start">
              <div>
                <p class="text-slate-400 text-sm">${s.label}</p>
                <p class="text-3xl font-bold text-${s.color}-400">${s.value}</p>
              </div>
              <div class="w-12 h-12 rounded-xl bg-${s.color}-500/20 flex items-center justify-center text-${s.color}-400">
                <i class="fas fa-${s.icon} text-xl"></i>
              </div>
            </div>
          </div>
        `).join('');
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  },

  async renderSummary() {
    const container = document.getElementById('monthlySummary');
    if (!container) return;

    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data: invoices } = await supabase
        .from('invoices')
        .select('total, status')
        .eq('user_id', Auth.currentUser.id)
        .gte('date', firstDay)
        .lte('date', lastDay);

      const total = invoices?.reduce((a, i) => a + (i.total || 0), 0) || 0;
      const count = invoices?.length || 0;

      container.innerHTML = `
        <div class="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
          <span class="text-slate-400">Facturas este mes</span>
          <span class="font-bold text-emerald-400">${count}</span>
        </div>
        <div class="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
          <span class="text-slate-400">Total facturado</span>
          <span class="font-bold text-blue-400">${UI.formatMoney(total)}</span>
        </div>
        <div class="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
          <span class="text-slate-400">Promedio por factura</span>
          <span class="font-bold text-purple-400">${UI.formatMoney(total / (count || 1))}</span>
        </div>
      `;
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  }
};

window.dashboardModule = dashboardModule;