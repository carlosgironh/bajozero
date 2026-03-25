// ============================================
// AUTENTICACIÓN CON SUPABASE
// ============================================

import { supabase, callEdgeFunction } from './supabase-client.js';
import { CONFIG } from './config.js';

export const Auth = {
  currentUser: null,
  currentProfile: null,
  isImpersonatingFlag: false,
  originalUser: null,

  async init() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      await this.loadProfile(session.user.id);
      return true;
    }
    
    return false;
  },

  async loadProfile(userId) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error cargando perfil:', error);
      return false;
    }
    
    this.currentProfile = profile;
    this.currentUser = { id: userId, ...profile };
    return true;
  },

  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      await this.loadProfile(data.user.id);
      
      return { 
        success: true, 
        user: this.currentUser,
        isAdmin: this.isAdmin()
      };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async register(email, password, username, companyName) {
    try {
      const result = await callEdgeFunction('auth', {
        action: 'register',
        email,
        password,
        username,
        company_name: companyName
      });
      
      if (result.error) throw new Error(result.error);
      
      return await this.login(email, password);
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async logout() {
    await supabase.auth.signOut();
    this.currentUser = null;
    this.currentProfile = null;
    this.isImpersonatingFlag = false;
    this.originalUser = null;
    window.location.reload();
  },

  isAdmin() {
    return this.currentProfile?.role === CONFIG.ROLES.ADMIN;
  },

  isImpersonating() {
    return this.isImpersonatingFlag;
  },

  async impersonate(userId) {
    if (!this.isAdmin()) return { success: false, error: 'No autorizado' };
    
    try {
      const result = await callEdgeFunction('admin', {
        action: 'impersonate',
        user_id: userId
      });
      
      if (result.error) throw new Error(result.error);
      
      this.originalUser = { ...this.currentUser };
      this.isImpersonatingFlag = true;
      
      await this.loadProfile(userId);
      
      return { success: true, user: this.currentUser };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  stopImpersonating() {
    if (!this.isImpersonatingFlag || !this.originalUser) return;
    
    this.isImpersonatingFlag = false;
    this.currentUser = this.originalUser;
    this.currentProfile = this.originalUser;
    this.originalUser = null;
    
    window.location.reload();
  }
};

// Exponer globalmente
window.Auth = Auth;