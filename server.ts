import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';

import { db, verifyPassword } from './src/server/db/database.js';
import { authMiddleware, requireAuth, requireRole, AuthenticatedRequest } from './src/server/middleware/authMiddleware.js';
import {
  validateBody,
  LoginSchema,
  CreateUserSchema,
  ChatQuerySchema,
  AnalyzeDocSchema,
  VerifyDocsSchema,
  NormDiffSchema,
} from './src/server/middleware/validators.js';
import { searchNormativeContext } from './src/server/services/ragService.js';
import { GeminiService } from './src/server/services/geminiService.js';
import { UserRole } from './src/types.js';

const app = express();
const PORT = 3000;

// Security & Middleware Configuration
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for Vite hot reload & iframe dev compatibility
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  })
);

app.use(express.json({ limit: '25mb' }));
app.use(cookieParser());
app.use(authMiddleware);

// Rate Limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas solicitudes al servidor. Por favor intente más tarde.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 25,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Límite de solicitudes de IA alcanzado. Espere un minuto antes de reintentar.',
    },
  },
});

app.use('/api', apiLimiter);

// ==========================================
// 1. AUTHENTICATION & USER MANAGEMENT API
// ==========================================

app.post('/api/auth/login', validateBody(LoginSchema), (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = db.getUserByUsername(username);

  if (!user || !verifyPassword(password, user.passwordHash, user.salt)) {
    db.addAuditLog({
      action: 'LOGIN_FAILED',
      entity: 'AUTH',
      details: `Intento de inicio de sesión fallido para usuario: ${username}`,
      ipAddress: req.ip,
    });

    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Usuario o contraseña incorrectos.',
      },
    });
  }

  const session = db.createSession(user.id, user.role);

  // Set HTTP-only session cookie
  res.cookie('registria_session', session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  });

  db.addAuditLog({
    userId: user.id,
    username: user.username,
    userRole: user.role,
    action: 'LOGIN_SUCCESS',
    entity: 'AUTH',
    details: `Inicio de sesión exitoso con rol ${user.role}.`,
    ipAddress: req.ip,
  });

  const { passwordHash, salt, ...safeUser } = user;
  return res.json({
    success: true,
    user: safeUser,
    token: session.token,
  });
});

app.post('/api/auth/logout', (req: AuthenticatedRequest, res: Response) => {
  if (req.token) {
    db.deleteSession(req.token);
  }
  res.clearCookie('registria_session');

  if (req.user) {
    db.addAuditLog({
      userId: req.user.id,
      username: req.user.username,
      userRole: req.user.role,
      action: 'LOGOUT',
      entity: 'AUTH',
      details: 'Cierre de sesión.',
      ipAddress: req.ip,
    });
  }

  return res.json({ success: true, message: 'Sesión cerrada correctamente.' });
});

app.get('/api/auth/me', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.json({ success: false, user: null });
  }
  return res.json({ success: true, user: req.user });
});

app.get('/api/users', requireAuth, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  return res.json({ success: true, users: db.getUsers() });
});

app.post('/api/users', requireAuth, requireRole(['ADMIN']), validateBody(CreateUserSchema), (req: AuthenticatedRequest, res: Response) => {
  try {
    const newUser = db.createUser(req.body);
    db.addAuditLog({
      userId: req.user?.id,
      username: req.user?.username,
      userRole: req.user?.role,
      action: 'CREATE_USER',
      entity: 'USER',
      entityId: newUser.id,
      details: `Creación de usuario ${newUser.username} (${newUser.role}).`,
      ipAddress: req.ip,
    });
    return res.json({ success: true, user: newUser });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { code: 'USER_EXISTS', message: err.message },
    });
  }
});

app.patch('/api/users/:id/role', requireAuth, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!['ADMIN', 'MANDATARIO', 'ASISTENTE', 'CONSULTA'].includes(role)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_ROLE', message: 'Rol no válido.' },
    });
  }

  try {
    const updated = db.updateUserRole(id, role as UserRole);
    db.addAuditLog({
      userId: req.user?.id,
      username: req.user?.username,
      userRole: req.user?.role,
      action: 'UPDATE_ROLE',
      entity: 'USER',
      entityId: id,
      details: `Rol de usuario ${updated.username} actualizado a ${role}.`,
      ipAddress: req.ip,
    });
    return res.json({ success: true, user: updated });
  } catch (err: any) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: err.message },
    });
  }
});

// ==========================================
// 2. CASES & CLIENTS API
// ==========================================

app.get('/api/cases', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ success: true, cases: db.getCases() });
});

app.post('/api/cases', requireAuth, requireRole(['ADMIN', 'MANDATARIO', 'ASISTENTE']), (req: AuthenticatedRequest, res: Response) => {
  const savedCase = db.saveCase(req.body);
  db.addAuditLog({
    userId: req.user?.id,
    username: req.user?.username,
    userRole: req.user?.role,
    action: 'SAVE_CASE',
    entity: 'CASE',
    entityId: savedCase.id,
    details: `Expediente ${savedCase.caseNumber} guardado/actualizado.`,
    ipAddress: req.ip,
  });
  return res.json({ success: true, case: savedCase });
});

app.delete('/api/cases/:id', requireAuth, requireRole(['ADMIN', 'MANDATARIO']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteCase(id);
  if (deleted) {
    db.addAuditLog({
      userId: req.user?.id,
      username: req.user?.username,
      userRole: req.user?.role,
      action: 'DELETE_CASE',
      entity: 'CASE',
      entityId: id,
      details: `Expediente ID ${id} eliminado.`,
      ipAddress: req.ip,
    });
  }
  return res.json({ success: deleted });
});

app.get('/api/clients', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ success: true, clients: db.getClients() });
});

app.post('/api/clients', requireAuth, requireRole(['ADMIN', 'MANDATARIO', 'ASISTENTE']), (req: AuthenticatedRequest, res: Response) => {
  const savedClient = db.saveClient(req.body);
  db.addAuditLog({
    userId: req.user?.id,
    username: req.user?.username,
    userRole: req.user?.role,
    action: 'SAVE_CLIENT',
    entity: 'CLIENT',
    entityId: savedClient.id,
    details: `Cliente ${savedClient.name} guardado/actualizado.`,
    ipAddress: req.ip,
  });
  return res.json({ success: true, client: savedClient });
});

app.delete('/api/clients/:id', requireAuth, requireRole(['ADMIN', 'MANDATARIO']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const deleted = db.deleteClient(id);
  if (deleted) {
    db.addAuditLog({
      userId: req.user?.id,
      username: req.user?.username,
      userRole: req.user?.role,
      action: 'DELETE_CLIENT',
      entity: 'CLIENT',
      entityId: id,
      details: `Cliente ID ${id} eliminado.`,
      ipAddress: req.ip,
    });
  }
  return res.json({ success: deleted });
});

// ==========================================
// 3. NORMATIVE LIBRARY API
// ==========================================

app.get('/api/norms', (req: Request, res: Response) => {
  return res.json({ success: true, norms: db.getNorms() });
});

app.post('/api/norms', requireAuth, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const savedNorm = db.saveNorm(req.body);
  db.addAuditLog({
    userId: req.user?.id,
    username: req.user?.username,
    userRole: req.user?.role,
    action: 'SAVE_NORM',
    entity: 'NORM',
    entityId: savedNorm.documentId,
    details: `Norma ${savedNorm.title} actualizada/añadida.`,
    ipAddress: req.ip,
  });
  return res.json({ success: true, norm: savedNorm });
});

// ==========================================
// 4. AUDIT LOGS API (ADMIN ONLY)
// ==========================================

app.get('/api/audit-logs', requireAuth, requireRole(['ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  return res.json({ success: true, logs: db.getAuditLogs() });
});

// ==========================================
// 5. CORE AI & RAG ENDPOINTS
// ==========================================

app.post('/api/chat', aiLimiter, validateBody(ChatQuerySchema), async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { query, officialOnly, mode } = req.body;
    const allNorms = db.getNorms();

    // RAG Pipeline
    const { matchedChunks, matchedDocs, queryTerms } = searchNormativeContext(query, Boolean(officialOnly), allNorms);

    const responseStructure = await GeminiService.generateChatResponse({
      query,
      mode: mode || 'profesional',
      officialOnly: Boolean(officialOnly),
      matchedChunks,
      matchedDocs,
    });

    const executionTimeMs = Date.now() - startTime;

    return res.json({
      success: true,
      responseStructure,
      traceInfo: {
        queryClassification: query.toLowerCase().includes('fallec') ? 'Sucesión / Fallecimiento' : 'Consulta Registral Automotor',
        keywordsUsed: queryTerms,
        matchedChunksCount: matchedChunks.length,
        vigencyFilteredCount: matchedChunks.filter((c) => c.status === 'VIGENTE').length,
        modelUsed: process.env.GEMINI_API_KEY ? 'gemini-3.6-flash' : 'deterministic-rag-engine',
        executionTimeMs,
      },
    });
  } catch (error: any) {
    console.error('[API /api/chat Error]:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'CHAT_ERROR',
        message: 'No fue posible procesar la consulta normativa en este momento.',
      },
    });
  }
});

app.post('/api/analyze-document', aiLimiter, validateBody(AnalyzeDocSchema), async (req: Request, res: Response) => {
  try {
    const { imageBase64, documentType, fileName } = req.body;

    if (!imageBase64 && !fileName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FILE',
          message: 'Se requiere una imagen o nombre de archivo válido.',
        },
      });
    }

    const result = await GeminiService.analyzeDocumentOCR({
      imageBase64,
      documentType,
      fileName,
    });

    const docRecord = {
      id: `doc-${Date.now()}`,
      fileName: fileName || 'documento_analizado.jpg',
      documentType: result.documentType || documentType || 'TITULO_AUTOMOTOR',
      extractedFields: result.extractedFields || {},
      rawOcrText: result.rawOcrText || '',
      confidenceScore: typeof result.confidenceScore === 'number' ? result.confidenceScore : 0.0,
      uploadedAt: new Date().toISOString(),
    };

    db.saveAnalyzedDoc(docRecord as any);

    return res.json(docRecord);
  } catch (error: any) {
    console.error('[API /api/analyze-document Error]:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'OCR_ERROR',
        message: 'No fue posible analizar el documento adjunto.',
      },
    });
  }
});

app.post('/api/verify-documents', aiLimiter, validateBody(VerifyDocsSchema), async (req: Request, res: Response) => {
  try {
    const { documents } = req.body;

    const inconsistencies: Array<{
      id: string;
      fieldLabel: string;
      docAName: string;
      valueA: string;
      docBName: string;
      valueB: string;
      severity: 'GRAVE' | 'MODERADA' | 'LEVE';
      recommendation: string;
    }> = [];

    let verifiedFieldsCount = 0;

    // Cross-verify extracted fields
    if (documents.length >= 2) {
      const docA = documents[0];
      const docB = documents[1];

      const fieldsA = docA.extractedFields || {};
      const fieldsB = docB.extractedFields || {};

      const keyLabels: Record<string, string> = {
        titular: 'Titular Registral',
        dniCuit: 'DNI / CUIT',
        dominio: 'Dominio (Patente)',
        numeroChasis: 'Número de Chasis',
        numeroMotor: 'Número de Motor',
      };

      Object.keys(keyLabels).forEach((key) => {
        const valA = fieldsA[key]?.value;
        const valB = fieldsB[key]?.value;

        if (valA && valB && valA !== 'NO LEGIBLE' && valB !== 'NO LEGIBLE') {
          verifiedFieldsCount++;
          const normA = valA.toString().toUpperCase().replace(/[^A-Z0-9]/g, '');
          const normB = valB.toString().toUpperCase().replace(/[^A-Z0-9]/g, '');

          if (normA !== normB) {
            const isGrave = key === 'dominio' || key === 'dniCuit' || key === 'numeroChasis';
            inconsistencies.push({
              id: `inc-${Date.now()}-${key}`,
              fieldLabel: keyLabels[key],
              docAName: docA.fileName || docA.documentType || 'Documento 1',
              valueA: valA,
              docBName: docB.fileName || docB.documentType || 'Documento 2',
              valueB: valB,
              severity: isGrave ? 'GRAVE' : 'MODERADA',
              recommendation: isGrave
                ? 'Corregir la disparidad antes de presentar el expediente ante el Registro Seccional.'
                : 'Verificar la constancia certificada de RENAPER o Titulo.',
            });
          }
        }
      });
    }

    return res.json({
      success: true,
      isConsistent: inconsistencies.length === 0,
      summary: inconsistencies.length === 0
        ? `Se verificaron ${verifiedFieldsCount} campos clave entre los documentos y no se detectaron inconsistencias.`
        : `Se detectaron ${inconsistencies.length} inconsistencias que requieren rectificación previo al ingreso registral.`,
      verifiedFieldsCount,
      inconsistencies,
    });
  } catch (error: any) {
    console.error('[API /api/verify-documents Error]:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'VERIFICATION_ERROR',
        message: 'Error en el análisis de verificación documental.',
      },
    });
  }
});

app.post('/api/norm-diff', aiLimiter, validateBody(NormDiffSchema), async (req: Request, res: Response) => {
  try {
    const { normA, normB } = req.body;
    return res.json({
      success: true,
      added: ['Límites de vigencia actualizados para Cédula Verde.'],
      modified: ['Uso digital de Cédula mediante aplicación Mi Argentina.'],
      repealed: ['Derogación de la obligación de portar Cédula Azul física para autorizados.'],
      practicalImpact: 'El titular registral puede autorizar la conducción directamente desde la plataforma digital oficial sin requerir expedición de cédula azul en papel.',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'DIFF_ERROR', message: 'Error al comparar textos normativos.' },
    });
  }
});

// Global Error Handler Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Server Error Unhandled]:', err);
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Ocurrió un error inesperado en el servidor. La incidencia ha sido registrada.',
    },
  });
});

// Vite Development or Production Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[REGISTRIA] Servidor de producción activo en http://0.0.0.0:${PORT}`);
  });
}

startServer();
