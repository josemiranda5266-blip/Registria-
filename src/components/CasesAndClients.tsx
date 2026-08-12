import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Users, 
  Plus, 
  Search, 
  CheckSquare, 
  Calendar, 
  DollarSign, 
  Clock, 
  FileText, 
  X, 
  UserPlus, 
  ShieldCheck, 
  Edit, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { ProcedureCase, Client, CaseStatus } from '../types';
import { ApiClient } from '../lib/api';
import { PROCEDURES_CATALOG } from '../data/proceduresCatalog';

export const CasesAndClients: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cases' | 'clients'>('cases');
  const [cases, setCases] = useState<ProcedureCase[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedCase, setSelectedCase] = useState<ProcedureCase | null>(null);

  // New Case Modal State
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseClientId, setNewCaseClientId] = useState('');
  const [newCaseDomain, setNewCaseDomain] = useState('');
  const [newCaseVehicle, setNewCaseVehicle] = useState('');
  const [newCaseProcedureId, setNewCaseProcedureId] = useState(PROCEDURES_CATALOG[0].id);

  // New Client Modal State
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientDniCuit, setNewClientDniCuit] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientType, setNewClientType] = useState<'PERSONA_HUMANA' | 'PERSONA_JURIDICA'>('PERSONA_HUMANA');

  // New Note
  const [newNoteText, setNewNoteText] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [cList, clList] = await Promise.all([
        ApiClient.getCases().catch(() => []),
        ApiClient.getClients().catch(() => []),
      ]);
      setCases(cList);
      setClients(clList);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.vehicleDomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((cl) => cl.id === newCaseClientId) || clients[0] || { id: 'cli-default', name: 'Cliente General', dniCuit: '20-00000000-0' };
    const proc = PROCEDURES_CATALOG.find((p) => p.id === newCaseProcedureId) || PROCEDURES_CATALOG[0];

    const newCase: ProcedureCase = {
      id: 'case-' + Date.now(),
      caseNumber: 'EXP-2026-' + Math.floor(1000 + Math.random() * 9000),
      title: newCaseTitle,
      clientId: client.id,
      clientName: client.name,
      clientDniCuit: client.dniCuit,
      vehicleDomain: newCaseDomain.toUpperCase(),
      vehicleBrandModel: newCaseVehicle,
      procedureId: proc.id,
      procedureTitle: proc.title,
      status: 'NUEVO',
      checklist: proc.requirements.map((req, idx) => ({
        id: 'chk-' + idx,
        title: req,
        isRequired: true,
        isCompleted: false,
      })),
      uploadedDocs: [],
      notes: [
        {
          id: 'note-1',
          author: 'Sistema REGISTRIA',
          text: 'Expediente creado e iniciado exitosamente.',
          date: new Date().toISOString().split('T')[0],
        },
      ],
      feesAmount: 120000,
      feesPaid: false,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    try {
      const saved = await ApiClient.saveCase(newCase);
      setCases((prev) => [saved, ...prev.filter((c) => c.id !== saved.id)]);
      setIsNewCaseModalOpen(false);
      setNewCaseTitle('');
      setNewCaseDomain('');
      setNewCaseVehicle('');
    } catch (err: any) {
      alert(err.message || 'Error guardando expediente.');
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const newCli: Client = {
      id: 'cli-' + Date.now(),
      name: newClientName,
      dniCuit: newClientDniCuit,
      phone: newClientPhone,
      email: newClientEmail,
      type: newClientType,
      casesCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    try {
      const saved = await ApiClient.saveClient(newCli);
      setClients((prev) => [saved, ...prev.filter((c) => c.id !== saved.id)]);
      setIsNewClientModalOpen(false);
      setNewClientName('');
      setNewClientDniCuit('');
    } catch (err: any) {
      alert(err.message || 'Error guardando cliente.');
    }
  };

  const toggleChecklistItem = async (caseId: string, chkId: string) => {
    if (!selectedCase) return;
    const updatedChecklist = selectedCase.checklist.map((item) =>
      item.id === chkId ? { ...item, isCompleted: !item.isCompleted } : item
    );
    const updatedCase = { ...selectedCase, checklist: updatedChecklist };
    setSelectedCase(updatedCase);
    try {
      const saved = await ApiClient.saveCase(updatedCase);
      setCases((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));
    } catch {
      // revert
    }
  };

  const handleAddNote = async () => {
    if (!selectedCase || !newNoteText.trim()) return;
    const newNote = {
      id: 'n-' + Date.now(),
      author: 'Mandatario Registral',
      text: newNoteText,
      date: new Date().toISOString().split('T')[0],
    };
    const updatedCase = { ...selectedCase, notes: [newNote, ...selectedCase.notes] };
    setSelectedCase(updatedCase);
    setNewNoteText('');
    try {
      const saved = await ApiClient.saveCase(updatedCase);
      setCases((prev) => prev.map((c) => (c.id === saved.id ? saved : c)));
    } catch {
      // revert
    }
  };

  const getStatusBadge = (status: CaseStatus) => {
    switch (status) {
      case 'NUEVO':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-500/40">● NUEVO</span>;
      case 'EN_PROCESO':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/40">● EN PROCESO</span>;
      case 'FINALIZADO':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">● FINALIZADO</span>;
      case 'DOC_INCOMPLETA':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/40">● DOC INCOMPLETA</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">● {status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white font-serif">Gestión de Expedientes y Clientes</h2>
          </div>
          <p className="text-xs text-slate-400">
            Mantené el control de trámites registrales, turnos, aranceles, checklists y documentación por cliente.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('cases')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'cases' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Mis Expedientes ({cases.length})
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'clients' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Directorio de Clientes ({clients.length})
          </button>
        </div>
      </div>

      {/* CASES TAB */}
      {activeTab === 'cases' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por dominio (patente), número de expediente, cliente..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2 font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL">Todos los estados</option>
                <option value="NUEVO">Nuevo</option>
                <option value="EN_PROCESO">En Proceso</option>
                <option value="DOC_INCOMPLETA">Doc Incompleta</option>
                <option value="FINALIZADO">Finalizado</option>
              </select>

              <button
                onClick={() => setIsNewCaseModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" /> Nuevo Expediente
              </button>
            </div>
          </div>

          {/* Cases Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCases.map((c) => {
              const completedChk = c.checklist.filter((i) => i.isCompleted).length;
              const totalChk = c.checklist.length;
              const progressPct = totalChk > 0 ? Math.round((completedChk / totalChk) * 100) : 0;

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-xl p-5 space-y-4 transition-all cursor-pointer hover:shadow-lg group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400">{c.caseNumber}</span>
                      <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors mt-0.5">
                        {c.title}
                      </h3>
                    </div>
                    {getStatusBadge(c.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-500 block">Dominio (Patente):</span>
                      <span className="font-mono font-bold text-blue-400 text-sm">{c.vehicleDomain}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Cliente:</span>
                      <span className="font-semibold text-slate-200">{c.clientName}</span>
                    </div>
                  </div>

                  {/* Checklist Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                      <span>Checklist Requisitos ({completedChk}/{totalChk})</span>
                      <span className="text-blue-400">{progressPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progressPct}%` }}></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                    <span>Turno: <strong className="text-slate-200">{c.turnsDate || 'Sin turno'}</strong></span>
                    <span>Honorarios: <strong className={c.feesPaid ? 'text-emerald-400' : 'text-amber-400'}>${c.feesAmount.toLocaleString('es-AR')} ({c.feesPaid ? 'Pagado' : 'Pendiente'})</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CLIENTS TAB */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3 text-xs">
            <h3 className="font-bold text-white">Directorio de Clientes Registrados</h3>
            <button
              onClick={() => setIsNewClientModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <UserPlus className="w-4 h-4" /> Agregar Cliente
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((cli) => (
              <div key={cli.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-white text-sm">{cli.name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700">
                    {cli.type === 'PERSONA_HUMANA' ? 'Persona Humana' : 'Persona Jurídica'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <p><strong>DNI/CUIT:</strong> {cli.dniCuit}</p>
                  <p><strong>Teléfono:</strong> {cli.phone || 'No registrado'}</p>
                  <p><strong>Email:</strong> {cli.email || 'No registrado'}</p>
                  <p><strong>Dirección:</strong> {cli.address || 'No registrada'}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Expedientes: <strong className="text-blue-400">{cli.casesCount}</strong></span>
                  <span className="flex items-center gap-1 text-emerald-400 text-[10px]">
                    <ShieldCheck className="w-3 h-3" /> Privacidad Protegida (Ley 25.326)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Case Detail Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950">
              <div>
                <span className="text-xs font-mono font-bold text-blue-400">{selectedCase.caseNumber}</span>
                <h2 className="text-lg font-bold text-white font-serif">{selectedCase.title}</h2>
                <p className="text-xs text-slate-400">Dominio: {selectedCase.vehicleDomain} | Cliente: {selectedCase.clientName}</p>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
              {/* Checklist */}
              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-blue-400" /> Checklist de Requisitos:
                </h4>
                <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  {selectedCase.checklist.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklistItem(selectedCase.id, item.id)}
                      className="flex items-center gap-3 p-2 rounded hover:bg-slate-900 cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={item.isCompleted}
                        onChange={() => {}}
                        className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                      />
                      <span className={`text-xs ${item.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {item.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-sm">Historial de Observaciones & Notas:</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Agregar nota interna para este caso..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none"
                  />
                  <button
                    onClick={handleAddNote}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg cursor-pointer"
                  >
                    Agregar
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedCase.notes.map((n) => (
                    <div key={n.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                        <span>{n.author}</span>
                        <span>{n.date}</span>
                      </div>
                      <p className="text-slate-200">{n.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Case Modal */}
      {isNewCaseModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Crear Nuevo Expediente Registral</h3>
              <button onClick={() => setIsNewCaseModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Título / Asunto del Caso *</label>
                <input
                  type="text"
                  required
                  value={newCaseTitle}
                  onChange={(e) => setNewCaseTitle(e.target.value)}
                  placeholder="Ej: Transferencia Ordinaria Toyota Hilux"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Cliente Asociado *</label>
                <select
                  value={newCaseClientId}
                  onChange={(e) => setNewCaseClientId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clients.map((cl) => (
                    <option key={cl.id} value={cl.id}>{cl.name} ({cl.dniCuit})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Dominio / Patente *</label>
                  <input
                    type="text"
                    required
                    value={newCaseDomain}
                    onChange={(e) => setNewCaseDomain(e.target.value)}
                    placeholder="AF123JK"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Vehículo (Marca/Modelo)</label>
                  <input
                    type="text"
                    value={newCaseVehicle}
                    onChange={(e) => setNewCaseVehicle(e.target.value)}
                    placeholder="Fiat Cronos 2022"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Trámite Asociado</label>
                <select
                  value={newCaseProcedureId}
                  onChange={(e) => setNewCaseProcedureId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none"
                >
                  {PROCEDURES_CATALOG.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewCaseModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg"
                >
                  Crear Expediente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Client Modal */}
      {isNewClientModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Registrar Nuevo Cliente</h3>
              <button onClick={() => setIsNewClientModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Nombre y Apellido / Razón Social *</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Ej: Juan Manuel Pérez"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">DNI / CUIT *</label>
                <input
                  type="text"
                  required
                  value={newClientDniCuit}
                  onChange={(e) => setNewClientDniCuit(e.target.value)}
                  placeholder="20-30123456-7"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Tipo de Cliente</label>
                <select
                  value={newClientType}
                  onChange={(e) => setNewClientType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none"
                >
                  <option value="PERSONA_HUMANA">Persona Humana</option>
                  <option value="PERSONA_JURIDICA">Persona Jurídica (Empresa/Sociedad)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
