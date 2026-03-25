// ============================================
// SETTINGS MODULE
// ============================================

import { supabase } from './supabase-client.js';
import { Auth } from './auth.js';
import { UI } from './ui.js';

export const settingsModule = {
  settings: null,

  async load() {
    await this.loadSettings();
  },

  async loadSettings() {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', Auth.currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      this.settings = data;
      this.renderForm();
    } catch (error) {
      UI.showToast('Error cargando configuración: ' + error.message, 'error');
    }
  },

  renderForm() {
    const s = this.settings || {};
    
    const fields = {
      'settingCompanyName': s.company_name || '',
      'settingCompanyRUC': s.company_ruc || '',
      'settingCompanyAddress': s.company_address || '',
      'settingCompanyPhone': s.company_phone || '',
      'settingCompanyEmail': s.company_email || '',
      'settingPrefixQuotes': s.prefix_quotes || 'COT-',
      'settingPrefixInvoices': s.prefix_invoices || 'FAC-',
      'settingTaxRate': s.tax_rate || 7
    };

    Object.entries(fields).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.value = value;
    });

    const headerCompany = document.getElementById('headerCompanyName');
    if (headerCompany) {
      headerCompany.textContent = s.company_name || Auth.currentUser?.company_name || 'Empresa';
    }
  },

  async save() {
    try {
      const data = {
        user_id: Auth.currentUser.id,
        company_name: document.getElementById('settingCompanyName')?.value || '',
        company_ruc: document.getElementById('settingCompanyRUC')?.value || '',
        company_address: document.getElementById('settingCompanyAddress')?.value || '',
        company_phone: document.getElementById('settingCompanyPhone')?.value || '',
        company_email: document.getElementById('settingCompanyEmail')?.value || '',
        prefix_quotes: document.getElementById('settingPrefixQuotes')?.value || 'COT-',
        prefix_invoices: document.getElementById('settingPrefixInvoices')?.value || 'FAC-',
        tax_rate: parseFloat(document.getElementById('settingTaxRate')?.value || 7)
      };

      const { error } = await supabase
        .from('settings')
        .upsert(data, { onConflict: 'user_id' });

      if (error) throw error;

      UI.showToast('Configuración guardada');
      await this.loadSettings();
    } catch (error) {
      UI.showToast('Error: ' + error.message, 'error');
    }
  }
};

window.settingsModule = settingsModule;