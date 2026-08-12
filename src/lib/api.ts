import { User, Client, ProcedureCase, NormDocument, UserRole, AuditLogEntry, AIResponseStructure, RAGTraceInfo, AnalyzedDocument, DocumentVerificationResult } from '../types';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export class ApiClient {
  private static csrfToken: string | null = null;

  static async getCsrfToken(): Promise<string> {
    if (this.csrfToken) return this.csrfToken;
    try {
      const res = await fetch('/api/auth/csrf-token', { credentials: 'same-origin' });
      const data = await res.json();
      if (data.csrfToken) {
        this.csrfToken = data.csrfToken;
        return data.csrfToken;
      }
    } catch {
      // ignore
    }
    return '';
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      const token = await this.getCsrfToken();
      if (token) {
        defaultHeaders['X-CSRF-Token'] = token;
      }
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: 'same-origin', // Sends HTTP-only session cookie automatically
    };

    const res = await fetch(endpoint, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.success === false) {
      const err: ApiError = data.error || {
        code: `HTTP_${res.status}`,
        message: 'Ocurrió un error al procesar la solicitud.',
      };
      throw err;
    }

    return data;
  }

  // --- Auth ---
  static async login(username: string, password: string): Promise<{ user: User }> {
    const res = await this.request<{ success: boolean; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    // Invalidate cached CSRF token so next request fetches refreshed token
    this.csrfToken = null;
    return { user: res.user };
  }

  static async logout(): Promise<void> {
    await this.request('/api/auth/logout', { method: 'POST' });
    this.csrfToken = null;
  }

  static async getMe(): Promise<User | null> {
    try {
      const res = await this.request<{ success: boolean; user: User | null }>('/api/auth/me');
      return res.user;
    } catch {
      return null;
    }
  }

  // --- Users (Admin) ---
  static async getUsers(): Promise<User[]> {
    const res = await this.request<{ success: boolean; users: User[] }>('/api/users');
    return res.users;
  }

  static async createUser(data: { username: string; email: string; name: string; role: UserRole; password: string }): Promise<User> {
    const res = await this.request<{ success: boolean; user: User }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.user;
  }

  static async updateUserRole(userId: string, role: UserRole): Promise<User> {
    const res = await this.request<{ success: boolean; user: User }>(`/api/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    return res.user;
  }

  // --- Cases ---
  static async getCases(): Promise<ProcedureCase[]> {
    const res = await this.request<{ success: boolean; cases: ProcedureCase[] }>('/api/cases');
    return res.cases;
  }

  static async saveCase(procedureCase: ProcedureCase): Promise<ProcedureCase> {
    const res = await this.request<{ success: boolean; case: ProcedureCase }>('/api/cases', {
      method: 'POST',
      body: JSON.stringify(procedureCase),
    });
    return res.case;
  }

  static async deleteCase(id: string): Promise<boolean> {
    const res = await this.request<{ success: boolean }>(`/api/cases/${id}`, {
      method: 'DELETE',
    });
    return res.success;
  }

  // --- Clients ---
  static async getClients(): Promise<Client[]> {
    const res = await this.request<{ success: boolean; clients: Client[] }>('/api/clients');
    return res.clients;
  }

  static async saveClient(client: Client): Promise<Client> {
    const res = await this.request<{ success: boolean; client: Client }>('/api/clients', {
      method: 'POST',
      body: JSON.stringify(client),
    });
    return res.client;
  }

  static async deleteClient(id: string): Promise<boolean> {
    const res = await this.request<{ success: boolean }>(`/api/clients/${id}`, {
      method: 'DELETE',
    });
    return res.success;
  }

  // --- Norms ---
  static async getNorms(): Promise<NormDocument[]> {
    const res = await this.request<{ success: boolean; norms: NormDocument[] }>('/api/norms');
    return res.norms;
  }

  static async saveNorm(norm: NormDocument): Promise<NormDocument> {
    const res = await this.request<{ success: boolean; norm: NormDocument }>('/api/norms', {
      method: 'POST',
      body: JSON.stringify(norm),
    });
    return res.norm;
  }

  // --- Audit Logs ---
  static async getAuditLogs(): Promise<AuditLogEntry[]> {
    const res = await this.request<{ success: boolean; logs: AuditLogEntry[] }>('/api/audit-logs');
    return res.logs;
  }

  // --- AI Chat RAG ---
  static async queryChatRAG(query: string, officialOnly: boolean, mode: 'profesional' | 'simple'): Promise<{
    responseStructure: AIResponseStructure;
    traceInfo: RAGTraceInfo;
  }> {
    return this.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ query, officialOnly, mode }),
    });
  }

  // --- OCR Analyze Document ---
  static async analyzeDocument(params: { imageBase64?: string; documentType?: string; fileName?: string }): Promise<AnalyzedDocument> {
    return this.request('/api/analyze-document', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // --- Document Verifier ---
  static async verifyDocuments(documents: AnalyzedDocument[]): Promise<DocumentVerificationResult> {
    return this.request('/api/verify-documents', {
      method: 'POST',
      body: JSON.stringify(documents),
    });
  }

  // --- Norm Diff ---
  static async normDiff(normA: string, normB: string): Promise<any> {
    return this.request('/api/norm-diff', {
      method: 'POST',
      body: JSON.stringify({ normA, normB }),
    });
  }
}
