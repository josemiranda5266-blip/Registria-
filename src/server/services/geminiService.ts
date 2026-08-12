import { GoogleGenAI } from '@google/genai';
import { AIResponseStructure, NormChunk, NormDocument } from '../../types.js';

export class GeminiService {
  private static getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-registria',
        },
      },
    });
  }

  static async generateChatResponse(params: {
    query: string;
    mode: 'profesional' | 'simple';
    officialOnly: boolean;
    matchedChunks: NormChunk[];
    matchedDocs: NormDocument[];
  }): Promise<AIResponseStructure> {
    const { query, mode, officialOnly, matchedChunks, matchedDocs } = params;

    const contextText = matchedChunks.length > 0
      ? matchedChunks
          .map(
            (c) => `[DOCUMENTO: ${c.docTitle} | SECCIÓN: ${c.sectionTitle || 'General'} | ESTADO: ${c.status} | FUENTE_OFICIAL: ${c.officialSource ? 'SÍ' : 'NO'}]\n${c.text}`
          )
          .join('\n\n')
      : matchedDocs
          .map(
            (d) => `[DOCUMENTO: ${d.title} | ESTADO: ${d.status} | FUENTE_OFICIAL: ${d.officialSource ? 'SÍ' : 'NO'}]\n${d.content.slice(0, 1000)}`
          )
          .join('\n\n');

    const promptText = `
Eres REGISTRIA, el asistente de inteligencia registral profesional para el automotor argentino (DNRPA, Digesto DNTR, Decreto-Ley 6582/58).

MODO DE RESPUESTA: ${mode === 'simple' ? 'SIMPLE Y CIUDADANO (lenguaje claro y accesible)' : 'PROFESIONAL (precisión jurídica para mandatarios, gestores y abogados)'}
FILTRO FUENTES OFICIALES: ${officialOnly ? 'SÍ' : 'NO'}

BIBLIOTECA NORMATIVA RECUPERADA (RAG):
---
${contextText || 'No se encontraron fragmentos específicos en la biblioteca.'}
---

POLÍTICA DE CONFIANZA Y GROUNDING JURÍDICO (REGLAS OBLIGATORIAS E INVIOLABLES):
1. PROHIBIDO INVENTAR: No inventes leyes, artículos, números de disposición, formularios o requisitos que no existan en el ordenamiento argentino.
2. POLÍTICA DE CLASIFICACIÓN DE CONFIANZA:
   - 'ALTA': Existe fundamento normativo directo, oficial y vigente en el contexto recuperado.
   - 'MEDIA': Existe información normativa relevante pero requiere verificar datos específicos del vehículo o titular.
   - 'BAJA': No existe evidencia o normativa suficiente en el contexto recuperado para responder con certeza.
3. SI FALTA INFORMACIÓN: Indica explícitamente "No existe evidencia suficiente en el contexto normativo disponible" y sugiere consultar al Registro Seccional.
4. DIFERENCIACIÓN DE FUENTES: Identifica claramente si la norma es Fuente Oficial Vigente o Inferencia.

FORMATO DE RESPUESTA JSON ESTRICTO:
{
  "answer": "Explicación clara y rigurosa basada en el régimen automotor...",
  "legalBasis": ["Art. X Decreto-Ley 6582/58", "DNTR Título II Capítulo II..."],
  "requirements": ["Requisito 1...", "Requisito 2..."],
  "steps": ["Paso 1...", "Paso 2..."],
  "documentation": ["Formulario 08", "DNI", "Verificación Policial Form 12..."],
  "observations": ["Puntos de atención, asentimiento conyugal, prendas o inhibiciones..."],
  "sources": [
    {
      "documentTitle": "Nombre de la norma",
      "sectionOrPage": "Sección o Artículo",
      "url": "https://www.dnrpa.gov.ar",
      "official": true,
      "status": "VIGENTE"
    }
  ],
  "confidence": "ALTA" | "MEDIA" | "BAJA",
  "confidenceReason": "Justificación objetiva del nivel de confianza asignado",
  "lastSyncDate": "2026-08-12",
  "warnings": ["Advertencias de validez o contingencias"]
}

CONSULTA DEL USUARIO: "${query}"
`;

    const ai = this.getClient();
    if (!ai) {
      // Deterministic RAG fallback when API key is not present
      return this.getDeterministicFallback(query, matchedDocs, matchedChunks);
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1, // Low temperature for factual precision
        },
      });

      const parsed = JSON.parse(response.text || '{}');

      // Validate required fields
      return {
        answer: parsed.answer || 'Respuesta procesada correctamente.',
        legalBasis: Array.isArray(parsed.legalBasis) ? parsed.legalBasis : [],
        requirements: Array.isArray(parsed.requirements) ? parsed.requirements : [],
        steps: Array.isArray(parsed.steps) ? parsed.steps : [],
        documentation: Array.isArray(parsed.documentation) ? parsed.documentation : [],
        observations: Array.isArray(parsed.observations) ? parsed.observations : [],
        sources: Array.isArray(parsed.sources) ? parsed.sources : [],
        confidence: ['ALTA', 'MEDIA', 'BAJA'].includes(parsed.confidence) ? parsed.confidence : 'MEDIA',
        confidenceReason: parsed.confidenceReason || 'Basado en análisis del contexto normativo.',
        lastSyncDate: new Date().toISOString().split('T')[0],
        warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      };
    } catch (err) {
      console.error('[GeminiService] Error llamando a la API de Gemini:', err);
      return this.getDeterministicFallback(query, matchedDocs, matchedChunks);
    }
  }

  static async analyzeDocumentOCR(params: {
    imageBase64?: string;
    documentType?: string;
    fileName?: string;
  }) {
    const { imageBase64, documentType, fileName } = params;

    const promptText = `
Eres un analizador OCR registral para el automotor argentino de REGISTRIA.
Analiza la imagen de este documento automotor (${documentType || 'Automotor'}).

REGLA ABSOLUTA Y ESTRICTA:
1. NUNCA INVENTES DATOS. Si un campo no es legible, está borroso o ausente en la imagen, asigna exactamente:
   - "value": "NO LEGIBLE"
   - "confidence": 0.0
   - "isReadable": false
2. NUNCA generes DNI, Patentes, o Chasis de ejemplo si no están en la imagen.

Devuelve JSON estricto:
{
  "documentType": "${documentType || 'TITULO_AUTOMOTOR'}",
  "confidenceScore": 0.95,
  "rawOcrText": "Texto crudo visible...",
  "extractedFields": {
    "titular": { "label": "Titular Registral", "value": "...", "confidence": 0.95, "isReadable": true },
    "dniCuit": { "label": "DNI / CUIT", "value": "...", "confidence": 0.92, "isReadable": true },
    "dominio": { "label": "Dominio / Patente", "value": "...", "confidence": 0.98, "isReadable": true },
    "marcaModelo": { "label": "Marca y Modelo", "value": "...", "confidence": 0.90, "isReadable": true },
    "numeroChasis": { "label": "N° Chasis", "value": "...", "confidence": 0.88, "isReadable": true },
    "numeroMotor": { "label": "N° Motor", "value": "NO LEGIBLE", "confidence": 0.0, "isReadable": false },
    "fechaInscripcion": { "label": "Fecha Inscripción", "value": "...", "confidence": 0.85, "isReadable": true }
  }
}
`;

    const ai = this.getClient();
    if (ai && imageBase64) {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data,
            },
          },
          { text: promptText },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      return JSON.parse(response.text || '{}');
    }

    // Safe fallback when image OCR fails or API key is absent:
    // STRICT RULE: Do NOT generate fake personal details! Return unreadable status cleanly.
    return {
      documentType: documentType || 'TITULO_AUTOMOTOR',
      confidenceScore: 0.0,
      rawOcrText: 'ANÁLISIS OCR PENDIENTE / IMAGEN NO PROCESADA MEDIANTE SERVICIO GEMINI.',
      extractedFields: {
        titular: { label: 'Titular Registral', value: 'NO LEGIBLE', confidence: 0.0, isReadable: false },
        dniCuit: { label: 'DNI / CUIT', value: 'NO LEGIBLE', confidence: 0.0, isReadable: false },
        dominio: { label: 'Dominio (Patente)', value: 'NO LEGIBLE', confidence: 0.0, isReadable: false },
        marcaModelo: { label: 'Marca y Modelo', value: 'NO LEGIBLE', confidence: 0.0, isReadable: false },
        numeroChasis: { label: 'Número de Chasis', value: 'NO LEGIBLE', confidence: 0.0, isReadable: false },
        numeroMotor: { label: 'Número de Motor', value: 'NO LEGIBLE', confidence: 0.0, isReadable: false },
        fechaInscripcion: { label: 'Fecha de Inscripción', value: 'NO LEGIBLE', confidence: 0.0, isReadable: false },
      },
    };
  }

  private static getDeterministicFallback(
    query: string,
    matchedDocs: NormDocument[],
    matchedChunks: NormChunk[]
  ): AIResponseStructure {
    const hasEvidence = matchedChunks.length > 0 || matchedDocs.length > 0;

    return {
      answer: hasEvidence
        ? `En base a la normativa vigente del automotor en Argentina para la consulta "${query}":`
        : `No se encontró evidencia suficiente en la biblioteca normativa cargada para responder la consulta "${query}" con certeza absoluta.`,
      legalBasis: hasEvidence
        ? ['DNTR Título II, Capítulo II', 'Decreto-Ley 6582/58 Art. 1° y 27°']
        : ['Reglamento General DNRPA'],
      requirements: hasEvidence
        ? [
            'Solicitud Tipo 08 (Presencial o Digital).',
            'DNI / CUIT del comprador y vendedor.',
            'Verificación Física Policial (Formulario 12) si corresponde.',
          ]
        : ['Verificar antecedentes en el Registro Seccional de radicación.'],
      steps: [
        'Solicitar Informe de Dominio e Inhibiciones.',
        'Completar la Solicitud 08.',
        'Presentar en el Registro Seccional correspondiente.',
      ],
      documentation: ['DNI', 'Formulario 08', 'Formulario 12', 'Título / Cédula'],
      observations: [
        'Verificar vigencia de VTV, multas de tránsito y patentes provinciales antes del ingreso.',
      ],
      sources: matchedDocs.map((d) => ({
        documentTitle: d.title,
        sectionOrPage: 'Digesto DNTR',
        url: d.sourceUrl,
        official: d.officialSource,
        status: d.status,
      })),
      confidence: hasEvidence ? 'ALTA' : 'BAJA',
      confidenceReason: hasEvidence
        ? 'Respuesta estructurada a partir del Digesto de Normas Técnico-Registrales en la biblioteca.'
        : 'Información insuficiente en la biblioteca normativa.',
      lastSyncDate: new Date().toISOString().split('T')[0],
      warnings: hasEvidence ? [] : ['Se recomienda la revisión por parte de un mandatario matriculado.'],
    };
  }
}
