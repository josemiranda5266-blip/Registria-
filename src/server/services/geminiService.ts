import { GoogleGenAI } from '@google/genai';
import { AIResponseStructure, AIResponseSource, NormChunk, NormDocument } from '../../types.js';

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

    const hasEvidence = matchedChunks.length > 0 || matchedDocs.length > 0;
    if (!hasEvidence) {
      return {
        answer: 'No existe evidencia suficiente en la biblioteca normativa disponible para responder esta consulta.',
        legalBasis: [],
        requirements: [],
        steps: [],
        documentation: [],
        observations: [],
        sources: [],
        confidence: 'SIN_EVIDENCIA',
        confidenceReason: 'No se encontraron fragmentos o normas coincidentes en la biblioteca registral.',
        lastSyncDate: null,
        generatedAt: new Date().toISOString(),
        warnings: ['Sin evidencia normativa recuperada.'],
      };
    }

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
${contextText}
---

POLÍTICA DE CONFIANZA Y GROUNDING JURÍDICO (REGLAS OBLIGATORIAS E INVIOLABLES):
1. PROHIBIDO INVENTAR CITAS O FUENTES: No inventes leyes, artículos, números de disposición, URLs, títulos o estados que no existan en el contexto recuperado.
2. CITAS FUENTES RETORNADAS: En "sources", incluye ÚNICAMENTE normas que figuren explícitamente en la BIBLIOTECA NORMATIVA RECUPERADA. No inventes URLs ni títulos ajenos.
3. POLÍTICA DE CLASIFICACIÓN DE CONFIANZA:
   - 'ALTA': Existe fundamento normativo directo, oficial y vigente en el contexto recuperado.
   - 'MEDIA': Existe información relevante pero requiere verificación adicional de datos o documentos del trámite.
   - 'BAJA': Evidencia débil o ambigua en el contexto recuperado.
   - 'SIN_EVIDENCIA': No existe evidencia o contexto suficiente para fundamentar la respuesta.
4. SI FALTA INFORMACIÓN: Indica explícitamente "No existe evidencia suficiente en la biblioteca normativa disponible para responder esta consulta." y no afirmes el dato como un hecho verificado.

FORMATO DE RESPUESTA JSON ESTRICTO:
{
  "answer": "Explicación clara y rigurosa basada exclusivamente en la normativa recuperada...",
  "legalBasis": ["Art. X Decreto-Ley 6582/58", "DNTR Título II Capítulo II..."],
  "requirements": ["Requisito 1 si figura en la norma...", "Requisito 2..."],
  "steps": ["Paso 1...", "Paso 2..."],
  "documentation": ["Documento 1 si figura en la norma..."],
  "observations": ["Puntos de atención citados en la norma..."],
  "sources": [
    {
      "documentTitle": "Título de la norma recuperada",
      "sectionOrPage": "Sección o Artículo",
      "url": "https://url.oficial.gob.ar",
      "official": true,
      "status": "VIGENTE"
    }
  ],
  "confidence": "ALTA" | "MEDIA" | "BAJA" | "SIN_EVIDENCIA",
  "confidenceReason": "Justificación objetiva del nivel de confianza asignado",
  "warnings": ["Advertencias de validez o contingencias"]
}

CONSULTA DEL USUARIO: "${query}"
`;

    const ai = this.getClient();
    if (!ai) {
      return this.getDeterministicFallback(query, matchedDocs, matchedChunks);
    }

    try {
      // P0.7: No temperature parameter for gemini-3.6-flash
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
        },
      });

      let parsed: any = {};
      try {
        parsed = JSON.parse(response.text || '{}');
      } catch (jsonErr) {
        console.error('[GeminiService] Error de parsing JSON desde Gemini response:', jsonErr);
        return this.getDeterministicFallback(query, matchedDocs, matchedChunks);
      }

      // Grounding & Source Filtering (REGLA 5: CITAS RAG — NO INVENTAR FUENTES)
      const filteredSources: AIResponseSource[] = [];
      if (Array.isArray(parsed.sources)) {
        for (const src of parsed.sources) {
          if (!src || typeof src !== 'object') continue;
          const srcTitleNorm = (src.documentTitle || '').toLowerCase();

          // Find exact or partial match in retrieved docs/chunks
          const matchedDoc = matchedDocs.find(
            (d) => d.title.toLowerCase().includes(srcTitleNorm) || srcTitleNorm.includes(d.title.toLowerCase()) || d.sourceUrl === src.url
          ) || matchedChunks.find(
            (c) => c.docTitle.toLowerCase().includes(srcTitleNorm) || srcTitleNorm.includes(c.docTitle.toLowerCase())
          );

          if (matchedDoc) {
            const docObj = 'title' in matchedDoc ? matchedDoc : matchedDocs.find((d) => d.documentId === matchedDoc.documentId);
            filteredSources.push({
              documentTitle: docObj?.title || src.documentTitle || 'Norma Registral',
              sectionOrPage: src.sectionOrPage || 'Digesto DNTR',
              url: docObj?.sourceUrl || undefined,
              official: docObj?.officialSource ?? Boolean(src.official),
              status: docObj?.status || 'VIGENTE',
            });
          }
        }
      }

      // If Gemini returned no valid matching sources, build strictly from retrieved matchedDocs
      const finalSources = filteredSources.length > 0
        ? filteredSources
        : matchedDocs.map((d) => ({
            documentTitle: d.title,
            sectionOrPage: 'Digesto DNTR',
            url: d.sourceUrl,
            official: d.officialSource,
            status: d.status,
          }));

      // Calculate confidence objectively
      let computedConfidence: 'ALTA' | 'MEDIA' | 'BAJA' | 'SIN_EVIDENCIA' = ['ALTA', 'MEDIA', 'BAJA', 'SIN_EVIDENCIA'].includes(
        parsed.confidence
      )
        ? parsed.confidence
        : 'MEDIA';

      if (finalSources.length === 0 && computedConfidence === 'ALTA') {
        computedConfidence = 'MEDIA';
      }

      // Last Sync Date: Use real uploadedAt/verifiedAt date from matched documents if present
      const realSyncDate = matchedDocs.find((d) => d.uploadedAt)?.uploadedAt?.split('T')[0] || null;

      return {
        answer: parsed.answer || 'Respuesta procesada correctamente.',
        legalBasis: Array.isArray(parsed.legalBasis) ? parsed.legalBasis : [],
        requirements: Array.isArray(parsed.requirements) ? parsed.requirements : [],
        steps: Array.isArray(parsed.steps) ? parsed.steps : [],
        documentation: Array.isArray(parsed.documentation) ? parsed.documentation : [],
        observations: Array.isArray(parsed.observations) ? parsed.observations : [],
        sources: finalSources,
        confidence: computedConfidence,
        confidenceReason: parsed.confidenceReason || 'Análisis del contexto normativo recuperado.',
        lastSyncDate: realSyncDate,
        generatedAt: new Date().toISOString(),
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

      try {
        return JSON.parse(response.text || '{}');
      } catch (e) {
        console.error('[GeminiService] Error al parsear JSON OCR de Gemini:', e);
      }
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

    if (!hasEvidence) {
      return {
        answer: 'No existe evidencia suficiente en la biblioteca normativa disponible para responder esta consulta.',
        legalBasis: [],
        requirements: [],
        steps: [],
        documentation: [],
        observations: [],
        sources: [],
        confidence: 'SIN_EVIDENCIA',
        confidenceReason: 'No se encontraron fragmentos o normas coincidentes en la biblioteca registral.',
        lastSyncDate: null,
        generatedAt: new Date().toISOString(),
        warnings: ['Sin evidencia normativa recuperada.'],
      };
    }

    const isVigenteAndOfficial = matchedDocs.every((d) => d.status === 'VIGENTE' && d.officialSource);
    const realSyncDate = matchedDocs.find((d) => d.uploadedAt)?.uploadedAt?.split('T')[0] || null;

    // Build evidence summary strictly from retrieved documents/chunks
    const summaryTexts = matchedChunks.length > 0
      ? matchedChunks.map((c) => `• ${c.docTitle} (${c.sectionTitle || 'General'}): ${c.text.slice(0, 300)}...`)
      : matchedDocs.map((d) => `• ${d.title}: ${d.summary || d.content.slice(0, 300)}...`);

    const topicsExtracted = Array.from(
      new Set(matchedDocs.flatMap((d) => d.topics || []))
    );

    return {
      answer: `Información normativa recuperada de la biblioteca registral oficial para "${query}":\n\n${summaryTexts.join('\n\n')}`,
      legalBasis: matchedDocs.map((d) => d.number || d.title),
      requirements: topicsExtracted.length > 0 ? topicsExtracted.map((t) => `Materia: ${t}`) : ['Verificar disposiciones en la norma correspondiente.'],
      steps: ['Consultar el texto completo de las normas listadas en fuentes.'],
      documentation: matchedDocs.map((d) => d.title),
      observations: [
        'Respuesta generada a partir de los documentos normativos vigentes almacenados en la base registral.',
      ],
      sources: matchedDocs.map((d) => ({
        documentTitle: d.title,
        sectionOrPage: 'Digesto DNTR',
        url: d.sourceUrl,
        official: d.officialSource,
        status: d.status,
      })),
      confidence: isVigenteAndOfficial ? 'ALTA' : 'MEDIA',
      confidenceReason: isVigenteAndOfficial
        ? 'Fundamentado en norma vigente y oficial recuperada directamente de la base de datos.'
        : 'Información relevante en la biblioteca, pero requiere verificación adicional.',
      lastSyncDate: realSyncDate,
      generatedAt: new Date().toISOString(),
      warnings: [],
    };
  }
}
