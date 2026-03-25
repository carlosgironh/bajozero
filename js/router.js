// ============================================
// ROUTER SPA
// ============================================

import { Auth } from './auth.js';
import { UI } from './ui.js';

export const router = {
  currentRoute: 'dashboard',

  navigate(route) {
    if ((route === 'users' || route === 'all-data') && !Auth.isAdmin()) {
      UI.showToast('Acceso denegado', 'error');
      return;
    }

    this.currentRoute = route;
    
    document.querySelectorAll('.module').forEach(m => {
      m.classList.remove('active');
      m.style.display = 'none';
    });
    
    const target = document.getElementById(`module-${route}`);
    if (target) {
      target.classList.add('active');
      target.style.display = 'block';
    }
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('bg-slate-800', 'text-blue-400', 'active');
      if (btn.dataset.route === route) {
        btn.classList.add('bg-slate-800', 'text-blue-400', 'active');
      }
    });

    UI.closeSidebarMobile();
    this.initModule(route);
    window.history.pushState({ route }, '', `#${route}`);
  },

  initModule(route) {
    switch(route) {
      case 'dashboard': 
        if (window.dashboardModule) window.dashboardModule.init(); 
        break;
      case 'clients': 
        if (window.clientsModule) window.clientsModule.load(); 
        break;
      case 'catalog': 
        if (window.productsModule) window.productsModule.load(); 
        break;
      case 'quotes': 
        if (window.quotesModule) window.quotesModule.load(); 
        break;
      case 'invoices': 
        if (window.invoicesModule) window.invoicesModule.load(); 
        break;
      case 'payments': 
        if (window.paymentsModule) window.paymentsModule.load(); 
        break;
      case 'settings': 
        if (window.settingsModule) window.settingsModule.load(); 
        break;
      case 'users': 
        if (window.adminModule) window.adminModule.loadUsers(); 
        break;
      case 'all-data': 
        if (window.adminModule) window.adminModule.loadDataView(); 
        break;
    }
  }
};

window.router = router;