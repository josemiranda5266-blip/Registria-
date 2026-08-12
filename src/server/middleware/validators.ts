import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parámetros de entrada inválidos.',
            details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
          },
        });
      }
      next(err);
    }
  };
}

export const LoginSchema = z.object({
  username: z.string().min(1, 'El nombre de usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const CreateUserSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'MANDATARIO', 'ASISTENTE', 'CONSULTA']),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const ChatQuerySchema = z.object({
  query: z.string().min(3, 'La consulta debe tener al menos 3 caracteres').max(2000),
  officialOnly: z.boolean().optional().default(false),
  mode: z.enum(['profesional', 'simple']).optional().default('profesional'),
});

export const AnalyzeDocSchema = z.object({
  imageBase64: z.string().optional(),
  documentType: z.string().optional(),
  fileName: z.string().optional(),
});

export const VerifyDocsSchema = z.object({
  documents: z.array(z.object({
    fileName: z.string().optional(),
    documentType: z.string().optional(),
    extractedFields: z.record(z.any()).optional(),
  })).min(2, 'Se requieren al menos 2 documentos para verificación cruzada.'),
});

export const NormDiffSchema = z.object({
  normA: z.string().min(1, 'Se requiere la norma A'),
  normB: z.string().min(1, 'Se requiere la norma B'),
});
