import React, { useState } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  FileText, 
  Download, 
  ThumbsUp, 
  ThumbsDown, 
  Lock, 
  Clock, 
  Info, 
  Search,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { AIChatMessage, AIResponseStructure } from '../types';
import jsPDF from 'jspdf';

interface ChatRAGProps {
  officialOnly: boolean;
  mode: 'profesional' | 'simple';
}

export const ChatRAG: React.FC<ChatRAGProps> = ({ officialOnly, mode }) => {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'm-welcome',
      role: 'assistant',
      text: '¡Hola! Soy REGISTRIA, tu asistente de inteligencia registral automotor. ¿En qué trámite o consulta normativa puedo ayudarte hoy?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTraceForMsgId, setShowTraceForMsgId] = useState<string | null>(null);
  const [feedbackSaved, setFeedbackSaved] = useState<Record<string, 'up' | 'down'>>({});
  const [feedbackModalMsgId, setFeedbackModalMsgId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  const suggestedQueries = [
    '¿Qué documentación necesito para transferir un vehículo?',
    '¿Qué hago si falleció el titular registral?',
    '¿Cómo se realiza una denuncia de venta?',
    '¿Qué requisitos tiene la transferencia para una persona jurídica?',
    '¿Qué cambió con la Cédula Azul y Verde recientemente?',
    '¿Qué documentación se necesita para inscribir un 0KM?',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputValue.trim();
    if (!textToSend || isLoading) return;

    const userMsgId = 'u-' + Date.now();
    const userMsg: AIChatMessage = {
      id: userMsgId,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          officialOnly,
          mode,
        }),
      });

      if (!response.ok) {
        throw new Error('Error en el servidor de consulta RAG');
      }

      const data = await response.json();
      const botMsg: AIChatMessage = {
        id: 'b-' + Date.now(),
        role: 'assistant',
        text: data.responseStructure?.answer || 'No se pudo obtener una respuesta.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        responseStructure: data.responseStructure,
        traceInfo: data.traceInfo,
        isOfficialOnlyMode: officialOnly,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error('Error enviando consulta RAG:', error);
      const errorMsg: AIChatMessage = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        text: 'Ocurrió un inconveniente al procesar la consulta normativa. Verificá la conexión o intentá nuevamente con otros términos.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = (msg: AIChatMessage) => {
    if (!msg.responseStructure) return;
    const doc = new jsPDF();
    const resp = msg.responseStructure;

    doc.setFontSize(18);
    doc.setTextColor(11, 25, 44);
    doc.text('REGISTRIA - Informe de Inteligencia Registral', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-AR')} | Modo: ${mode.toUpperCase()} | Confianza: ${resp.confidence}`, 14, 28);
    doc.text('________________________________________________________________________________', 14, 32);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Consulta:', 14, 42);
    doc.setFontSize(10);
    const queryLines = doc.splitTextToSize(msg.text || '', 180);
    doc.text(queryLines, 14, 48);

    let yPos = 48 + queryLines.length * 6;

    doc.setFontSize(12);
    doc.text('Respuesta Normativa:', 14, yPos);
    yPos += 6;

    doc.setFontSize(10);
    const answerLines = doc.splitTextToSize(resp.answer || '', 180);
    doc.text(answerLines, 14, yPos);
    yPos += answerLines.length * 5 + 6;

    if (resp.legalBasis && resp.legalBasis.length > 0) {
      doc.setFontSize(11);
      doc.text('Fundamento Normativo:', 14, yPos);
      yPos += 6;
      doc.setFontSize(9);
      resp.legalBasis.forEach((item) => {
        doc.text(`• ${item}`, 18, yPos);
        yPos += 5;
      });
      yPos += 4;
    }

    if (resp.requirements && resp.requirements.length > 0) {
      doc.setFontSize(11);
      doc.text('Requisitos del Trámites:', 14, yPos);
      yPos += 6;
      doc.setFontSize(9);
      resp.requirements.forEach((req) => {
        doc.text(`[ ] ${req}`, 18, yPos);
        yPos += 5;
      });
      yPos += 4;
    }

    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text('Documento generado con la asistencia de REGISTRIA. Las decisiones profesionales deben ser verificadas.', 14, 280);

    doc.save(`REGISTRIA_Consulta_${Date.now()}.pdf`);
  };

  const submitFeedback = () => {
    if (feedbackModalMsgId) {
      setFeedbackSaved((prev) => ({ ...prev, [feedbackModalMsgId]: 'down' }));
      setFeedbackModalMsgId(null);
      setFeedbackText('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-140px)] min-h-[600px]">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Consulta Normativa RAG Registral</h2>
            <p className="text-xs text-slate-400">
              Búsqueda semántica sobre Digesto DNTR, Ley 6582/58 y Disposiciones oficiales con citas verificadas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {officialOnly && (
            <span className="px-2.5 py-1 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-medium flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              Bloqueo Fuentes Oficiales
            </span>
          )}
          <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-medium capitalize">
            {mode}
          </span>
        </div>
      </div>

      {/* Suggested Query Chips */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-semibold text-slate-400 whitespace-nowrap flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Consultas frecuentes:
        </span>
        {suggestedQueries.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700 hover:border-blue-500 hover:text-white hover:bg-slate-800 transition-all whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-3xl rounded-2xl p-4 shadow-sm text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
              }`}
            >
              {/* User text */}
              {msg.role === 'user' ? (
                <div>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span className="text-[10px] text-blue-200 mt-1 block text-right">{msg.timestamp}</span>
                </div>
              ) : (
                /* Assistant Structured Response */
                <div className="space-y-4">
                  {/* Primary Answer */}
                  <div>
                    <p className="text-slate-100 font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>

                  {msg.responseStructure && (
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                      {/* Legal Basis */}
                      {msg.responseStructure.legalBasis?.length > 0 && (
                        <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800">
                          <h4 className="text-xs font-semibold text-blue-400 flex items-center gap-1.5 mb-1.5">
                            <BookOpen className="w-3.5 h-3.5" /> Fundamento Normativo
                          </h4>
                          <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                            {msg.responseStructure.legalBasis.map((lb, i) => (
                              <li key={i}>{lb}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Requirements Checklist */}
                      {msg.responseStructure.requirements?.length > 0 && (
                        <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800">
                          <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Requisitos OBLIGATORIOS
                          </h4>
                          <div className="space-y-1">
                            {msg.responseStructure.requirements.map((req, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></span>
                                <span>{req}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Steps & Procedure */}
                      {msg.responseStructure.steps?.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-slate-300 mb-1.5">Procedimiento Paso a Paso:</h4>
                          <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1 pl-1">
                            {msg.responseStructure.steps.map((st, i) => (
                              <li key={i} className="leading-relaxed">{st}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Observations / Warnings */}
                      {msg.responseStructure.observations?.length > 0 && (
                        <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-3">
                          <h4 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Observaciones y Situaciones Especiales
                          </h4>
                          <ul className="list-disc list-inside text-xs text-amber-200/90 space-y-1">
                            {msg.responseStructure.observations.map((obs, i) => (
                              <li key={i}>{obs}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Official Sources Citations */}
                      {msg.responseStructure.sources?.length > 0 && (
                        <div className="pt-2 border-t border-slate-800">
                          <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-400" /> Fuentes de Información Utilizadas:
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {msg.responseStructure.sources.map((src, i) => (
                              <div key={i} className="bg-slate-950/80 p-2 rounded border border-slate-800 text-xs flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-semibold text-slate-200">{src.documentTitle}</p>
                                  <p className="text-[11px] text-slate-400">{src.sectionOrPage}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  {src.official && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                                      Oficial
                                    </span>
                                  )}
                                  {src.url && (
                                    <a
                                      href={src.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-blue-400 hover:text-blue-300 flex items-center gap-0.5 text-[10px]"
                                    >
                                      Ver fuente <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer Metadata & Confidence */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 border-t border-slate-800/80">
                        {/* Confidence Badge */}
                        <div className="flex items-center gap-1.5">
                          <span>Nivel de confianza:</span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              msg.responseStructure.confidence === 'ALTA'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                : msg.responseStructure.confidence === 'MEDIA'
                                ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            ● {msg.responseStructure.confidence}
                          </span>
                        </div>

                        {/* Last Sync */}
                        <div className="text-slate-400">
                          Información consultada al: <span className="text-slate-200">{msg.responseStructure.lastSyncDate}</span>
                        </div>

                        {/* Export & Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleExportPDF(msg)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition-all cursor-pointer"
                            title="Exportar dictamen en PDF"
                          >
                            <Download className="w-3 h-3 text-blue-400" /> Exportar PDF
                          </button>

                          {/* Trace Info Toggle */}
                          {msg.traceInfo && (
                            <button
                              onClick={() =>
                                setShowTraceForMsgId(showTraceForMsgId === msg.id ? null : msg.id)
                              }
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                            >
                              <Info className="w-3 h-3 text-purple-400" /> Trazabilidad RAG
                              {showTraceForMsgId === msg.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}

                          {/* Feedback buttons */}
                          <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
                            <button
                              onClick={() => setFeedbackSaved((p) => ({ ...p, [msg.id]: 'up' }))}
                              className={`p-1 rounded hover:bg-slate-800 ${
                                feedbackSaved[msg.id] === 'up' ? 'text-emerald-400 font-bold' : 'text-slate-400'
                              }`}
                              title="Útil"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setFeedbackModalMsgId(msg.id)}
                              className={`p-1 rounded hover:bg-slate-800 ${
                                feedbackSaved[msg.id] === 'down' ? 'text-rose-400 font-bold' : 'text-slate-400'
                              }`}
                              title="No útil / Reportar error"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* RAG Trace Inspector Panel */}
                      {showTraceForMsgId === msg.id && msg.traceInfo && (
                        <div className="mt-2 p-3 bg-slate-950 rounded-lg border border-purple-500/30 text-xs space-y-1.5 font-mono text-purple-200">
                          <p className="font-sans font-semibold text-purple-300 border-b border-purple-900/50 pb-1 flex items-center justify-between">
                            <span>Trazabilidad RAG Interna</span>
                            <span className="text-[10px] text-slate-400">{msg.traceInfo.executionTimeMs}ms</span>
                          </p>
                          <p>Clasificación: <span className="text-white">{msg.traceInfo.queryClassification}</span></p>
                          <p>Modelo: <span className="text-white">{msg.traceInfo.modelUsed}</span></p>
                          <p>Fragmentos recuperados: <span className="text-white">{msg.traceInfo.matchedChunksCount}</span></p>
                          <p>Filtro vigencia pasados: <span className="text-white">{msg.traceInfo.vigencyFilteredCount}</span></p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center flex-shrink-0 border border-slate-700">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
              <span>Consultando biblioteca normativa RAG, verificando vigencia y sintetizando fundamento...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Form Bar */}
      <div className="mt-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-2 shadow-lg focus-within:border-blue-500 transition-all"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Preguntá sobre normativa, trámites o documentación (ej: ¿Cómo transfiero con prenda y herederos?)..."
            className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-lg font-medium text-xs flex items-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed shadow-md"
          >
            <span>Consultar</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <p className="text-[10px] text-slate-500 mt-2 text-center">
          REGISTRIA no inventa normas. Si la información no está en el Digesto DNTR o fuentes oficiales, se indicará expresamente.
        </p>
      </div>

      {/* Feedback Modal */}
      {feedbackModalMsgId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-semibold text-white">Feedback sobre la respuesta</h3>
            <p className="text-xs text-slate-400">
              ¿Qué parte considerás imprecisa o errónea? Tu observación ayudará a perfeccionar la clasificación y el RAG normativo.
            </p>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Ejemplo: Falta mencionar el arancel de la certificación de firmas o la ley cita un artículo antiguo..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-600 h-24 focus:outline-none focus:border-blue-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setFeedbackModalMsgId(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={submitFeedback}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 cursor-pointer"
              >
                Enviar reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
