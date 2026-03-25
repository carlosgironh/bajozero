// ============================================
// AUTH - Sistema de Autenticación
// ============================================

const Auth = {
  getUsers() {
    return JSON.parse(localStorage.getItem('a3_system_users') || '[]');
  },

  saveUsers(users) {
    localStorage.setItem('a3_system_users', JSON.stringify(users));
  },

  createUser(username, password, companyName, role = 'user') {
    const users = this.getUsers();
    
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, error: 'Usuario ya existe' };
    }

    const newUser = {
      id: crypto.randomUUID(),
      username,
      password,
      company_name: companyName || username,
      role: role,
      created_at: new Date().toISOString(),
      active: true
    };

    users.push(newUser);
    this.saveUsers(users);
    this.initializeUserData(newUser.id);
    
    return { success: true, user: newUser };
  },

  initializeUserData(userId) {
    const prefix = `a3_user_${userId}_`;
    
    localStorage.setItem(prefix + 'categories', JSON.stringify([
      { id: '1', name: 'General', active: true },
      { id: '2', name: 'Servicios', active: true }
    ]));

    localStorage.setItem(prefix + 'settings', JSON.stringify([{
      id: '1',
      company_name: 'Mi Empresa',
      company_ruc: '',
      tax_rate: 7,
      currency: 'B/.',
      prefix_quotes: 'COT-',
      prefix_invoices: 'FAC-'
    }]));

    localStorage.setItem(prefix + 'sequence_quote', '1000');
    localStorage.setItem(prefix + 'sequence_invoice', '1000');
  },

  login(username, password) {
    const users = this.getUsers();
    const user = users.find(u => 
      u.username.toLowerCase() === username.toLowerCase() && 
      u.password === password &&
      u.active
    );
    
    if (!user) return { success: false, error: 'Usuario o contraseña incorrectos' };
    
    // GUARDAR EL USUARIO COMPLETO incluyendo role
    sessionStorage.setItem('a3_current_user', JSON.stringify(user));
    sessionStorage.removeItem('a3_impersonate_user_id');
    
    return { success: true, user };
  },

  logout() {
    sessionStorage.removeItem('a3_current_user');
    sessionStorage.removeItem('a3_impersonate_user_id');
    location.reload();
  },

  getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('a3_current_user') || 'null');
  },

  isAdmin() {
    const user = this.getCurrentUser();
    // DEBUG: console.log('Checking admin:', user);
    return user && user.role === 'admin';
  },

  impersonate(userId) {
    if (!this.isAdmin()) return false;
    sessionStorage.setItem('a3_impersonate_user_id', userId);
    const targetUser = this.getUsers().find(u => u.id === userId);
    return targetUser;
  },

  stopImpersonating() {
    sessionStorage.removeItem('a3_impersonate_user_id');
    location.reload();
  },

  isImpersonating() {
    return !!sessionStorage.getItem('a3_impersonate_user_id');
  },

  // Inicializar admin por defecto
  initDefaultAdmin() {
    const users = this.getUsers();
    if (users.length === 0) {
      this.createUser('admin', 'admin123', 'A3 Solution', 'admin');
      console.log('Admin creado: admin / admin123');
    }
  }
};