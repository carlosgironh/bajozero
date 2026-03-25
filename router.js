// ============================================
// ROUTER - Navegación SPA
// ============================================

const router = {
  currentRoute: 'dashboard',

  navigate(route) {
    this.currentRoute = route;
    
    // Ocultar todos los módulos
    document.querySelectorAll('.module').forEach(m => {
      m.classList.remove('active');
      m.style.display = 'none';
    });
    
    // Mostrar el módulo objetivo
    const target = document.getElementById(`module-${route}`);
    if (target) {
      target.classList.add('active');
      target.style.display = 'block';
    }
    
    // Actualizar navegación
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('bg-slate-800', 'text-blue-400', 'active');
      if (btn.dataset.route === route) {
        btn.classList.add('bg-slate-800', 'text-blue-400', 'active');
      }
    });

    // Cerrar sidebar en móvil
    if (window.innerWidth < 1024) {
      document.getElementById('sidebar')?.classList.remove('open');
    }

    // Inicializar módulos específicos
    this.initModule(route);
  },

  initModule(route) {
    switch(route) {
      case 'dashboard': dashboardModule?.init(); break;
      case 'clients': clientsModule?.render(); break;
      case 'catalog': catalogModule?.render(); break;
      case 'quotes': quotesModule?.render(); break;
      case 'invoices': invoicesModule?.render(); break;
      case 'users': adminModule?.renderUsers(); break;
      case 'all-data': adminModule?.renderDataButtons(); break;
      case 'settings': settingsModule?.init(); break;
    }
  }
};