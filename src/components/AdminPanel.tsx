import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, CheckCircle2, AlertTriangle, Play, RefreshCw, Users, Database, FileText, UserPlus, Shield, Lock } from 'lucide-react';
import { User, UserRole, AuditLogEntry } from '../types';
import { ApiClient } from '../lib/api';

interface AdminPanelProps {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  currentUser: User | null;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ userRole, setUserRole, currentUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<'audit' | 'users' | 'logs'>('audit');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  // System Counts State
  const [normsCount, setNormsCount] = useState<number>(0);
  const [casesCount, setCasesCount] = useState<number>(0);
  const [clientsCount, setClientsCount] = useState<number>(0);

  // Users Management State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('MANDATARIO');
  const [newPassword, setNewPassword] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchLogs();
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      const [n, c, cl] = await Promise.all([
        ApiClient.getNorms().catch(() => []),
        ApiClient.getCases().catch(() => []),
        ApiClient.getClients().catch(() => []),
      ]);
      setNormsCount(n.length);
      setCasesCount(c.length);
      setClientsCount(cl.length);
    } catch {
      // ignore
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setUsersError(null);
    try {
      const users = await ApiClient.getUsers();
      setUsersList(users);
    } catch (err: any) {
      setUsersError(err.message || 'No fue posible cargar la lista de usuarios. Inicie sesión como ADMIN.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const logs = await ApiClient.getAuditLogs();
      setAuditLogs(logs);
    } catch {
      // ignore
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newEmail || !newName || !newPassword) return;

    setCreatingUser(true);
    try {
      await ApiClient.createUser({
        username: newUsername,
        email: newEmail,
        name: newName,
        role: newRole,
        password: newPassword,
      });
      setNewUsername('');
      setNewEmail('');
      setNewName('');
      setNewPassword('');
      fetchUsers();
      fetchLogs();
    } catch (err: any) {
      alert(err.message || 'Error al crear usuario.');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleRoleChange = async (userId: string, targetRole: UserRole) => {
    try {
      await ApiClient.updateUserRole(userId, targetRole);
      fetchUsers();
      fetchLogs();
    } catch (err: any) {
      alert(err.message || 'Error al cambiar rol.');
    }
  };

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const res: any = await (ApiClient as any).request('/api/admin/system-audit');
      setAuditResult({
        timestamp: new Date().toLocaleString('es-AR'),
        status: 'PASA_CONTROLES',
        checks: res.auditResults.map((r: any) => ({
          name: `${r.category}: ${r.title}`,
          result: r.detail,
          status: r.status,
        })),
      });
    } catch (err: any) {
      setAuditResult({
        timestamp: new Date().toLocaleString('es-AR'),
        status: 'ERROR',
        checks: [
          { name: 'Diagnóstico Server-Side', result: err.message || 'Error en auditoría', status: 'FAIL' },
        ],
      });
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white font-serif">Administración, Usuarios & Auditoría Server-Side</h2>
          </div>
          <p className="text-xs text-slate-400">
            Panel de control para la gestión de permisos por rol (ADMIN, MANDATARIO, ASISTENTE, CONSULTA), registros de auditoría e integridad del sistema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              activeSubTab === 'audit' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Diagnóstico
          </button>
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              activeSubTab === 'users' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Gestión de Usuarios
          </button>
          <button
            onClick={() => setActiveSubTab('logs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              activeSubTab === 'logs' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Logs de Auditoría
          </button>
        </div>
      </div>

      {activeSubTab === 'audit' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-semibold text-xs rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              {isAuditing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>Ejecutar Auditoría Diagnóstica Real</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* System Stats */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md text-xs">
              <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" /> Estado de la Biblioteca & Base de Datos
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-400">Normas Indexadas:</span>
                  <span className="font-mono font-bold text-white">{normsCount}</span>
                </div>

                <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-400">Expedientes en Gestión:</span>
                  <span className="font-mono font-bold text-blue-400">{casesCount}</span>
                </div>

                <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-400">Clientes Registrados:</span>
                  <span className="font-mono font-bold text-purple-400">{clientsCount}</span>
                </div>
              </div>
            </div>

            {/* Audit Results Panel */}
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md text-xs">
              <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2 flex items-center justify-between">
                <span>Diagnóstico de Auditoría Automática en Servidor</span>
                {auditResult && (
                  <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 bg-emerald-950 border border-emerald-800 rounded">
                    ✓ {auditResult.status}
                  </span>
                )}
              </h3>

              {!auditResult ? (
                <p className="text-slate-500 py-8 text-center italic">
                  Hacé clic en "Ejecutar Auditoría Diagnóstica Real" para evaluar la integridad del RAG, reglas de seguridad y persistencia server-side.
                </p>
              ) : (
                <div className="space-y-2">
                  {auditResult.checks.map((chk: any, idx: number) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-200">{chk.name}</p>
                        <p className="text-[11px] text-slate-400">{chk.result}</p>
                      </div>
                      <span className={`font-bold flex items-center gap-1 text-[11px] ${chk.status === 'PASS' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {chk.status === 'PASS' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />} {chk.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'users' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Create User Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md">
            <h3 className="font-bold text-white text-sm border-b border-slate-800 pb-2 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-400" /> Registrar Nuevo Usuario
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nombre de Usuario</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="ej. gestor.perez"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="ej. Juan Pérez"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="juan@registria.gob.ar"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Rol Asignado</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                >
                  <option value="MANDATARIO">MANDATARIO (Gestión completa)</option>
                  <option value="ADMIN">ADMIN (Control total)</option>
                  <option value="ASISTENTE">ASISTENTE (Carga y edición)</option>
                  <option value="CONSULTA">CONSULTA (Solo lectura)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={creatingUser}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded cursor-pointer transition-all shadow-md"
              >
                {creatingUser ? 'Creando...' : 'Crear Usuario'}
              </button>
            </form>
          </div>

          {/* Users List */}
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" /> Usuarios Verificados en Servidor
              </h3>
              <button
                onClick={fetchUsers}
                className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Actualizar
              </button>
            </div>

            {usersError ? (
              <div className="p-4 bg-red-950/80 border border-red-800 rounded text-red-300">
                {usersError}
              </div>
            ) : loadingUsers ? (
              <p className="text-slate-500 py-4">Cargando usuarios del servidor...</p>
            ) : (
              <div className="space-y-2">
                {usersList.map((usr) => (
                  <div
                    key={usr.id}
                    className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-bold text-white">{usr.name} <span className="text-slate-400 font-normal">(@{usr.username})</span></p>
                      <p className="text-[11px] text-slate-400">{usr.email}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {usr.role}
                      </span>

                      {currentUser?.role === 'ADMIN' && usr.username !== 'admin' && (
                        <select
                          value={usr.role}
                          onChange={(e) => handleRoleChange(usr.id, e.target.value as UserRole)}
                          className="bg-slate-900 border border-slate-700 text-slate-200 rounded text-[11px] px-2 py-1 cursor-pointer"
                        >
                          <option value="MANDATARIO">MANDATARIO</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="ASISTENTE">ASISTENTE</option>
                          <option value="CONSULTA">CONSULTA</option>
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" /> Registro de Auditoría Server-Side
            </h3>
            <button
              onClick={fetchLogs}
              className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Recargar Logs
            </button>
          </div>

          {loadingLogs ? (
            <p className="text-slate-500 py-4">Cargando eventos de auditoría...</p>
          ) : auditLogs.length === 0 ? (
            <p className="text-slate-500 py-4 italic">No hay registros de auditoría almacenados.</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div key={log.id} className="bg-slate-950 border border-slate-800 p-3 rounded-lg space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-blue-400">[{log.action}]</span>
                    <span className="text-slate-500">{new Date(log.timestamp).toLocaleString('es-AR')}</span>
                  </div>
                  <p className="text-slate-200">{log.details}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <span>Usuario: {log.username || 'Anónimo'} ({log.userRole || 'S/D'})</span>
                    <span>Entidad: {log.entity}</span>
                    {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
