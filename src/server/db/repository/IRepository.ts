import { User, UserRole, Client, ProcedureCase, NormDocument, NormChunk, AnalyzedDocument, AuditLogEntry } from '../../../types.js';

export interface UserRecord extends User {
  passwordHash: string;
  salt: string;
  mustChangePassword?: boolean;
}

export interface SessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  role: UserRole;
  createdAt: string;
  expiresAt: string;
}

export interface IRepository {
  init(): Promise<void>;

  // Users
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<UserRecord | undefined>;
  getUserByUsername(username: string): Promise<UserRecord | undefined>;
  createUser(userData: { username: string; email: string; name: string; role: UserRole; password: string; organizationId?: string }): Promise<User>;
  updateUserRole(id: string, newRole: UserRole): Promise<User>;
  updateUserPassword(id: string, newPasswordHash: string, newSalt: string): Promise<void>;

  // Sessions
  createSession(userId: string, role: UserRole): Promise<{ session: SessionRecord; rawToken: string }>;
  getSessionByToken(rawToken: string): Promise<(SessionRecord & { user: User }) | undefined>;
  deleteSessionByToken(rawToken: string): Promise<boolean>;
  deleteSessionsForUser(userId: string): Promise<void>;

  // Clients
  getClients(organizationId?: string, createdBy?: string): Promise<Client[]>;
  getClientById(id: string): Promise<Client | undefined>;
  saveClient(client: Client): Promise<Client>;
  deleteClient(id: string): Promise<boolean>;

  // Cases
  getCases(organizationId?: string, assignedTo?: string): Promise<ProcedureCase[]>;
  getCaseById(id: string): Promise<ProcedureCase | undefined>;
  saveCase(procedureCase: ProcedureCase): Promise<ProcedureCase>;
  deleteCase(id: string): Promise<boolean>;

  // Norms & Chunks (RAG Source of Truth)
  getNorms(): Promise<NormDocument[]>;
  getNormById(documentId: string): Promise<NormDocument | undefined>;
  saveNorm(norm: NormDocument): Promise<NormDocument>;
  getNormChunks(): Promise<NormChunk[]>;

  // Analyzed Docs
  getAnalyzedDocs(organizationId?: string): Promise<AnalyzedDocument[]>;
  saveAnalyzedDoc(doc: AnalyzedDocument): Promise<AnalyzedDocument>;

  // Audit Logs
  addAuditLog(log: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry>;
  getAuditLogs(): Promise<AuditLogEntry[]>;

  // Atomic Transaction helper
  executeInTransaction<T>(work: (repo: IRepository) => Promise<T>): Promise<T>;
}
