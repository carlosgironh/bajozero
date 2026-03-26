// ============================================
// ROUTER SPA
// ============================================

const router = {
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
        if (window.dashboardModule) dashboardModule.init(); 
        break;
      case 'clients': 
        if (window.clientsModule) clientsModule.load(); 
        break;
      case 'catalog': 
        if (window.productsModule) productsModule.load(); 
        break;
      case 'quotes': 
        if (window.quotesModule) quotesModule.load(); 
        break;
      case 'invoices': 
        if (window.invoicesModule) invoicesModule.load(); 
        break;
      case 'payments': 
        if (window.paymentsModule) paymentsModule.load(); 
        break;
      case 'settings': 
        if (window.settingsModule) settingsModule.load(); 
        break;
      case 'users': 
        if (window.adminModule) adminModule.loadUsers(); 
        break;
      case 'all-data': 
        if (window.adminModule) adminModule.loadDataView(); 
        break;
    }
  }
};