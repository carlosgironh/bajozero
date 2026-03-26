// ============================================
// UTILIDADES DE UI
// ============================================

const UI = {
  modal(id, show = true) {
    const el = document.getElementById(id);
    if (el) {
      if (show) {
        el.classList.add('active');
        el.style.display = 'flex';
      } else {
        el.classList.remove('active');
        el.style.display = 'none';
      }
    }
  },

  formatMoney(amount, currency = 'B/.') {
    return `${currency} ${parseFloat(amount || 0).toFixed(2)}`;
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
  },

  closeSidebarMobile() {
    if (window.innerWidth < 1024) {
      document.getElementById('sidebar')?.classList.remove('open');
    }
  },

  confirm(message) {
    return window.confirm(message);
  },

  showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      `;
    }
  },

  showError(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="text-center py-12 text-red-400">
          <i class="fas fa-exclamation-circle text-4xl mb-4"></i>
          <p>${message}</p>
        </div>
      `;
    }
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};