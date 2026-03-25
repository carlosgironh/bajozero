// ============================================
// DATABASE - Sistema Multi-Tenant
// ============================================

const DB = {
  getCurrentUserId() {
    const impersonating = sessionStorage.getItem('a3_impersonate_user_id');
    const current = JSON.parse(sessionStorage.getItem('a3_current_user') || '{}');
    return impersonating || current.id;
  },

  getPrefix() {
    const userId = this.getCurrentUserId();
    return userId ? `a3_user_${userId}_` : 'a3_temp_';
  },

  getAll(store) {
    const key = this.getPrefix() + store;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },

  getById(store, id) {
    return this.getAll(store).find(i => i.id === id);
  },

  save(store, item) {
    const items = this.getAll(store);
    const idx = items.findIndex(i => i.id === item.id);
    const now = new Date().toISOString();
    
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...item, updated_at: now };
    } else {
      item.id = item.id || crypto.randomUUID();
      item.created_at = now;
      items.push(item);
    }
    
    localStorage.setItem(this.getPrefix() + store, JSON.stringify(items));
    return item;
  },

  delete(store, id) {
    const items = this.getAll(store).filter(i => i.id !== id);
    localStorage.setItem(this.getPrefix() + store, JSON.stringify(items));
  },

  getNextNumber(type) {
    const key = this.getPrefix() + 'sequence_' + type;
    let current = parseInt(localStorage.getItem(key)) || 1000;
    current++;
    localStorage.setItem(key, current);
    
    const settings = this.getAll('settings')[0] || {};
    const prefix = type === 'quote' ? (settings.prefix_quotes || 'COT-') : (settings.prefix_invoices || 'FAC-');
    return prefix + String(current).padStart(6, '0');
  },

  exportUserData(userId) {
    const prefix = `a3_user_${userId}_`;
    const data = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        data[key.replace(prefix, '')] = localStorage.getItem(key);
      }
    }
    
    return data;
  },

  importUserData(userId, data) {
    const prefix = `a3_user_${userId}_`;
    Object.entries(data).forEach(([key, value]) => {
      localStorage.setItem(prefix + key, value);
    });
  },

  clearUserData(userId) {
    const prefix = `a3_user_${userId}_`;
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) keys.push(key);
    }
    keys.forEach(k => localStorage.removeItem(k));
  }
};