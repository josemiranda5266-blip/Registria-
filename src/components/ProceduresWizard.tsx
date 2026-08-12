import React, { useState } from 'react';
import { 
  Car, 
  HelpCircle, 
  CheckSquare, 
  ArrowRight, 
  RotateCcw, 
  FileText, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Download, 
  ExternalLink,
  Search
} from 'lucide-react';
import { PROCEDURES_CATALOG, WIZARD_DECISION_TREE, WizardQuestion } from '../data/proceduresCatalog';
import { Procedure } from '../types';
import jsPDF from 'jspdf';

export const ProceduresWizard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'wizard' | 'catalog'>('wizard');
  const [currentQuestionId, setCurrentQuestionId] = useState<string>('q1');
  const [answersHistory, setAnswersHistory] = useState<Array<{ question: string; answerLabel: string }>>([]);
  const [recommendedProcedure, setRecommendedProcedure] = useState<Procedure | null>(null);
  const [selectedCatalogProcedure, setSelectedCatalogProcedure] = useState<Procedure | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');

  const currentQuestion: WizardQuestion | undefined = WIZARD_DECISION_TREE[currentQuestionId];

  const handleSelectOption = (opt: { label: string; nextQuestionId?: string; recommendedProcedureId?: string }) => {
    setAnswersHistory((prev) => [...prev, { question: currentQuestion?.text || '', answerLabel: opt.label }]);

    if (opt.recommendedProcedureId) {
      const proc = PROCEDURES_CATALOG.find((p) => p.id === opt.recommendedProcedureId);
      setRecommendedProcedure(proc || PROCEDURES_CATALOG[0]);
    } else if (opt.nextQuestionId) {
      setCurrentQuestionId(opt.nextQuestionId);
    }
  };

  const handleResetWizard = () => {
    setCurrentQuestionId('q1');
    setAnswersHistory([]);
    setRecommendedProcedure(null);
  };

  const exportChecklistPDF = (proc: Procedure) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(11, 25, 44);
    doc.text(`REGISTRIA - Checklist de Trámite: ${proc.title}`, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Categoría: ${proc.category} | Tiempo estimado: ${proc.estimatedDays}`, 14, 28);
    doc.text('________________________________________________________________________________', 14, 32);

    let yPos = 42;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Requisitos y Documentación Obligatoria:', 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    proc.requirements.forEach((req) => {
      doc.text(`[  ] ${req}`, 16, yPos);
      yPos += 7;
    });

    yPos += 4;
    doc.setFontSize(12);
    doc.text('Formularios Requeridos:', 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    proc.formsRequired.forEach((f) => {
      doc.text(`• ${f}`, 16, yPos);
      yPos += 6;
    });

    yPos += 6;
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text('Generado con REGISTRIA. Las disposiciones pueden requerir verificación en el Registro Seccional.', 14, 280);

    doc.save(`Checklist_${proc.title.replace(/\s+/g, '_')}.pdf`);
  };

  const filteredCatalog = PROCEDURES_CATALOG.filter((p) =>
    p.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    p.description.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white font-serif">Motor de Trámites y Asistente Wizard</h2>
          </div>
          <p className="text-xs text-slate-400">
            Descubrí el trámite adecuado para cada caso mediante preguntas guiadas o explorá el catálogo completo.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('wizard')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'wizard' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Asistente "¿Qué Trámite Necesito?"
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'catalog' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Catálogo Completo de Trámites
          </button>
        </div>
      </div>

      {/* WIZARD TAB */}
      {activeTab === 'wizard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Decision Tree Active Question */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-md flex flex-col justify-between">
            {!recommendedProcedure ? (
              <div className="space-y-6">
                {/* Progress bar */}
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
                  <span className="font-semibold text-blue-400 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4" /> Diagnóstico de Casos Registrales
                  </span>
                  <span>Paso {answersHistory.length + 1}</span>
                </div>

                {/* Question */}
                {currentQuestion && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white font-serif">{currentQuestion.text}</h3>
                    <div className="space-y-2.5">
                      {currentQuestion.options.map((opt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectOption(opt)}
                          className="w-full text-left p-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 text-slate-200 hover:text-white font-medium text-xs flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-sm"
                        >
                          <span>{opt.label}</span>
                          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Recommended Result Card */
              <div className="space-y-6">
                <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Trámite Recomendado Detectado</span>
                    <h3 className="text-base font-bold text-white">{recommendedProcedure.title}</h3>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{recommendedProcedure.description}</p>

                {/* Requirements */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-semibold text-blue-400 flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5" /> Requisitos OBLIGATORIOS
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {recommendedProcedure.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Step by step */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-white">Procedimiento Recomendado:</h4>
                  <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1.5 pl-1">
                    {recommendedProcedure.stepByStep.map((st, i) => (
                      <li key={i}>{st}</li>
                    ))}
                  </ol>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={handleResetWizard}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Diagnosticar otro caso
                  </button>

                  <button
                    onClick={() => exportChecklistPDF(recommendedProcedure)}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <Download className="w-4 h-4" /> Descargar Checklist PDF
                  </button>
                </div>
              </div>
            )}

            {answersHistory.length > 0 && !recommendedProcedure && (
              <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
                <span>Respuestas dadas: {answersHistory.length}</span>
                <button
                  onClick={handleResetWizard}
                  className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reiniciar
                </button>
              </div>
            )}
          </div>

          {/* Side History & Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 h-fit">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
              Historial del Diagnóstico
            </h3>

            {answersHistory.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Responda la consulta para ir construyendo el perfil del caso.</p>
            ) : (
              <div className="space-y-3 text-xs">
                {answersHistory.map((h, i) => (
                  <div key={i} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                    <p className="text-[10px] text-slate-500 font-semibold">Paso {i + 1}</p>
                    <p className="text-slate-300 font-medium">{h.question}</p>
                    <p className="text-blue-400 font-semibold">✓ {h.answerLabel}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CATALOG TAB */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3 text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Buscar trámite por nombre o palabra clave (ej: Sucesión, Cédula, Prenda)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCatalog.map((proc) => (
              <div
                key={proc.id}
                className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-xl p-5 space-y-4 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                      {proc.category}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">{proc.title}</h3>
                  </div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                    <Clock className="w-3 h-3 text-blue-400" /> {proc.estimatedDays}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{proc.description}</p>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                  <p className="text-[11px] font-semibold text-slate-300">Formularios Requeridos:</p>
                  <div className="flex flex-wrap gap-1">
                    {proc.formsRequired.map((f, i) => (
                      <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  {proc.officialUrl && (
                    <a
                      href={proc.officialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs"
                    >
                      Ver Guía Oficial <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  <button
                    onClick={() => exportChecklistPDF(proc)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer ml-auto"
                  >
                    <Download className="w-3.5 h-3.5" /> Checklist PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
