import React, { useState } from 'react';
import { Lock, UserCheck, ShieldAlert, LogIn, Key, CheckCircle2 } from 'lucide-react';
import { User, UserRole } from '../types';
import { ApiClient } from '../lib/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLoginSuccess: (user: User) => void;
  onLogout: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await ApiClient.login(username, password);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoUser: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await ApiClient.login(demoUser, 'Registria2026!');
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al autenticar sesión de demostración.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-xs text-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white text-base cursor-pointer"
        >
          ✕
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-serif">Autenticación de Usuario Registria</h2>
            <p className="text-slate-400">Sesión segura verificada en servidor backend</p>
          </div>
        </div>

        {currentUser ? (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <p className="text-sm font-bold text-white">{currentUser.name}</p>
                <p className="text-slate-400">@{currentUser.username} | {currentUser.email}</p>
              </div>
              <span className="px-2.5 py-1 rounded bg-blue-950 text-blue-400 border border-blue-800 font-bold font-mono">
                {currentUser.role}
              </span>
            </div>

            <p className="text-slate-400 leading-relaxed">
              Estás autenticado en el servidor con permisos activos para {currentUser.role}.
            </p>

            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all cursor-pointer shadow-md"
            >
              Cerrar Sesión Activa
            </button>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="bg-red-950/80 border border-red-800 p-3 rounded-lg text-red-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre de Usuario</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ej. admin, mandatario, asistente, consulta"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Verificando...' : 'Iniciar Sesión'}</span>
              </button>
            </form>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Acceso Rápido por Rol (Demostración):
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleQuickDemoLogin('admin')}
                  className="p-2 bg-slate-950 border border-slate-800 hover:border-blue-500 rounded-lg text-left transition-all"
                >
                  <p className="font-bold text-white">ADMIN</p>
                  <p className="text-[10px] text-slate-400">Administrador General</p>
                </button>

                <button
                  onClick={() => handleQuickDemoLogin('mandatario')}
                  className="p-2 bg-slate-950 border border-slate-800 hover:border-blue-500 rounded-lg text-left transition-all"
                >
                  <p className="font-bold text-white">MANDATARIO</p>
                  <p className="text-[10px] text-slate-400">Gestor Matriculado</p>
                </button>

                <button
                  onClick={() => handleQuickDemoLogin('asistente')}
                  className="p-2 bg-slate-950 border border-slate-800 hover:border-blue-500 rounded-lg text-left transition-all"
                >
                  <p className="font-bold text-white">ASISTENTE</p>
                  <p className="text-[10px] text-slate-400">Soporte Operativo</p>
                </button>

                <button
                  onClick={() => handleQuickDemoLogin('consulta')}
                  className="p-2 bg-slate-950 border border-slate-800 hover:border-blue-500 rounded-lg text-left transition-all"
                >
                  <p className="font-bold text-white">CONSULTA</p>
                  <p className="text-[10px] text-slate-400">Modo Solo Lectura</p>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
