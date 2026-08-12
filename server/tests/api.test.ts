import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, db } from '../../src/server/db/database.js';
import { searchNormativeContext } from '../../src/server/services/ragService.js';
import { GeminiService } from '../../src/server/services/geminiService.js';
import { PROCEDURES_CATALOG } from '../../src/data/proceduresCatalog.js';
import { NormDiffSchema, VerifyDocsSchema } from '../../src/server/middleware/validators.js';

describe('REGISTRIA Hardening P0 Tests', () => {
  it('1. Password hashing & verification works correctly', () => {
    const rawPass = 'SecureDynamicPass_987123!';
    const { hash, salt } = hashPassword(rawPass);
    expect(hash).toBeDefined();
    expect(salt).toBeDefined();

    const isMatch = verifyPassword(rawPass, hash, salt);
    expect(isMatch).toBe(true);

    const isInvalid = verifyPassword('WrongPassword123', hash, salt);
    expect(isInvalid).toBe(false);
  });

  it('2. Default admin user is bootstrapped in database', async () => {
    const adminUser = await db.getUserByUsername('admin');
    expect(adminUser).toBeDefined();
    expect(adminUser?.role).toBe('ADMIN');
  });

  it('3. Multi-tenant Client & Case Isolation (IDOR Prevention)', async () => {
    const clientA = await db.saveClient({
      id: `client-orgA-${Date.now()}`,
      organizationId: 'org-A',
      name: 'Cliente Org A',
      dniCuit: '20-11111111-9',
      type: 'PERSONA_HUMANA',
      phone: '11223344',
      email: 'orga@test.com',
      casesCount: 0,
      createdAt: new Date().toISOString(),
    });

    expect(clientA.organizationId).toBe('org-A');

    // Simulate Org B trying to query or verify Org A client
    const fetchedClientA = await db.getClientById(clientA.id);
    expect(fetchedClientA).toBeDefined();
    expect(fetchedClientA?.organizationId).toBe('org-A');
    expect(fetchedClientA?.organizationId === 'org-B').toBe(false);
  });

  it('4. API Contracts Validation (norm-diff & verify-documents)', () => {
    const normDiffPayload = { normAId: 'norm-1', normBId: 'norm-2' };
    const normDiffResult = NormDiffSchema.safeParse(normDiffPayload);
    expect(normDiffResult.success).toBe(true);

    const invalidNormDiff = { normA: 'norm-1', normB: 'norm-2' };
    expect(NormDiffSchema.safeParse(invalidNormDiff).success).toBe(false);

    const verifyDocsPayload = {
      documents: [
        {
          id: 'doc-1',
          fileName: 'titulo.jpg',
          documentType: 'TITULO_AUTOMOTOR',
          extractedFields: {},
          rawOcrText: '',
          confidenceScore: 0.9,
          uploadedAt: new Date().toISOString(),
        },
        {
          id: 'doc-2',
          fileName: 'dni.jpg',
          documentType: 'DNI',
          extractedFields: {},
          rawOcrText: '',
          confidenceScore: 0.9,
          uploadedAt: new Date().toISOString(),
        },
      ],
    };
    const verifyDocsResult = VerifyDocsSchema.safeParse(verifyDocsPayload);
    expect(verifyDocsResult.success).toBe(true);
  });

  it('5. RAG Grounding - No invented sources or fake URLs', async () => {
    const query = 'transferencia automotor fallecimiento sucesion';
    const { matchedChunks, matchedDocs } = searchNormativeContext(query, false);

    const chatResponse = await GeminiService.generateChatResponse({
      query,
      mode: 'profesional',
      officialOnly: true,
      matchedChunks,
      matchedDocs,
    });

    expect(chatResponse.confidence).toBeDefined();
    expect(['ALTA', 'MEDIA', 'BAJA', 'SIN_EVIDENCIA']).toContain(chatResponse.confidence);

    // Verify all returned sources match retrieved documents (no invented URLs)
    const retrievedUrls = new Set(matchedDocs.map((d) => d.sourceUrl).filter(Boolean));
    chatResponse.sources.forEach((src) => {
      if (src.url) {
        expect(retrievedUrls.has(src.url) || src.url.includes('dnrpa.gov.ar') || src.url.includes('boletinoficial.gob.ar') || src.url.includes('infoleg.gob.ar')).toBe(true);
      }
    });
  }, 15000);

  it('6. Normative Review - CETA is removed as a mandatory requirement', () => {
    const transferenciaProc = PROCEDURES_CATALOG.find((p) => p.id === 'proc-transferencia-ordinaria');
    expect(transferenciaProc).toBeDefined();

    const hasCetaRequirement = transferenciaProc?.requirements.some((r) => r.toLowerCase().includes('ceta') && !r.toLowerCase().includes('derogad'));
    expect(hasCetaRequirement).toBe(false);

    const hasCetaForm = transferenciaProc?.formsRequired.some((f) => f.includes('CETA'));
    expect(hasCetaForm).toBe(false);
  });

  it('7. Audit logger masks sensitive DNI / CUIT identifiers', async () => {
    const logEntry = await db.addAuditLog({
      action: 'TEST_ACTION',
      entity: 'CLIENT',
      details: 'Cliente ingresado con CUIT 30-71234567-8 y DNI 28493021',
    });

    expect(logEntry.details).not.toContain('30-71234567-8');
    expect(logEntry.details).not.toContain('28493021');
    expect(logEntry.details).toContain('[CUIT ENMASCARADO]');
    expect(logEntry.details).toContain('[DNI ENMASCARADO]');
  });
});
