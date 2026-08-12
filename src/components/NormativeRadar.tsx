import React, { useState } from 'react';
import { 
  Radar, 
  GitCompare, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight, 
  RefreshCw, 
  Sparkles, 
  FileText, 
  Clock 
} from 'lucide-react';

export const NormativeRadar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'radar' | 'compare'>('radar');

  // Compare diff state
  const [normA, setNormA] = useState(
    'Disposición D.N. N° 122/2014: Establece que la Cédula de Identificación del Automotor (Cédula Verde) vence al año de su expedición para terceros no titulares.'
  );
  const [normB, setNormB] = useState(
    'Disposición D.N. N° 29/2024: Deroga el vencimiento de la Cédula Verde para el titular e instruye la digitalización en Mi Argentina, eliminando la Cédula Azul.'
  );
  const [diffResult, setDiffResult] = useState<any>(null);
  const [isComparing, setIsComparing] = useState(false);

  const radarAlerts = [
    {
      id: 'rad-1',
      title: 'Eliminación de Vencimiento de Cédula Verde y Derogación de Cédula Azul',
      disposition: 'Disposición D.N. N° 29/2024',
      date: '2026-05-15',
      impact: 'ALTO',
      summary: 'Se suprime el vencimiento anual de la Cédula Verde para el titular y se descontinúa la emisión de la Cédula Azul físicas.',
      affectedProcedures: ['Duplicado de Cédula', 'Expedición de Cédulas para Autorizados', 'Transferencia de Dominio'],
    },
    {
      id: 'rad-2',
      title: 'Derogación del Certificado CETA para Transferencias Automotor (ARCA/AFIP)',
      disposition: 'Resolución General Conjunta 5500/2024 - ARCA',
      date: '2026-06-01',
      impact: 'MEDIO',
      summary: 'Derogación del Certificado de Transferencia de Automotores (CETA). El trámite CETA no constituye un requisito obligatorio vigente.',
      affectedProcedures: ['Transferencia Ordinaria', 'Transferencia por Sucesión'],
    },
    {
      id: 'rad-3',
      title: 'Simplificación de Certificación de Firmas en Registros Seccionales',
      disposition: 'Circular D.N. N° 14/2026',
      date: '2026-07-20',
      impact: 'ALTO',
      summary: 'Se unifican aranceles de certificación de firmas y se habilita la firma digital remota para la Solicitud Tipo 08D.',
      affectedProcedures: ['Transferencia 08 Digital', 'Denuncia de Venta'],
    },
  ];

  const handleRunDiff = async () => {
    setIsComparing(true);
    try {
      const response = await fetch('/api/norm-diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ normAId: normA, normBId: normB }),
      });
      if (!response.ok) throw new Error('Error en comparador');
      const data = await response.json();
      setDiffResult(data);
    } catch (err) {
      console.error('Error al comparar normas:', err);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Radar className="w-5 h-5 text-blue-400 animate-pulse" />
            <h2 className="text-lg font-bold text-white font-serif">Radar Normativo & Comparador de Disposiciones</h2>
          </div>
          <p className="text-xs text-slate-400">
            Detección temprana de modificaciones en el Digesto DNTR y análisis de impacto práctico entre normas.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('radar')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'radar' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Radar de Novedades (3)
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'compare' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Comparador de Normas
          </button>
        </div>
      </div>

      {/* RADAR TAB */}
      {activeTab === 'radar' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {radarAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-xl p-5 space-y-4 transition-all flex flex-col justify-between shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                      {alert.disposition}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      alert.impact === 'ALTO'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    }`}>
                      Impacto {alert.impact}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white">{alert.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{alert.summary}</p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 block">Trámites Afectados:</span>
                  <div className="flex flex-wrap gap-1">
                    {alert.affectedProcedures.map((proc, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                        {proc}
                      </span>
                    ))}
                  </div>

                  <div className="text-[10px] text-slate-500 text-right pt-1">
                    Publicado: {alert.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMPARE TAB */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-blue-400" /> Comparador Side-by-Side de Textos Normativos
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Norma Anterior (Base)</label>
                <textarea
                  rows={4}
                  value={normA}
                  onChange={(e) => setNormA(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Norma Nueva / Modificatoria</label>
                <textarea
                  rows={4}
                  value={normB}
                  onChange={(e) => setNormB(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleRunDiff}
                disabled={isComparing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-semibold text-xs rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                {isComparing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <GitCompare className="w-4 h-4" />}
                <span>Generar Análisis de Diferencias Normativas</span>
              </button>
            </div>
          </div>

          {/* Diff Output */}
          {diffResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md text-xs">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
                Dictamen Técnico de Cambios y Reformas
              </h3>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-blue-400">Impacto Práctico para el Gestor / Mandatario:</h4>
                <p className="text-slate-200 leading-relaxed">{diffResult.practicalImpact}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-xl space-y-1">
                  <h4 className="font-bold text-emerald-400 text-xs">Lo que se incorporó / Agregó:</h4>
                  <ul className="list-disc list-inside space-y-1 text-emerald-200 text-[11px]">
                    {diffResult.added?.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl space-y-1">
                  <h4 className="font-bold text-amber-400 text-xs">Lo que se modificó:</h4>
                  <ul className="list-disc list-inside space-y-1 text-amber-200 text-[11px]">
                    {diffResult.modified?.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-rose-950/20 border border-rose-500/30 p-3 rounded-xl space-y-1">
                  <h4 className="font-bold text-rose-400 text-xs">Lo que se derogó / Eliminó:</h4>
                  <ul className="list-disc list-inside space-y-1 text-rose-200 text-[11px]">
                    {diffResult.repealed?.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
