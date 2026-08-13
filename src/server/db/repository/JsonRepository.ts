import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, UserRole, Client, ProcedureCase, NormDocument, NormChunk, AnalyzedDocument, AuditLogEntry } from '../../../types.js';
import { INITIAL_CLIENTS, INITIAL_CASES } from '../seedData.js';
import { INITIAL_NORMATIVE_LIBRARY } from '../../../data/normativeDatabase.js';
import { IRepository, UserRecord, SessionRecord } from './IRepository.js';
import { RagChunkerService } from '../../services/ragChunker.js';

interface DatabaseSchema {
  users: UserRecord[];
  sessions: SessionRecord[];
  clients: Client[];
  cases: ProcedureCase[];
  norms: NormDocument[];
  analyzedDocs: AnalyzedDocument[];
  auditLogs: AuditLogEntry[];
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'registria_db.json');
const DEFAULT_ORG_ID = 'org-registria-default';

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, actualSalt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt: actualSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const computed = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'));
}

export class JsonRepository implements IRepository {
  private data!: DatabaseSchema;

  async init(): Promise<void> {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_PATH)) {
      try {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        this.data = JSON.parse(raw);
        this.data.users = this.data.users || [];
        this.data.sessions = this.data.sessions || [];
        this.data.clients = this.data.clients || [];
        this.data.cases = this.data.cases || [];
        this.data.norms = this.data.norms || [];
        this.data.analyzedDocs = this.data.analyzedDocs || [];
        this.data.auditLogs = this.data.auditLogs || [];

        if (this.data.users.length === 0) {
          await this.seedInitialData();
        }
      } catch (err) {
        console.error('[JsonRepository] Error leyendo JSON database:', err);
        await this.seedInitialData();
      }
    } else {
      await this.seedInitialData();
    }
  }

  private async seedInitialData(): Promise<void> {
    const adminUsername = process.env.ADMIN_INITIAL_USERNAME || 'admin';
    const adminEmail = process.env.ADMIN_INITIAL_EMAIL || 'admin@registria.gob.ar';
    const envAdminPassword = process.env.ADMIN_INITIAL_PASSWORD;

    if (!envAdminPassword) {
      console.error('[CONFIG ERROR] La variable de entorno ADMIN_INITIAL_PASSWORD es requerida para crear el administrador inicial.');
      throw new Error('ADMIN_INITIAL_PASSWORD environment variable is required to create initial admin user.');
    }

    const adminPass = hashPassword(envAdminPassword);

    const initialAdmin: UserRecord = {
      id: 'usr-admin-1',
      username: adminUsername,
      email: adminEmail,
      name: 'Administrador Principal',
      role: 'ADMIN',
      organizationId: DEFAULT_ORG_ID,
      createdAt: new Date().toISOString(),
      active: true,
      passwordHash: adminPass.hash,
      salt: adminPass.salt,
      mustChangePassword: false,
    };

    // Hydrate default clients & cases with organizationId
    const seededClients = INITIAL_CLIENTS.map((c) => ({
      ...c,
      organizationId: DEFAULT_ORG_ID,
      createdBy: 'usr-admin-1',
    }));

    const seededCases = INITIAL_CASES.map((c) => ({
      ...c,
      organizationId: DEFAULT_ORG_ID,
      createdBy: 'usr-admin-1',
    }));

    this.data = {
      users: [initialAdmin],
      sessions: [],
      clients: seededClients,
      cases: seededCases,
      norms: INITIAL_NORMATIVE_LIBRARY,
      analyzedDocs: [],
      auditLogs: [
        {
          id: 'log-boot',
          timestamp: new Date().toISOString(),
          userId: initialAdmin.id,
          username: initialAdmin.username,
          userRole: 'ADMIN',
          action: 'BOOTSTRAP',
          entity: 'SYSTEM',
          details: `Sistema inicializado con usuario administrador (${adminUsername})`,
        },
      ],
    };

    this.saveSync();
  }

  private saveSync() {
    try {
      const tempPath = `${DB_PATH}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_PATH);
    } catch (err) {
      console.error('[JsonRepository] Error guardando JSON:', err);
    }
  }

  // --- Users ---
  async getUsers(): Promise<User[]> {
    return this.data.users.map(({ passwordHash, salt, ...u }) => u);
  }

  async getUserById(id: string): Promise<UserRecord | undefined> {
    return this.data.users.find((u) => u.id === id);
  }

  async getUserByUsername(username: string): Promise<UserRecord | undefined> {
    return this.data.users.find((u) => u.username.toLowerCase() === username.toLowerCase() && u.active);
  }

  async createUser(userData: { username: string; email: string; name: string; role: UserRole; password: string; organizationId?: string }): Promise<User> {
    const existing = await this.getUserByUsername(userData.username);
    if (existing) throw new Error(`El usuario ${userData.username} ya existe.`);

    const { hash, salt } = hashPassword(userData.password);
    const newUser: UserRecord = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      username: userData.username,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      organizationId: userData.organizationId || DEFAULT_ORG_ID,
      createdAt: new Date().toISOString(),
      active: true,
      passwordHash: hash,
      salt,
    };

    this.data.users.push(newUser);
    this.saveSync();
    const { passwordHash, salt: s, ...safe } = newUser;
    return safe;
  }

  async updateUserRole(id: string, newRole: UserRole): Promise<User> {
    const user = this.data.users.find((u) => u.id === id);
    if (!user) throw new Error('Usuario no encontrado');
    user.role = newRole;
    this.saveSync();
    const { passwordHash, salt, ...safe } = user;
    return safe;
  }

  async updateUserPassword(id: string, newPasswordHash: string, newSalt: string): Promise<void> {
    const user = this.data.users.find((u) => u.id === id);
    if (!user) throw new Error('Usuario no encontrado');
    user.passwordHash = newPasswordHash;
    user.salt = newSalt;
    user.mustChangePassword = false;
    this.saveSync();
  }

  // --- Sessions ---
  async createSession(userId: string, role: UserRole): Promise<{ session: SessionRecord; rawToken: string }> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const session: SessionRecord = {
      id: `sess-${Date.now()}`,
      userId,
      tokenHash,
      role,
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    this.data.sessions.push(session);
    this.saveSync();
    return { session, rawToken };
  }

  async getSessionByToken(rawToken: string): Promise<(SessionRecord & { user: User }) | undefined> {
    if (!rawToken) return undefined;
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const session = this.data.sessions.find((s) => s.tokenHash === tokenHash);
    if (!session) return undefined;

    if (new Date(session.expiresAt) <= new Date()) {
      this.data.sessions = this.data.sessions.filter((s) => s.tokenHash !== tokenHash);
      this.saveSync();
      return undefined;
    }

    const userRecord = await this.getUserById(session.userId);
    if (!userRecord || !userRecord.active) return undefined;

    const { passwordHash, salt, ...safeUser } = userRecord;
    return { ...session, user: safeUser };
  }

  async deleteSessionByToken(rawToken: string): Promise<boolean> {
    if (!rawToken) return false;
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const initial = this.data.sessions.length;
    this.data.sessions = this.data.sessions.filter((s) => s.tokenHash !== tokenHash);
    this.saveSync();
    return this.data.sessions.length < initial;
  }

  async deleteSessionsForUser(userId: string): Promise<void> {
    this.data.sessions = this.data.sessions.filter((s) => s.userId !== userId);
    this.saveSync();
  }

  // --- Clients ---
  async getClients(organizationId?: string, createdBy?: string): Promise<Client[]> {
    let result = this.data.clients;
    if (organizationId) {
      result = result.filter((c) => !c.organizationId || c.organizationId === organizationId);
    }
    if (createdBy) {
      result = result.filter((c) => !c.createdBy || c.createdBy === createdBy);
    }
    return result;
  }

  async getClientById(id: string, organizationId?: string): Promise<Client | undefined> {
    const client = this.data.clients.find((c) => c.id === id);
    if (!client) return undefined;
    if (organizationId && client.organizationId && client.organizationId !== organizationId) {
      return undefined;
    }
    return client;
  }

  async saveClient(client: Client): Promise<Client> {
    const idx = this.data.clients.findIndex((c) => c.id === client.id);
    if (idx >= 0) {
      this.data.clients[idx] = client;
    } else {
      this.data.clients.unshift(client);
    }
    this.saveSync();
    return client;
  }

  async deleteClient(id: string, organizationId?: string): Promise<boolean> {
    const initial = this.data.clients.length;
    this.data.clients = this.data.clients.filter((c) => c.id !== id || (organizationId && c.organizationId !== organizationId));
    this.saveSync();
    return this.data.clients.length < initial;
  }

  // --- Cases ---
  async getCases(organizationId?: string, assignedTo?: string): Promise<ProcedureCase[]> {
    let result = this.data.cases;
    if (organizationId) {
      result = result.filter((c) => !c.organizationId || c.organizationId === organizationId);
    }
    if (assignedTo) {
      result = result.filter((c) => !c.assignedTo || c.assignedTo === assignedTo || c.createdBy === assignedTo);
    }
    return result;
  }

  async getCaseById(id: string, organizationId?: string): Promise<ProcedureCase | undefined> {
    const procedureCase = this.data.cases.find((c) => c.id === id);
    if (!procedureCase) return undefined;
    if (organizationId && procedureCase.organizationId && procedureCase.organizationId !== organizationId) {
      return undefined;
    }
    return procedureCase;
  }

  async saveCase(procedureCase: ProcedureCase): Promise<ProcedureCase> {
    const idx = this.data.cases.findIndex((c) => c.id === procedureCase.id);
    const updated = { ...procedureCase, updatedAt: new Date().toISOString().split('T')[0] };
    if (idx >= 0) {
      this.data.cases[idx] = updated;
    } else {
      this.data.cases.unshift(updated);
    }
    this.saveSync();
    return updated;
  }

  async deleteCase(id: string, organizationId?: string): Promise<boolean> {
    const initial = this.data.cases.length;
    this.data.cases = this.data.cases.filter((c) => c.id !== id || (organizationId && c.organizationId !== organizationId));
    this.saveSync();
    return this.data.cases.length < initial;
  }

  // --- Norms ---
  async getNorms(): Promise<NormDocument[]> {
    return this.data.norms;
  }

  async getNormById(documentId: string): Promise<NormDocument | undefined> {
    return this.data.norms.find((n) => n.documentId === documentId);
  }

  async saveNorm(norm: NormDocument): Promise<NormDocument> {
    const idx = this.data.norms.findIndex((n) => n.documentId === norm.documentId);
    if (idx >= 0) {
      this.data.norms[idx] = norm;
    } else {
      this.data.norms.unshift(norm);
    }
    this.saveSync();
    return norm;
  }

  async getNormChunks(): Promise<NormChunk[]> {
    return this.data.norms.flatMap((doc) => RagChunkerService.generateChunksFromDocument(doc));
  }

  // --- Analyzed Docs ---
  async getAnalyzedDocs(organizationId?: string): Promise<AnalyzedDocument[]> {
    if (organizationId) {
      return this.data.analyzedDocs.filter((d) => !d.organizationId || d.organizationId === organizationId);
    }
    return this.data.analyzedDocs;
  }

  async saveAnalyzedDoc(doc: AnalyzedDocument): Promise<AnalyzedDocument> {
    this.data.analyzedDocs.unshift(doc);
    this.saveSync();
    return doc;
  }

  // --- Audit Logs ---
  async addAuditLog(log: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
    let maskedDetails = log.details || '';
    maskedDetails = maskedDetails.replace(/\b\d{2}-\d{8}-\d\b/g, '[CUIT ENMASCARADO]');
    maskedDetails = maskedDetails.replace(/\b\d{7,8}\b/g, '[DNI ENMASCARADO]');

    const entry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...log,
      details: maskedDetails,
    };

    this.data.auditLogs.unshift(entry);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    this.saveSync();
    return entry;
  }

  async getAuditLogs(): Promise<AuditLogEntry[]> {
    return this.data.auditLogs;
  }

  // Atomic transaction support
  async executeInTransaction<T>(work: (repo: IRepository) => Promise<T>): Promise<T> {
    return work(this);
  }
}
