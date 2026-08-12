/**
 * REGISTRIA - Client Preferences Adapter
 * Mantiene únicamente preferencias visuales no sensibles (tema, modo de interfaz).
 * La FUENTE DE VERDAD para clientes, expedientes, documentos, roles y usuarios
 * es exclusivamente el Backend API (ApiClient).
 */

const THEME_KEY = 'registria_ui_theme';
const VIEW_MODE_KEY = 'registria_ui_view_mode';

export const VisualPreferences = {
  getTheme(): 'light' | 'dark' {
    return (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'light';
  },
  setTheme(theme: 'light' | 'dark') {
    localStorage.setItem(THEME_KEY, theme);
  },
  getViewMode(): 'profesional' | 'simple' {
    return (localStorage.getItem(VIEW_MODE_KEY) as 'profesional' | 'simple') || 'profesional';
  },
  setViewMode(mode: 'profesional' | 'simple') {
    localStorage.setItem(VIEW_MODE_KEY, mode);
  },
};
