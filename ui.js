// ============================================
// UI - Utilidades de Interfaz
// ============================================

const UI = {
  modal(id, show = true) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.toggle('active', show);
      el.style.display = show ? 'flex' : 'none';
    }
  },

  formatMoney(amount) {
    const settings = DB.getAll('settings')[0] || {};
    return `${settings.currency || 'B/.'} ${parseFloat(amount || 0).toFixed(2)}`;
  },

  formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-PA');
  },

  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-xl text-white font-medium z-50 fade-in ${
      type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },

  toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('open');
  }
};