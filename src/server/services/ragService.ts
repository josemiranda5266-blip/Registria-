import { INITIAL_NORMATIVE_LIBRARY } from '../../data/normativeDatabase.js';
import { NormChunk, NormDocument } from '../../types.js';
import { RagChunkerService } from './ragChunker.js';

const STOP_WORDS = new Set([
  'de', 'la', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para', 'con', 'no',
  'una', 'su', 'al', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya', 'o', 'este', 'sí', 'porque',
  'esta', 'entre', 'cuando', 'muy', 'sin', 'sobre', 'también', 'me', 'hasta', 'hay', 'donde',
  'quien', 'desde', 'todo', 'nos', 'durante', 'todos', 'uno', 'les', 'ni', 'contra', 'otros', 'ese'
]);

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics / accents
}

export interface RAGSearchResult {
  matchedChunks: NormChunk[];
  matchedDocs: NormDocument[];
  queryTerms: string[];
}

export function searchNormativeContext(
  query: string,
  officialOnly: boolean = false,
  allNormsFromDb?: NormDocument[]
): RAGSearchResult {
  const normalizedQuery = normalizeText(query);
  const rawWords = normalizedQuery.split(/\s+/).map((w) => w.replace(/[^a-z0-9]/g, '')).filter((w) => w.length > 2);
  const queryTerms = Array.from(new Set(rawWords.filter((w) => !STOP_WORDS.has(w))));

  const docsToSearch = allNormsFromDb && allNormsFromDb.length > 0 ? allNormsFromDb : INITIAL_NORMATIVE_LIBRARY;

  // Dynamically generate chunks from the active DB documents (Single Source of Truth)
  const chunksToSearch: NormChunk[] = docsToSearch.flatMap((doc) =>
    RagChunkerService.generateChunksFromDocument(doc)
  );

  // Score Chunks
  const scoredChunks = chunksToSearch.map((chunk) => {
    if (officialOnly && !chunk.officialSource) {
      return { chunk, score: 0 };
    }

    let score = 0;
    const chunkTitleNorm = normalizeText(chunk.docTitle);
    const chunkSecNorm = normalizeText(chunk.sectionTitle || '');
    const chunkTextNorm = normalizeText(chunk.text);

    queryTerms.forEach((term) => {
      if (chunkTitleNorm.includes(term)) score += 10;
      if (chunkSecNorm.includes(term)) score += 5;
      if (chunkTextNorm.includes(term)) score += 2;
    });

    // Exact phrase bonus
    if (queryTerms.length > 1 && chunkTextNorm.includes(normalizedQuery)) {
      score += 15;
    }

    // Specific automotive domain boosts
    if (normalizedQuery.includes('fallec') || normalizedQuery.includes('sucesion')) {
      if (chunkTextNorm.includes('sucesion') || chunkTextNorm.includes('fallecimiento') || chunkTextNorm.includes('heredero')) score += 8;
    }
    if (normalizedQuery.includes('transfer') && (chunkTextNorm.includes('08') || chunkTextNorm.includes('dominio'))) {
      score += 6;
    }
    if (normalizedQuery.includes('prenda') && chunkTextNorm.includes('prenda')) {
      score += 6;
    }
    if (normalizedQuery.includes('cedula') && chunkTextNorm.includes('cedula')) {
      score += 6;
    }

    // Multipliers for official & active norms
    if (chunk.officialSource) score *= 1.2;
    if (chunk.status === 'VIGENTE') score *= 1.3;

    return { chunk, score };
  })
    .filter((item) => item.score > 1.0)
    .sort((a, b) => b.score - a.score);

  const matchedChunks = scoredChunks.slice(0, 5).map((sc) => sc.chunk);

  // Score Documents
  const scoredDocs = docsToSearch.map((doc) => {
    if (officialOnly && !doc.officialSource) {
      return { doc, score: 0 };
    }

    let score = 0;
    const docTitleNorm = normalizeText(doc.title);
    const docContentNorm = normalizeText(doc.content);
    const docTopicsNorm = normalizeText(doc.topics.join(' '));

    queryTerms.forEach((term) => {
      if (docTitleNorm.includes(term)) score += 12;
      if (docTopicsNorm.includes(term)) score += 6;
      if (docContentNorm.includes(term)) score += 1;
    });

    if (doc.status === 'VIGENTE') score *= 1.3;
    if (doc.officialSource) score *= 1.2;

    return { doc, score };
  })
    .filter((item) => item.score > 1.0)
    .sort((a, b) => b.score - a.score);

  const matchedDocs = scoredDocs.slice(0, 4).map((sd) => sd.doc);

  return {
    matchedChunks,
    matchedDocs,
    queryTerms,
  };
}

