// ============================================
// SETTINGS MODULE
// ============================================

const settingsModule = {
  init() {
    const s = DB.getAll('settings')[0] || {};
    document.getElementById('settingCompanyName').value = s.company_name || '';
    document.getElementById('settingCompanyRUC').value = s.company_ruc || '';
    document.getElementById('settingCompanyAddress').value = s.company_address || '';
    document.getElementById('settingPrefixQuotes').value = s.prefix_quotes || 'COT-';
    document.getElementById('settingPrefixInvoices').value = s.prefix_invoices || 'FAC-';
    document.getElementById('settingTaxRate').value = s.tax_rate || 7;
  },

  save() {
    DB.save('settings', {
      id: '1',
      company_name: document.getElementById('settingCompanyName')?.value || '',
      company_ruc: document.getElementById('settingCompanyRUC')?.value || '',
      company_address: document.getElementById('settingCompanyAddress')?.value || '',
      prefix_quotes: document.getElementById('settingPrefixQuotes')?.value || 'COT-',
      prefix_invoices: document.getElementById('settingPrefixInvoices')?.value || 'FAC-',
      tax_rate: parseFloat(document.getElementById('settingTaxRate')?.value || 7),
      currency: 'B/.'
    });
    
    // Actualizar nombre en header
    const user = Auth.getCurrentUser();
    if (user) {
      document.getElementById('headerCompanyName').textContent = 
        document.getElementById('settingCompanyName')?.value || user.company_name;
    }
    
    UI.showToast('Configuración guardada');
  }
};