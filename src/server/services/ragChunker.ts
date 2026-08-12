import crypto from 'crypto';
import { NormDocument, NormChunk } from '../../types.js';

export class RagChunkerService {
  static computeHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  static generateChunksFromDocument(norm: NormDocument): NormChunk[] {
    const text = norm.content || '';
    const hash = this.computeHash(text);
    norm.contentHash = hash;

    // Split text by sections, articles, or line paragraphs
    const paragraphs = text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (paragraphs.length === 0) {
      return [
        {
          chunkId: `chk-${norm.documentId}-0`,
          documentId: norm.documentId,
          docTitle: norm.title,
          pageNumber: 1,
          sectionTitle: 'General',
          text: norm.summary || norm.title,
          status: norm.status,
          officialSource: norm.officialSource,
        },
      ];
    }

    const chunks: NormChunk[] = [];
    let currentSection = 'General';

    paragraphs.forEach((paragraph, idx) => {
      // Check if paragraph is a section header (e.g. SECCIÓN, ARTÍCULO, REQUISITOS)
      if (/^(SECCIÓN|ARTÍCULO|CAPÍTULO|REQUISITOS|ART|TITULO)/i.test(paragraph)) {
        currentSection = paragraph.split('\n')[0].substring(0, 80);
      }

      chunks.push({
        chunkId: `chk-${norm.documentId}-${idx}`,
        documentId: norm.documentId,
        docTitle: norm.title,
        pageNumber: 1,
        sectionTitle: currentSection,
        text: paragraph,
        status: norm.status,
        officialSource: norm.officialSource,
      });
    });

    return chunks;
  }
}
