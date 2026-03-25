// ============================================
// DASHBOARD MODULE
// ============================================

const dashboardModule = {
  init() {
    this.updateDate();
    this.renderStats();
    this.renderSummary();
  },

  updateDate() {
    const el = document.getElementById('dashboardDate');
    if (el) {
      el.textContent = new Date().toLocaleDateString('es-PA', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    }
  },

  renderStats() {
    const quotes = DB.getAll('quotes');
    const invoices = DB.getAll('invoices');
    const clients = DB.getAll('clients');
    
    const pending = invoices
      .filter(i => i.status !== 'anulado' && i.status !== 'pagado')
      .reduce((a, i) => a + ((i.total || 0) - (i.paid || 0)), 0);

    const stats = [
      { label: 'Cotizaciones', value: quotes.length, icon: 'file-invoice-dollar', color: 'blue' },
      { label: 'Facturas', value: invoices.filter(i => i.status !== 'anulado').length, icon: 'file-invoice', color: 'emerald' },
      { label: 'Clientes', value: clients.length, icon: 'users', color: 'purple' },
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
  },

  renderSummary() {
    const container = document.getElementById('monthlySummary');
    if (!container) return;

    const invoices = DB.getAll('invoices');
    const thisMonth = invoices.filter(i => {
      const d = new Date(i.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const total = thisMonth.reduce((a, i) => a + (i.total || 0), 0);
    
    container.innerHTML = `
      <div class="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
        <span class="text-slate-400">Facturas este mes</span>
        <span class="font-bold text-emerald-400">${thisMonth.length}</span>
      </div>
      <div class="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
        <span class="text-slate-400">Total facturado</span>
        <span class="font-bold text-blue-400">${UI.formatMoney(total)}</span>
      </div>
      <div class="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
        <span class="text-slate-400">Promedio por factura</span>
        <span class="font-bold text-purple-400">${UI.formatMoney(total / (thisMonth.length || 1))}</span>
      </div>
    `;
  }
};