import React from 'react';
import { 
  FileText, 
  Bot, 
  Car, 
  Camera, 
  Briefcase, 
  Radar, 
  Calculator, 
  ExternalLink, 
  ShieldCheck, 
  Lock, 
  Sparkles,
  Users,
  Settings
} from 'lucide-react';
import { UserRole } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  officialOnly: boolean;
  setOfficialOnly: (v: boolean) => void;
  mode: 'profesional' | 'simple';
  setMode: (m: 'profesional' | 'simple') => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  casesCount: number;
  normsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  officialOnly,
  setOfficialOnly,
  mode,
  setMode,
  userRole,
  setUserRole,
  casesCount,
  normsCount,
}) => {
  const navItems = [
    { id: 'chat', label: 'Consultar IA', icon: Bot },
    { id: 'library', label: 'Biblioteca Normativa', icon: FileText, badge: normsCount },
    { id: 'wizard', label: 'Trámites & Wizard', icon: Car },
    { id: 'analyzer', label: 'Analizar & Verificador', icon: Camera },
    { id: 'cases', label: 'Expedientes & Clientes', icon: Briefcase, badge: casesCount },
    { id: 'radar', label: 'Radar & Comparador', icon: Radar },
    { id: 'calculator', label: 'Calculadora', icon: Calculator },
    { id: 'portals', label: 'Portales Oficiales', icon: ExternalLink },
    { id: 'admin', label: 'Administración', icon: Settings },
  ];

  return (
    <header className="bg-[#111111] border-b border-slate-800 text-white sticky top-0 z-40 shadow-xl">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-serif">REGISTRIA</h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Automotor AR
              </span>
            </div>
            <p className="text-xs text-slate-400">Inteligencia registral para el automotor argentino</p>
          </div>
        </div>

        {/* Controls & Mode Switches */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Solo Fuentes Oficiales Lock Toggle */}
          <button
            onClick={() => setOfficialOnly(!officialOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-all ${
              officialOnly
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-900/50'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Activar para forzar respuestas estrictamente de fuentes oficiales"
          >
            <Lock className={`w-3.5 h-3.5 ${officialOnly ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>Solo Fuentes Oficiales</span>
            {officialOnly && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>}
          </button>

          {/* Mode Switch (Profesional vs Simple) */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setMode('profesional')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                mode === 'profesional' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Modo Profesional
            </button>
            <button
              onClick={() => setMode('simple')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                mode === 'simple' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Modo Simple
            </button>
          </div>

          {/* Role Selector */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">Rol:</span>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as UserRole)}
              className="bg-transparent font-medium text-white focus:outline-none cursor-pointer"
            >
              <option value="MANDATARIO" className="bg-slate-900">Mandatario / Gestor</option>
              <option value="ADMIN" className="bg-slate-900">Administrador</option>
              <option value="ASISTENTE" className="bg-slate-900">Asistente</option>
              <option value="LECTOR" className="bg-slate-900">Lector</option>
              <option value="CLIENTE" className="bg-slate-900">Cliente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 border-t border-slate-800/80 overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-1 py-1 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
