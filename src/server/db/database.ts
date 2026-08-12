import crypto from 'crypto';
import { User, UserRole, Client, ProcedureCase, NormDocument, AnalyzedDocument, AuditLogEntry } from '../../types.js';
import { getDbRepository } from './repository/index.js';
import { hashPassword, verifyPassword } from './repository/JsonRepository.js';

export { hashPassword, verifyPassword };

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

class DatabaseFacade {
  async getUsers(): Promise<User[]> {
    const repo = await getDbRepository();
    return repo.getUsers();
  }

  async getUserById(id: string): Promise<UserRecord | undefined> {
    const repo = await getDbRepository();
    return repo.getUserById(id);
  }

  async getUserByUsername(username: string): Promise<UserRecord | undefined> {
    const repo = await getDbRepository();
    return repo.getUserByUsername(username);
  }

  async createUser(userData: { username: string; email: string; name: string; role: UserRole; password: string; organizationId?: string }): Promise<User> {
    const repo = await getDbRepository();
    return repo.createUser(userData);
  }

  async updateUserRole(id: string, newRole: UserRole): Promise<User> {
    const repo = await getDbRepository();
    return repo.updateUserRole(id, newRole);
  }

  async updateUserPassword(id: string, newPasswordHash: string, newSalt: string): Promise<void> {
    const repo = await getDbRepository();
    return repo.updateUserPassword(id, newPasswordHash, newSalt);
  }

  async createSession(userId: string, role: UserRole): Promise<{ session: SessionRecord; rawToken: string }> {
    const repo = await getDbRepository();
    return repo.createSession(userId, role);
  }

  async getSessionByToken(rawToken: string): Promise<(SessionRecord & { user: User }) | undefined> {
    const repo = await getDbRepository();
    return repo.getSessionByToken(rawToken);
  }

  async deleteSession(rawToken: string): Promise<boolean> {
    const repo = await getDbRepository();
    return repo.deleteSessionByToken(rawToken);
  }

  async getClients(organizationId?: string, createdBy?: string): Promise<Client[]> {
    const repo = await getDbRepository();
    return repo.getClients(organizationId, createdBy);
  }

  async saveClient(client: Client): Promise<Client> {
    const repo = await getDbRepository();
    return repo.saveClient(client);
  }

  async deleteClient(id: string): Promise<boolean> {
    const repo = await getDbRepository();
    return repo.deleteClient(id);
  }

  async getCases(organizationId?: string, assignedTo?: string): Promise<ProcedureCase[]> {
    const repo = await getDbRepository();
    return repo.getCases(organizationId, assignedTo);
  }

  async getCaseById(id: string): Promise<ProcedureCase | undefined> {
    const repo = await getDbRepository();
    return repo.getCaseById(id);
  }

  async saveCase(procedureCase: ProcedureCase): Promise<ProcedureCase> {
    const repo = await getDbRepository();
    return repo.saveCase(procedureCase);
  }

  async deleteCase(id: string): Promise<boolean> {
    const repo = await getDbRepository();
    return repo.deleteCase(id);
  }

  async getNorms(): Promise<NormDocument[]> {
    const repo = await getDbRepository();
    return repo.getNorms();
  }

  async saveNorm(norm: NormDocument): Promise<NormDocument> {
    const repo = await getDbRepository();
    return repo.saveNorm(norm);
  }

  async getAnalyzedDocs(organizationId?: string): Promise<AnalyzedDocument[]> {
    const repo = await getDbRepository();
    return repo.getAnalyzedDocs(organizationId);
  }

  async saveAnalyzedDoc(doc: AnalyzedDocument): Promise<AnalyzedDocument> {
    const repo = await getDbRepository();
    return repo.saveAnalyzedDoc(doc);
  }

  async addAuditLog(log: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
    const repo = await getDbRepository();
    return repo.addAuditLog(log);
  }

  async getAuditLogs(): Promise<AuditLogEntry[]> {
    const repo = await getDbRepository();
    return repo.getAuditLogs();
  }
}

export const db = new DatabaseFacade();
