import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Tag, 
  Upload, 
  X, 
  BookOpen, 
  Layers,
  ShieldCheck,
  Hash
} from 'lucide-react';
import { NormDocument, NormativeStatus, DocumentType, VehicleType } from '../types';
import { ApiClient } from '../lib/api';

export const NormativeLibrary: React.FC = () => {
  const [norms, setNorms] = useState<NormDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDoc, setSelectedDoc] = useState<NormDocument | null>(null);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);

  // Ingestion form state
  const [ingestTitle, setIngestTitle] = useState('');
  const [ingestType, setIngestType] = useState<DocumentType>('DISPOSICION');
  const [ingestAuthority, setIngestAuthority] = useState<'DNRPA' | 'BOLETIN_OFICIAL' | 'INFOLEG'>('DNRPA');
  const [ingestNumber, setIngestNumber] = useState('');
  const [ingestContent, setIngestContent] = useState('');
  const [ingestUrl, setIngestUrl] = useState('');
  const [ingestTopics, setIngestTopics] = useState('Transferencia, Requisitos');

  const loadNorms = async () => {
    setLoading(true);
    try {
      const list = await ApiClient.getNorms();
      setNorms(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNorms();
  }, []);

  const filteredNorms = norms.filter((norm) => {
    const matchesSearch =
      norm.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      norm.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      norm.topics.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === 'ALL' || norm.documentType === selectedType;
    const matchesStatus = selectedStatus === 'ALL' || norm.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestTitle || !ingestContent) return;

    const newNorm: NormDocument = {
      documentId: 'norm-' + Date.now(),
      title: ingestTitle,
      documentType: ingestType,
      issuingAuthority: ingestAuthority,
      number: ingestNumber || 'S/N',
      year: new Date().getFullYear(),
      publicationDate: new Date().toISOString().split('T')[0],
      effectiveDate: new Date().toISOString().split('T')[0],
      status: 'VIGENTE',
      topics: ingestTopics.split(',').map((t) => t.trim()).filter(Boolean),
      subtopics: ['Ingesta de usuario'],
      vehicleTypes: ['AUTOMOVIL', 'MOTOVEHICULO'],
      sourceUrl: ingestUrl || undefined,
      officialSource: true,
      content: ingestContent,
      contentHash: 'hash-' + Math.random().toString(36).substring(7),
      uploadedAt: new Date().toISOString(),
      version: '1.0',
      summary: ingestContent.slice(0, 150) + '...',
    };

    try {
      const saved = await ApiClient.saveNorm(newNorm);
      setNorms((prev) => [saved, ...prev.filter((n) => n.documentId !== saved.documentId)]);
      setIsIngestModalOpen(false);
      setIngestTitle('');
      setIngestContent('');
      setIngestNumber('');
    } catch (err: any) {
      alert(err.message || 'Error guardando norma.');
    }
  };

  const getStatusBadge = (status: NormativeStatus) => {
    switch (status) {
      case 'VIGENTE':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">● VIGENTE</span>;
      case 'DEROGADA':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/30 flex items-center gap-1">● DEROGADA</span>;
      case 'SUSTITUIDA':
      case 'MODIFICADA':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/30 flex items-center gap-1">● MODIFICADA</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">● {status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner & Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white font-serif">Biblioteca Normativa Registral</h2>
          </div>
          <p className="text-xs text-slate-400">
            Repositorio oficial de disposiciones DNRPA, Decreto-Ley 6582/58, Digesto DNTR y normativas consolidadas.
          </p>
        </div>

        <button
          onClick={() => setIsIngestModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4" /> Cargar / Ingestar Norma
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search Field */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, número, tema o palabra clave..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Tipo:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">Todos los tipos</option>
              <option value="DIGESTO_DNTR" className="bg-slate-900">Digesto DNTR</option>
              <option value="DECRETO_LEY" className="bg-slate-900">Decreto-Ley</option>
              <option value="DISPOSICION" className="bg-slate-900">Disposición</option>
              <option value="CIRCULAR" className="bg-slate-900">Circular</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">Estado:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">Todos los estados</option>
              <option value="VIGENTE" className="bg-slate-900">Vigentes</option>
              <option value="MODIFICADA" className="bg-slate-900">Modificadas</option>
              <option value="DEROGADA" className="bg-slate-900">Derogadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Normative List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNorms.map((norm) => (
          <div
            key={norm.documentId}
            onClick={() => setSelectedDoc(norm)}
            className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-xl p-5 space-y-3 transition-all cursor-pointer hover:shadow-lg group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/50">
                  {norm.documentType}
                </span>
                {getStatusBadge(norm.status)}
              </div>

              <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                {norm.title}
              </h3>

              <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                {norm.summary || norm.content.slice(0, 160) + '...'}
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-800/80">
              {/* Topics */}
              <div className="flex flex-wrap gap-1">
                {norm.topics.map((tp, idx) => (
                  <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    #{tp}
                  </span>
                ))}
              </div>

              {/* Footer Meta */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Org: <strong className="text-slate-300">{norm.issuingAuthority}</strong></span>
                <span>Año: {norm.year}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Document Detail Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    {selectedDoc.documentType}
                  </span>
                  {getStatusBadge(selectedDoc.status)}
                  {selectedDoc.officialSource && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 font-semibold">
                      <ShieldCheck className="w-3 h-3" /> Fuente Oficial
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white font-serif">{selectedDoc.title}</h2>
                <p className="text-xs text-slate-400">
                  Emisión: {selectedDoc.issuingAuthority} | Número: {selectedDoc.number} | Publicación: {selectedDoc.publicationDate}
                </p>
              </div>

              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300 font-sans leading-relaxed">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-blue-400" /> Resumen Normativo
                </h4>
                <p className="text-slate-300">{selectedDoc.summary || 'Sin resumen disponible.'}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-white text-sm border-b border-slate-800 pb-1">
                  Texto Completo de la Norma:
                </h4>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-[11px] whitespace-pre-wrap text-slate-300 leading-relaxed max-h-80 overflow-y-auto">
                  {selectedDoc.content}
                </div>
              </div>

              {/* Topics & Source */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
                <div className="flex items-center gap-1 flex-wrap">
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  {selectedDoc.topics.map((t, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[11px]">
                      {t}
                    </span>
                  ))}
                </div>

                {selectedDoc.sourceUrl && (
                  <a
                    href={selectedDoc.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5 transition-all"
                  >
                    Abrir en Fuente Oficial <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ingestion Upload Modal */}
      {isIngestModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" /> Ingesta Inteligente de Norma
              </h3>
              <button
                onClick={() => setIsIngestModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIngest} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Título de la Norma *</label>
                <input
                  type="text"
                  required
                  value={ingestTitle}
                  onChange={(e) => setIngestTitle(e.target.value)}
                  placeholder="Ej: Disposición D.N. N° 45/2026 - Actualización de Aranceles"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Tipo de Documento</label>
                  <select
                    value={ingestType}
                    onChange={(e) => setIngestType(e.target.value as DocumentType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="DISPOSICION">Disposición</option>
                    <option value="DIGESTO_DNTR">Digesto DNTR</option>
                    <option value="DECRETO_LEY">Decreto-Ley</option>
                    <option value="CIRCULAR">Circular</option>
                    <option value="RESOLUCION">Resolución</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Organismo Emisor</label>
                  <select
                    value={ingestAuthority}
                    onChange={(e) => setIngestAuthority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="DNRPA">DNRPA</option>
                    <option value="BOLETIN_OFICIAL">Boletín Oficial</option>
                    <option value="INFOLEG">InfoLEG</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Número / Identificador</label>
                <input
                  type="text"
                  value={ingestNumber}
                  onChange={(e) => setIngestNumber(e.target.value)}
                  placeholder="Ej: Disp. D.N. 45/2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Temas / Etiquetas (separadas por coma)</label>
                <input
                  type="text"
                  value={ingestTopics}
                  onChange={(e) => setIngestTopics(e.target.value)}
                  placeholder="Transferencia, Aranceles, Cédulas"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Contenido de la Norma (Texto o Extracto) *</label>
                <textarea
                  required
                  rows={5}
                  value={ingestContent}
                  onChange={(e) => setIngestContent(e.target.value)}
                  placeholder="Pegá el texto oficial de la disposición o artículo..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsIngestModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Indexar en Biblioteca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
