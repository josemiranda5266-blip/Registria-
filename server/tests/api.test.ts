import { describe, it, expect, beforeEach } from 'vitest';
import { hashPassword, verifyPassword, db } from '../../src/server/db/database.js';
import { searchNormativeContext } from '../../src/server/services/ragService.js';

describe('REGISTRIA Production API & Database Tests', () => {
  it('Password hashing & verification works correctly', () => {
    const rawPass = 'SecureDynamicPass_987123!';
    const { hash, salt } = hashPassword(rawPass);
    expect(hash).toBeDefined();
    expect(salt).toBeDefined();

    const isMatch = verifyPassword(rawPass, hash, salt);
    expect(isMatch).toBe(true);

    const isInvalid = verifyPassword('WrongPassword123', hash, salt);
    expect(isInvalid).toBe(false);
  });

  it('Default admin user is bootstrapped in database', () => {
    const adminUser = db.getUserByUsername('admin');
    expect(adminUser).toBeDefined();
    expect(adminUser?.role).toBe('ADMIN');
  });

  it('New users can be created dynamically with role permissions', () => {
    const created = db.createUser({
      username: 'test_mandatario',
      email: 'mandatario@test.gob.ar',
      name: 'Mandatario Test',
      role: 'MANDATARIO',
      password: 'DynamicPassword2026!',
    });

    expect(created.id).toBeDefined();
    expect(created.username).toBe('test_mandatario');
    expect(created.role).toBe('MANDATARIO');

    const fetched = db.getUserByUsername('test_mandatario');
    expect(fetched).toBeDefined();
    expect(verifyPassword('DynamicPassword2026!', fetched!.passwordHash, fetched!.salt)).toBe(true);
  });

  it('Session management generates valid tokens', () => {
    const adminUser = db.getUserByUsername('admin')!;
    const session = db.createSession(adminUser.id, adminUser.role);

    expect(session.token).toBeDefined();
    expect(session.role).toBe('ADMIN');

    const retrieved = db.getSessionByToken(session.token);
    expect(retrieved).toBeDefined();
    expect(retrieved?.user.username).toBe('admin');

    const deleted = db.deleteSession(session.token);
    expect(deleted).toBe(true);
    expect(db.getSessionByToken(session.token)).toBeUndefined();
  });

  it('RAG Search finds relevant normative documents without inventing content', () => {
    const searchResult = searchNormativeContext('fallecimiento sucesion herederos', true);
    expect(searchResult.matchedChunks.length).toBeGreaterThan(0);
    expect(searchResult.queryTerms).toContain('fallecimiento');

    const topChunk = searchResult.matchedChunks[0];
    expect(topChunk.officialSource).toBe(true);
  });

  it('Audit logger masks sensitive DNI / CUIT identifiers', () => {
    const logEntry = db.addAuditLog({
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
