import React, { useState } from 'react';
import { 
  Camera, 
  Upload, 
  FileCheck, 
  AlertOctagon, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  X, 
  Eye, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { AnalyzedDocument, DocumentVerificationResult } from '../types';

export const DocumentAnalyzer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'single' | 'verify'>('single');
  const [analyzedDocs, setAnalyzedDocs] = useState<AnalyzedDocument[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [docType, setDocType] = useState<AnalyzedDocument['documentType']>('TITULO_AUTOMOTOR');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentDoc, setCurrentDoc] = useState<AnalyzedDocument | null>(null);

  // Verification tab state
  const [selectedForVerify, setSelectedForVerify] = useState<string[]>([]);
  const [verificationResult, setVerificationResult] = useState<DocumentVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setIsAnalyzing(true);

      try {
        const response = await fetch('/api/analyze-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            documentType: docType,
            fileName: file.name,
          }),
        });

        if (!response.ok) throw new Error('Error al analizar documento');

        const result: AnalyzedDocument = await response.json();
        result.id = 'doc-' + Date.now();
        result.previewUrl = base64;

        setCurrentDoc(result);
        setAnalyzedDocs((prev) => [result, ...prev]);
      } catch (err) {
        console.error('Error analizando documento:', err);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRunVerification = async () => {
    const docsToVerify = analyzedDocs.filter((d) => selectedForVerify.includes(d.id));
    if (docsToVerify.length < 2) return;

    setIsVerifying(true);
    try {
      const response = await fetch('/api/verify-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: docsToVerify }),
      });

      if (!response.ok) throw new Error('Error en el verificador');
      const res: DocumentVerificationResult = await response.json();
      setVerificationResult(res);
    } catch (err) {
      console.error('Error en verificación:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const toggleSelectForVerify = (id: string) => {
    setSelectedForVerify((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white font-serif">Analizador OCR y Verificador Documental</h2>
          </div>
          <p className="text-xs text-slate-400">
            Extraé datos de Títulos, Cédulas, DNI y Formularios sin inventar información. Compará inconsistencias cruzadas.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'single' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Analizar Documento Individual
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === 'verify' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Verificación Cruzada ({analyzedDocs.length})
          </button>
        </div>
      </div>

      {/* TAB 1: SINGLE DOCUMENT OCR ANALYZER */}
      {activeTab === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload & Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
              Subir o Capturar Documento Registral
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Tipo de Documento a Escanear</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none"
                >
                  <option value="TITULO_AUTOMOTOR">Título del Automotor</option>
                  <option value="CEDULA_VERDE">Cédula Verde</option>
                  <option value="CEDULA_AZUL">Cédula Azul</option>
                  <option value="DNI">DNI (Frente / Dorso)</option>
                  <option value="FORMULARIO_08">Formulario 08 / 08D</option>
                  <option value="FORMULARIO_12">Formulario 12 (Verificación Policial)</option>
                  <option value="PODER">Poder Notarial</option>
                </select>
              </div>

              {/* Upload Dropzone */}
              <label className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 bg-slate-950 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isAnalyzing}
                />
                <div className="p-3 bg-blue-600/10 text-blue-400 group-hover:bg-blue-600/20 rounded-full transition-all">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-200">Hacé clic para seleccionar una imagen o fotografía</p>
                  <p className="text-[11px] text-slate-500">Soporta JPG, PNG, WEBP (Asegurá buena iluminación)</p>
                </div>
              </label>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400">Previsualización:</p>
                <div className="bg-slate-950 rounded-lg border border-slate-800 p-2 max-h-56 flex justify-center items-center overflow-hidden">
                  <img src={imagePreview} alt="Vista previa" className="max-h-52 object-contain rounded" />
                </div>
              </div>
            )}
          </div>

          {/* Extraction Output Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>Campos Extraídos por OCR</span>
              {currentDoc && (
                <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500/30 rounded">
                  Confianza: {Math.round(currentDoc.confidenceScore * 100)}%
                </span>
              )}
            </h3>

            {isAnalyzing ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                <p className="text-xs font-medium">Ejecutando OCR y extrayendo campos registrables...</p>
              </div>
            ) : currentDoc ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(currentDoc.extractedFields).map(([key, field]: [string, any]) => (
                    <div
                      key={key}
                      className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                        field.value === 'NO LEGIBLE' || !field.isReadable
                          ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                          : 'bg-slate-950 border-slate-800 text-slate-200'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">{field.label || key}</span>
                        <span className="font-mono text-sm font-semibold">{field.value}</span>
                      </div>

                      {field.value === 'NO LEGIBLE' ? (
                        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-500/40 text-[10px] font-bold">
                          NO LEGIBLE
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-semibold">
                          ✓ {Math.round((field.confidence || 0.9) * 100)}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-500">OCR Texto Crudo:</p>
                  <p className="font-mono text-[11px] text-slate-400 whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {currentDoc.rawOcrText}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                Subí un documento para visualizar la extracción automática de datos.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MULTI-DOCUMENT VERIFIER */}
      {activeTab === 'verify' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
              Seleccionar Documentos para la Verificación Cruzada
            </h3>

            {analyzedDocs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                Aún no hay documentos escaneados. Escaneá primero un Título y un DNI en la pestaña individual.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {analyzedDocs.map((doc) => {
                  const isSelected = selectedForVerify.includes(doc.id);
                  return (
                    <div
                      key={doc.id}
                      onClick={() => toggleSelectForVerify(doc.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                        isSelected
                          ? 'bg-blue-950/40 border-blue-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-blue-400">{doc.documentType}</span>
                        <p className="font-semibold text-slate-200">{doc.fileName}</p>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'bg-blue-600 border-blue-400 text-white' : 'border-slate-700'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleRunVerification}
                disabled={selectedForVerify.length < 2 || isVerifying}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-semibold text-xs rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                <span>Ejecutar Verificación Cruzada ({selectedForVerify.length})</span>
              </button>
            </div>
          </div>

          {/* Verification Results Output */}
          {verificationResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  {verificationResult.isConsistent ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-amber-400" />
                  )}
                  <div>
                    <h3 className="text-base font-bold text-white">Resultado del Análisis Comparativo</h3>
                    <p className="text-xs text-slate-400">{verificationResult.summary}</p>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  verificationResult.isConsistent
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                }`}>
                  {verificationResult.isConsistent ? 'COINCIDENCIA CORRECTA' : 'OBSERVACIONES DETECTADAS'}
                </span>
              </div>

              {verificationResult.inconsistencies.length === 0 ? (
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 text-xs text-emerald-200">
                  ✓ Todos los campos esenciales (Titular, DNI, Dominio, Chasis) coinciden de manera consistente entre los documentos seleccionados.
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Inconsistencias y Advertencias Registrales ({verificationResult.inconsistencies.length}):
                  </h4>

                  <div className="space-y-2">
                    {verificationResult.inconsistencies.map((inc, i) => (
                      <div
                        key={i}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{inc.fieldLabel}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inc.severity === 'GRAVE'
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                              : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          }`}>
                            {inc.severity}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-2 rounded border border-slate-800 text-[11px]">
                          <div>
                            <span className="text-slate-500 block">{inc.docAName}:</span>
                            <span className="font-semibold text-slate-200">{inc.valueA}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">{inc.docBName}:</span>
                            <span className="font-semibold text-slate-200">{inc.valueB}</span>
                          </div>
                        </div>

                        <p className="text-amber-300/90 text-[11px]">
                          💡 <strong>Recomendación:</strong> {inc.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
