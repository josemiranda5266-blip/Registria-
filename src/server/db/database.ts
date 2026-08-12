import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, UserRole, Client, ProcedureCase, NormDocument, AnalyzedDocument, AuditLogEntry } from '../../types.js';
import { INITIAL_CLIENTS, INITIAL_CASES } from '../../lib/storage.js';
import { INITIAL_NORMATIVE_LIBRARY } from '../../data/normativeDatabase.js';

export interface UserRecord extends User {
  passwordHash: string;
  salt: string;
}

export interface SessionRecord {
  id: string;
  userId: string;
  token: string;
  role: UserRole;
  createdAt: string;
  expiresAt: string;
}

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

// Password Hashing Helper
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, actualSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: actualSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const computed = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
}

class DatabaseService {
  private data!: DatabaseSchema;

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_PATH)) {
      try {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure all arrays exist
        this.data.users = this.data.users || [];
        this.data.sessions = this.data.sessions || [];
        this.data.clients = this.data.clients || [];
        this.data.cases = this.data.cases || [];
        this.data.norms = this.data.norms || [];
        this.data.analyzedDocs = this.data.analyzedDocs || [];
        this.data.auditLogs = this.data.auditLogs || [];
      } catch (err) {
        console.error('[DB] Error leyendo base de datos, re-inicializando:', err);
        this.seedInitialData();
      }
    } else {
      this.seedInitialData();
    }
  }

  private seedInitialData() {
    console.log('[DB] Inicializando esquema y datos de semilla en backend...');
    
    // Seed Users
    const seedPass = 'Registria2026!';
    const adminPass = hashPassword(seedPass);
    const mandatarioPass = hashPassword(seedPass);
    const asistentePass = hashPassword(seedPass);
    const consultaPass = hashPassword(seedPass);

    const initialUsers: UserRecord[] = [
      {
        id: 'usr-admin',
        username: 'admin',
        email: 'admin@registria.gob.ar',
        name: 'Administrador General',
        role: 'ADMIN',
        createdAt: '2026-01-01T00:00:00.000Z',
        active: true,
        passwordHash: adminPass.hash,
        salt: adminPass.salt,
      },
      {
        id: 'usr-mandatario',
        username: 'mandatario',
        email: 'varela@registria.gob.ar',
        name: 'Mandatario Registral Varela',
        role: 'MANDATARIO',
        createdAt: '2026-01-10T00:00:00.000Z',
        active: true,
        passwordHash: mandatarioPass.hash,
        salt: mandatarioPass.salt,
      },
      {
        id: 'usr-asistente',
        username: 'asistente',
        email: 'asistente@registria.gob.ar',
        name: 'Asistente Gómez',
        role: 'ASISTENTE',
        createdAt: '2026-02-01T00:00:00.000Z',
        active: true,
        passwordHash: asistentePass.hash,
        salt: asistentePass.salt,
      },
      {
        id: 'usr-consulta',
        username: 'consulta',
        email: 'consulta@registria.gob.ar',
        name: 'Usuario Lector / Consulta',
        role: 'CONSULTA',
        createdAt: '2026-02-15T00:00:00.000Z',
        active: true,
        passwordHash: consultaPass.hash,
        salt: consultaPass.salt,
      },
    ];

    this.data = {
      users: initialUsers,
      sessions: [],
      clients: INITIAL_CLIENTS,
      cases: INITIAL_CASES,
      norms: INITIAL_NORMATIVE_LIBRARY,
      analyzedDocs: [],
      auditLogs: [
        {
          id: 'log-init',
          timestamp: new Date().toISOString(),
          userId: 'usr-admin',
          username: 'admin',
          userRole: 'ADMIN',
          action: 'SEED_DATABASE',
          entity: 'SYSTEM',
          details: 'Base de datos inicializada correctamente con cuentas por defecto.',
        },
      ],
    };

    this.save();
  }

  private save() {
    try {
      const tempPath = `${DB_PATH}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_PATH);
    } catch (err) {
      console.error('[DB] Error guardando base de datos:', err);
    }
  }

  // --- Users ---
  getUsers(): User[] {
    return this.data.users.map(({ passwordHash, salt, ...user }) => user);
  }

  getUserById(id: string): UserRecord | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  getUserByUsername(username: string): UserRecord | undefined {
    return this.data.users.find((u) => u.username.toLowerCase() === username.toLowerCase() && u.active);
  }

  createUser(userData: { username: string; email: string; name: string; role: UserRole; password: string }): User {
    const existing = this.getUserByUsername(userData.username);
    if (existing) {
      throw new Error(`El usuario '${userData.username}' ya existe.`);
    }

    const { hash, salt } = hashPassword(userData.password);
    const newUser: UserRecord = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      username: userData.username,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      createdAt: new Date().toISOString(),
      active: true,
      passwordHash: hash,
      salt,
    };

    this.data.users.push(newUser);
    this.save();

    const { passwordHash, salt: s, ...safeUser } = newUser;
    return safeUser;
  }

  updateUserRole(id: string, newRole: UserRole): User {
    const user = this.data.users.find((u) => u.id === id);
    if (!user) throw new Error('Usuario no encontrado');
    user.role = newRole;
    this.save();
    const { passwordHash, salt, ...safeUser } = user;
    return safeUser;
  }

  // --- Sessions ---
  createSession(userId: string, role: UserRole): SessionRecord {
    // Clean old expired sessions
    const now = new Date();
    this.data.sessions = this.data.sessions.filter((s) => new Date(s.expiresAt) > now);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

    const session: SessionRecord = {
      id: `sess-${Date.now()}`,
      userId,
      token,
      role,
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    this.data.sessions.push(session);
    this.save();
    return session;
  }

  getSessionByToken(token: string): (SessionRecord & { user: User }) | undefined {
    const session = this.data.sessions.find((s) => s.token === token);
    if (!session) return undefined;

    if (new Date(session.expiresAt) <= new Date()) {
      // Expired
      this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
      this.save();
      return undefined;
    }

    const userRecord = this.getUserById(session.userId);
    if (!userRecord || !userRecord.active) return undefined;

    const { passwordHash, salt, ...safeUser } = userRecord;
    return { ...session, user: safeUser };
  }

  deleteSession(token: string): boolean {
    const initialLen = this.data.sessions.length;
    this.data.sessions = this.data.sessions.filter((s) => s.token !== token);
    this.save();
    return this.data.sessions.length < initialLen;
  }

  // --- Clients ---
  getClients(): Client[] {
    return this.data.clients;
  }

  saveClient(client: Client): Client {
    const idx = this.data.clients.findIndex((c) => c.id === client.id);
    if (idx >= 0) {
      this.data.clients[idx] = client;
    } else {
      this.data.clients.unshift(client);
    }
    this.save();
    return client;
  }

  deleteClient(id: string): boolean {
    const initial = this.data.clients.length;
    this.data.clients = this.data.clients.filter((c) => c.id !== id);
    this.save();
    return this.data.clients.length < initial;
  }

  // --- Cases ---
  getCases(): ProcedureCase[] {
    return this.data.cases;
  }

  getCaseById(id: string): ProcedureCase | undefined {
    return this.data.cases.find((c) => c.id === id);
  }

  saveCase(procedureCase: ProcedureCase): ProcedureCase {
    const idx = this.data.cases.findIndex((c) => c.id === procedureCase.id);
    const updated = { ...procedureCase, updatedAt: new Date().toISOString().split('T')[0] };
    if (idx >= 0) {
      this.data.cases[idx] = updated;
    } else {
      this.data.cases.unshift(updated);
    }
    this.save();
    return updated;
  }

  deleteCase(id: string): boolean {
    const initial = this.data.cases.length;
    this.data.cases = this.data.cases.filter((c) => c.id !== id);
    this.save();
    return this.data.cases.length < initial;
  }

  // --- Norms ---
  getNorms(): NormDocument[] {
    return this.data.norms;
  }

  saveNorm(norm: NormDocument): NormDocument {
    const idx = this.data.norms.findIndex((n) => n.documentId === norm.documentId);
    if (idx >= 0) {
      this.data.norms[idx] = norm;
    } else {
      this.data.norms.unshift(norm);
    }
    this.save();
    return norm;
  }

  // --- Analyzed Docs ---
  getAnalyzedDocs(): AnalyzedDocument[] {
    return this.data.analyzedDocs;
  }

  saveAnalyzedDoc(doc: AnalyzedDocument): AnalyzedDocument {
    this.data.analyzedDocs.unshift(doc);
    this.save();
    return doc;
  }

  // --- Audit Logs ---
  addAuditLog(log: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    // Mask sensitive fields in details if present
    let maskedDetails = log.details;
    maskedDetails = maskedDetails.replace(/\b\d{2}-\d{8}-\d\b/g, '[CUIT ENMASCARADO]');
    maskedDetails = maskedDetails.replace(/\b\d{7,8}\b/g, '[DNI ENMASCARADO]');

    const entry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      ...log,
      details: maskedDetails,
    };
    this.data.auditLogs.unshift(entry);
    // Keep max 500 logs
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    this.save();
    return entry;
  }

  getAuditLogs(): AuditLogEntry[] {
    return this.data.auditLogs;
  }
}

export const db = new DatabaseService();
