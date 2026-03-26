// ============================================
// AUTENTICACIÓN CON SUPABASE
// ============================================

import { supabase, callEdgeFunction } from './supabase-client.js';
import { CONFIG } from './config.js';

console.log('[AUTH] Módulo cargado');

export const Auth = {
  currentUser: null,
  currentProfile: null,
  isImpersonatingFlag: false,
  originalUser: null,

  async init() {
    console.log('[AUTH] Inicializando...');
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[AUTH] Error al obtener sesión:', error);
        return false;
      }
      
      if (session) {
        console.log('[AUTH] Sesión encontrada:', session.user.id);
        await this.loadProfile(session.user.id);
        return true;
      }
      
      console.log('[AUTH] No hay sesión activa');
      return false;
    } catch (error) {
      console.error('[AUTH] Error en init:', error);
      return false;
    }
  },

  async loadProfile(userId) {
    console.log('[AUTH] Cargando perfil:', userId);
    
    try {
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
      console.log('[AUTH] Perfil cargado:', profile);
      return true;
    } catch (error) {
      console.error('[AUTH] Error en loadProfile:', error);
      return false;
    }
  },

  async login(email, password) {
    console.log('[AUTH] Intentando login:', email);
    
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
      console.error('[AUTH] Error en login:', error);
      return { success: false, error: error.message };
    }
  },

  async register(email, password, username, companyName) {
    console.log('[AUTH] Registrando usuario:', email);
    
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
      console.error('[AUTH] Error en registro:', error);
      return { success: false, error: error.message };
    }
  },

  async logout() {
    console.log('[AUTH] Cerrando sesión...');
    
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[AUTH] Error en logout:', error);
    }
    
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
      console.error('[AUTH] Error en impersonate:', error);
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