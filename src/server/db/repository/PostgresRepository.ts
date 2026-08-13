import pkg from 'pg';
const { Pool } = pkg;
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { User, UserRole, Client, ProcedureCase, NormDocument, NormChunk, AnalyzedDocument, AuditLogEntry } from '../../../types.js';
import { IRepository, UserRecord, SessionRecord } from './IRepository.js';
import { hashPassword } from './JsonRepository.js';
import { RagChunkerService } from '../../services/ragChunker.js';

const DEFAULT_ORG_ID = 'org-registria-default';

function getSSLConfig(): boolean | { rejectUnauthorized: boolean; ca?: string } {
  const dbSsl = process.env.DATABASE_SSL;
  if (dbSsl === 'false') {
    return false;
  }
  if (dbSsl === 'true' || process.env.NODE_ENV === 'production') {
    const rejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'false' ? false : true;
    const ca = process.env.DATABASE_CA;
    return {
      rejectUnauthorized,
      ...(ca ? { ca } : {}),
    };
  }
  return false;
}

export class PostgresRepository implements IRepository {
  private pool: any;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: getSSLConfig(),
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }

  private async runMigrations(client: any): Promise<void> {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(64) PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const res = await client.query('SELECT version FROM schema_migrations');
    const appliedVersions = new Set<string>(res.rows.map((r: any) => r.version));

    const migrationsDir = path.join(process.cwd(), 'migrations');
    if (!fs.existsSync(migrationsDir)) return;

    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (appliedVersions.has(file)) {
        continue;
      }

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`[Migrations] Ejecutando migración pendiente: ${file}`);
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`[Migrations] Migración ${file} ejecutada exitosamente.`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[Migrations Error] Fallo al ejecutar migración ${file}:`, err);
        throw err;
      }
    }
  }

  async init(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await this.runMigrations(client);

      // Ensure Admin exists
      const adminUsername = process.env.ADMIN_INITIAL_USERNAME || 'admin';
      const adminEmail = process.env.ADMIN_INITIAL_EMAIL || 'admin@registria.gob.ar';
      const envAdminPassword = process.env.ADMIN_INITIAL_PASSWORD;

      const checkAdmin = await client.query('SELECT id FROM users WHERE username = $1', [adminUsername]);
      if (checkAdmin.rows.length === 0) {
        if (!envAdminPassword) {
          console.error('[CONFIG ERROR] La variable de entorno ADMIN_INITIAL_PASSWORD es requerida para crear el administrador inicial.');
          throw new Error('ADMIN_INITIAL_PASSWORD environment variable is required to create initial admin user.');
        }
        const adminPass = hashPassword(envAdminPassword);
        await client.query(
          `INSERT INTO users (id, username, email, name, role, organization_id, password_hash, salt, must_change_password)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            'usr-admin-pg',
            adminUsername,
            adminEmail,
            'Administrador Principal',
            'ADMIN',
            DEFAULT_ORG_ID,
            adminPass.hash,
            adminPass.salt,
            false,
          ]
        );
      }
    } catch (err) {
      console.error('[PostgresRepository] Error durante la inicialización:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  // --- Users ---
  async getUsers(): Promise<User[]> {
    const res = await this.pool.query(
      'SELECT id, username, email, name, role, organization_id AS "organizationId", created_at AS "createdAt", last_login AS "lastLogin", active FROM users'
    );
    return res.rows;
  }

  async getUserById(id: string): Promise<UserRecord | undefined> {
    const res = await this.pool.query(
      'SELECT id, username, email, name, role, organization_id AS "organizationId", password_hash AS "passwordHash", salt, must_change_password AS "mustChangePassword", created_at AS "createdAt", active FROM users WHERE id = $1',
      [id]
    );
    return res.rows[0];
  }

  async getUserByUsername(username: string): Promise<UserRecord | undefined> {
    const res = await this.pool.query(
      'SELECT id, username, email, name, role, organization_id AS "organizationId", password_hash AS "passwordHash", salt, must_change_password AS "mustChangePassword", created_at AS "createdAt", active FROM users WHERE LOWER(username) = LOWER($1) AND active = TRUE',
      [username]
    );
    return res.rows[0];
  }

  async createUser(userData: { username: string; email: string; name: string; role: UserRole; password: string; organizationId?: string }): Promise<User> {
    const { hash, salt } = hashPassword(userData.password);
    const id = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const orgId = userData.organizationId || DEFAULT_ORG_ID;

    const res = await this.pool.query(
      `INSERT INTO users (id, username, email, name, role, organization_id, password_hash, salt, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
       RETURNING id, username, email, name, role, organization_id AS "organizationId", created_at AS "createdAt", active`,
      [id, userData.username, userData.email, userData.name, userData.role, orgId, hash, salt]
    );
    return res.rows[0];
  }

  async updateUserRole(id: string, newRole: UserRole): Promise<User> {
    const res = await this.pool.query(
      `UPDATE users SET role = $1 WHERE id = $2
       RETURNING id, username, email, name, role, organization_id AS "organizationId", created_at AS "createdAt", active`,
      [newRole, id]
    );
    return res.rows[0];
  }

  async updateUserPassword(id: string, newPasswordHash: string, newSalt: string): Promise<void> {
    await this.pool.query(
      'UPDATE users SET password_hash = $1, salt = $2, must_change_password = FALSE WHERE id = $3',
      [newPasswordHash, newSalt, id]
    );
  }

  // --- Sessions ---
  async createSession(userId: string, role: UserRole): Promise<{ session: SessionRecord; rawToken: string }> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const id = `sess-${Date.now()}`;

    await this.pool.query(
      'INSERT INTO sessions (id, user_id, token_hash, role, expires_at) VALUES ($1, $2, $3, $4, $5)',
      [id, userId, tokenHash, role, expiresAt]
    );

    return {
      session: {
        id,
        userId,
        tokenHash,
        role,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
      rawToken,
    };
  }

  async getSessionByToken(rawToken: string): Promise<(SessionRecord & { user: User }) | undefined> {
    if (!rawToken) return undefined;
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const res = await this.pool.query(
      `SELECT s.id, s.user_id AS "userId", s.token_hash AS "tokenHash", s.role, s.created_at AS "createdAt", s.expires_at AS "expiresAt",
              u.id AS "u_id", u.username, u.email, u.name, u.role AS "u_role", u.organization_id AS "organizationId", u.created_at AS "u_createdAt", u.active
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token_hash = $1 AND s.expires_at > NOW() AND u.active = TRUE`,
      [tokenHash]
    );

    if (res.rows.length === 0) return undefined;
    const row = res.rows[0];
    return {
      id: row.id,
      userId: row.userId,
      tokenHash: row.tokenHash,
      role: row.role,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      user: {
        id: row.u_id,
        username: row.username,
        email: row.email,
        name: row.name,
        role: row.u_role,
        organizationId: row.organizationId,
        createdAt: row.u_createdAt,
        active: row.active,
      },
    };
  }

  async deleteSessionByToken(rawToken: string): Promise<boolean> {
    if (!rawToken) return false;
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const res = await this.pool.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash]);
    return res.rowCount > 0;
  }

  async deleteSessionsForUser(userId: string): Promise<void> {
    await this.pool.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
  }

  // --- Clients ---
  async getClients(organizationId?: string, createdBy?: string): Promise<Client[]> {
    let sql = 'SELECT id, organization_id AS "organizationId", created_by AS "createdBy", name, dni_cuit AS "dniCuit", type, phone, email, address, notes, cases_count AS "casesCount", created_at AS "createdAt" FROM clients WHERE 1=1';
    const params: any[] = [];
    if (organizationId) {
      params.push(organizationId);
      sql += ` AND organization_id = $${params.length}`;
    }
    if (createdBy) {
      params.push(createdBy);
      sql += ` AND created_by = $${params.length}`;
    }
    sql += ' ORDER BY created_at DESC';
    const res = await this.pool.query(sql, params);
    return res.rows;
  }

  async getClientById(id: string): Promise<Client | undefined> {
    const res = await this.pool.query(
      'SELECT id, organization_id AS "organizationId", created_by AS "createdBy", name, dni_cuit AS "dniCuit", type, phone, email, address, notes, cases_count AS "casesCount", created_at AS "createdAt" FROM clients WHERE id = $1',
      [id]
    );
    return res.rows[0];
  }

  async saveClient(client: Client): Promise<Client> {
    const orgId = client.organizationId || DEFAULT_ORG_ID;
    const res = await this.pool.query(
      `INSERT INTO clients (id, organization_id, created_by, name, dni_cuit, type, phone, email, address, notes, cases_count, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         dni_cuit = EXCLUDED.dni_cuit,
         type = EXCLUDED.type,
         phone = EXCLUDED.phone,
         email = EXCLUDED.email,
         address = EXCLUDED.address,
         notes = EXCLUDED.notes,
         cases_count = EXCLUDED.cases_count
       RETURNING id, organization_id AS "organizationId", created_by AS "createdBy", name, dni_cuit AS "dniCuit", type, phone, email, address, notes, cases_count AS "casesCount", created_at AS "createdAt"`,
      [
        client.id,
        orgId,
        client.createdBy || null,
        client.name,
        client.dniCuit,
        client.type,
        client.phone || null,
        client.email || null,
        client.address || null,
        client.notes || null,
        client.casesCount || 0,
        client.createdAt || new Date().toISOString(),
      ]
    );
    return res.rows[0];
  }

  async deleteClient(id: string, organizationId?: string): Promise<boolean> {
    let sql = 'DELETE FROM clients WHERE id = $1';
    const params: any[] = [id];
    if (organizationId) {
      params.push(organizationId);
      sql += ' AND organization_id = $2';
    }
    const res = await this.pool.query(sql, params);
    return res.rowCount > 0;
  }

  // --- Cases ---
  async getCases(organizationId?: string, assignedTo?: string): Promise<ProcedureCase[]> {
    let sql = `SELECT id, organization_id AS "organizationId", created_by AS "createdBy", assigned_to AS "assignedTo",
                      case_number AS "caseNumber", title, client_id AS "clientId", client_name AS "clientName",
                      client_dni_cuit AS "clientDniCuit", vehicle_domain AS "vehicleDomain", vehicle_brand_model AS "vehicleBrandModel",
                      procedure_id AS "procedureId", procedure_title AS "procedureTitle", status, checklist,
                      uploaded_docs AS "uploadedDocs", notes, turns_date AS "turnsDate", fees_amount AS "feesAmount",
                      fees_paid AS "feesPaid", created_at AS "createdAt", updated_at AS "updatedAt"
               FROM cases WHERE 1=1`;
    const params: any[] = [];
    if (organizationId) {
      params.push(organizationId);
      sql += ` AND organization_id = $${params.length}`;
    }
    if (assignedTo) {
      params.push(assignedTo);
      sql += ` AND (assigned_to = $${params.length} OR created_by = $${params.length})`;
    }
    sql += ' ORDER BY updated_at DESC';
    const res = await this.pool.query(sql, params);
    return res.rows.map((r: any) => ({
      ...r,
      feesAmount: Number(r.feesAmount || 0),
    }));
  }

  async getCaseById(id: string): Promise<ProcedureCase | undefined> {
    const res = await this.pool.query('SELECT * FROM cases WHERE id = $1', [id]);
    if (res.rows.length === 0) return undefined;
    const r = res.rows[0];
    return {
      id: r.id,
      organizationId: r.organization_id,
      createdBy: r.created_by,
      assignedTo: r.assigned_to,
      caseNumber: r.case_number,
      title: r.title,
      clientId: r.client_id,
      clientName: r.client_name,
      clientDniCuit: r.client_dni_cuit,
      vehicleDomain: r.vehicle_domain,
      vehicleBrandModel: r.vehicle_brand_model,
      procedureId: r.procedure_id,
      procedureTitle: r.procedure_title,
      status: r.status,
      checklist: r.checklist || [],
      uploadedDocs: r.uploaded_docs || [],
      notes: r.notes || [],
      turnsDate: r.turns_date,
      feesAmount: Number(r.fees_amount || 0),
      feesPaid: r.fees_paid,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  async saveCase(procedureCase: ProcedureCase): Promise<ProcedureCase> {
    const orgId = procedureCase.organizationId || DEFAULT_ORG_ID;
    const updatedAt = new Date().toISOString();

    const res = await this.pool.query(
      `INSERT INTO cases (id, organization_id, created_by, assigned_to, case_number, title, client_id, client_name, client_dni_cuit, vehicle_domain, vehicle_brand_model, procedure_id, procedure_title, status, checklist, uploaded_docs, notes, turns_date, fees_amount, fees_paid, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         checklist = EXCLUDED.checklist,
         uploaded_docs = EXCLUDED.uploaded_docs,
         notes = EXCLUDED.notes,
         turns_date = EXCLUDED.turns_date,
         fees_amount = EXCLUDED.fees_amount,
         fees_paid = EXCLUDED.fees_paid,
         updated_at = EXCLUDED.updated_at
       RETURNING id`,
      [
        procedureCase.id,
        orgId,
        procedureCase.createdBy || null,
        procedureCase.assignedTo || null,
        procedureCase.caseNumber,
        procedureCase.title,
        procedureCase.clientId,
        procedureCase.clientName,
        procedureCase.clientDniCuit,
        procedureCase.vehicleDomain,
        procedureCase.vehicleBrandModel,
        procedureCase.procedureId,
        procedureCase.procedureTitle,
        procedureCase.status,
        JSON.stringify(procedureCase.checklist || []),
        JSON.stringify(procedureCase.uploadedDocs || []),
        JSON.stringify(procedureCase.notes || []),
        procedureCase.turnsDate || null,
        procedureCase.feesAmount || 0,
        procedureCase.feesPaid || false,
        procedureCase.createdAt || new Date().toISOString(),
        updatedAt,
      ]
    );

    return { ...procedureCase, updatedAt };
  }

  async deleteCase(id: string, organizationId?: string): Promise<boolean> {
    let sql = 'DELETE FROM cases WHERE id = $1';
    const params: any[] = [id];
    if (organizationId) {
      params.push(organizationId);
      sql += ' AND organization_id = $2';
    }
    const res = await this.pool.query(sql, params);
    return res.rowCount > 0;
  }

  // --- Norms ---
  async getNorms(): Promise<NormDocument[]> {
    const res = await this.pool.query('SELECT * FROM norms ORDER BY year DESC');
    return res.rows.map((r: any) => ({
      documentId: r.document_id,
      title: r.title,
      documentType: r.document_type,
      issuingAuthority: r.issuing_authority,
      number: r.number,
      year: r.year,
      publicationDate: r.publication_date,
      effectiveDate: r.effective_date,
      status: r.status,
      topics: r.topics || [],
      subtopics: r.subtopics || [],
      vehicleTypes: r.vehicle_types || [],
      sourceUrl: r.source_url,
      officialSource: r.official_source,
      content: r.content,
      contentHash: r.content_hash,
      uploadedAt: r.uploaded_at,
      version: r.version,
      summary: r.summary,
    }));
  }

  async getNormById(documentId: string): Promise<NormDocument | undefined> {
    const res = await this.pool.query('SELECT * FROM norms WHERE document_id = $1', [documentId]);
    if (res.rows.length === 0) return undefined;
    const r = res.rows[0];
    return {
      documentId: r.document_id,
      title: r.title,
      documentType: r.document_type,
      issuingAuthority: r.issuing_authority,
      number: r.number,
      year: r.year,
      publicationDate: r.publication_date,
      effectiveDate: r.effective_date,
      status: r.status,
      topics: r.topics || [],
      subtopics: r.subtopics || [],
      vehicleTypes: r.vehicle_types || [],
      sourceUrl: r.source_url,
      officialSource: r.official_source,
      content: r.content,
      contentHash: r.content_hash,
      uploadedAt: r.uploaded_at,
      version: r.version,
      summary: r.summary,
    };
  }

  async saveNorm(norm: NormDocument): Promise<NormDocument> {
    await this.pool.query(
      `INSERT INTO norms (document_id, title, document_type, issuing_authority, number, year, publication_date, effective_date, status, topics, subtopics, vehicle_types, source_url, official_source, content, content_hash, version, summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       ON CONFLICT (document_id) DO UPDATE SET
         title = EXCLUDED.title,
         status = EXCLUDED.status,
         content = EXCLUDED.content,
         content_hash = EXCLUDED.content_hash,
         summary = EXCLUDED.summary`,
      [
        norm.documentId,
        norm.title,
        norm.documentType,
        norm.issuingAuthority,
        norm.number,
        norm.year,
        norm.publicationDate,
        norm.effectiveDate,
        norm.status,
        JSON.stringify(norm.topics || []),
        JSON.stringify(norm.subtopics || []),
        JSON.stringify(norm.vehicleTypes || []),
        norm.sourceUrl || null,
        norm.officialSource,
        norm.content,
        norm.contentHash || crypto.createHash('sha256').update(norm.content).digest('hex'),
        norm.version || '1.0',
        norm.summary || null,
      ]
    );
    return norm;
  }

  async getNormChunks(): Promise<NormChunk[]> {
    const norms = await this.getNorms();
    return norms.flatMap((norm) => RagChunkerService.generateChunksFromDocument(norm));
  }

  // --- Analyzed Docs ---
  async getAnalyzedDocs(organizationId?: string): Promise<AnalyzedDocument[]> {
    let sql = 'SELECT id, organization_id AS "organizationId", uploaded_by AS "uploadedBy", file_name AS "fileName", document_type AS "documentType", extracted_fields AS "extractedFields", raw_ocr_text AS "rawOcrText", confidence_score AS "confidenceScore", uploaded_at AS "uploadedAt" FROM analyzed_docs WHERE 1=1';
    const params: any[] = [];
    if (organizationId) {
      params.push(organizationId);
      sql += ` AND organization_id = $${params.length}`;
    }
    sql += ' ORDER BY uploaded_at DESC';
    const res = await this.pool.query(sql, params);
    return res.rows.map((r: any) => ({
      ...r,
      confidenceScore: Number(r.confidenceScore || 0),
    }));
  }

  async saveAnalyzedDoc(doc: AnalyzedDocument): Promise<AnalyzedDocument> {
    const orgId = doc.organizationId || DEFAULT_ORG_ID;
    await this.pool.query(
      `INSERT INTO analyzed_docs (id, organization_id, uploaded_by, file_name, document_type, extracted_fields, raw_ocr_text, confidence_score, uploaded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        doc.id,
        orgId,
        doc.uploadedBy || null,
        doc.fileName,
        doc.documentType,
        JSON.stringify(doc.extractedFields || {}),
        doc.rawOcrText || '',
        doc.confidenceScore || 0,
        doc.uploadedAt || new Date().toISOString(),
      ]
    );
    return doc;
  }

  // --- Audit Logs ---
  async addAuditLog(log: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
    let maskedDetails = log.details || '';
    maskedDetails = maskedDetails.replace(/\b\d{2}-\d{8}-\d\b/g, '[CUIT ENMASCARADO]');
    maskedDetails = maskedDetails.replace(/\b\d{7,8}\b/g, '[DNI ENMASCARADO]');

    const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toISOString();

    await this.pool.query(
      `INSERT INTO audit_logs (id, timestamp, user_id, username, user_role, action, entity, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        timestamp,
        log.userId || null,
        log.username || null,
        log.userRole || null,
        log.action,
        log.entity,
        log.entityId || null,
        maskedDetails,
        log.ipAddress || null,
      ]
    );

    return { id, timestamp, ...log, details: maskedDetails };
  }

  async getAuditLogs(): Promise<AuditLogEntry[]> {
    const res = await this.pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 500');
    return res.rows.map((r: any) => ({
      id: r.id,
      timestamp: r.timestamp,
      userId: r.user_id,
      username: r.username,
      userRole: r.user_role,
      action: r.action,
      entity: r.entity,
      entityId: r.entity_id,
      details: r.details,
      ipAddress: r.ip_address,
    }));
  }

  // Transactions
  async executeInTransaction<T>(work: (repo: IRepository) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(this);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
