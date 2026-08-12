import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Helper Regex Patterns
export const DNI_CUIT_REGEX = /^(\d{7,8}|\d{2}-\d{8}-\d)$/;
export const PATENTE_REGEX = /^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/i; // Old format (AAA123) and new Mercosur format (AA123AA)

export const CreateClientSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(128),
  dniCuit: z.string().regex(DNI_CUIT_REGEX, 'DNI o CUIT inválido (ej. 20-12345678-9 o 12345678)'),
  type: z.enum(['PERSONA_HUMANA', 'PERSONA_JURIDICA']),
  phone: z.string().max(64).optional().default(''),
  email: z.string().email('Email inválido').or(z.literal('')).optional().default(''),
  address: z.string().max(256).optional().default(''),
  notes: z.string().max(1000).optional().default(''),
  organizationId: z.string().optional(),
}).strict();

export const UpdateClientSchema = CreateClientSchema.partial();

export const CreateCaseSchema = z.object({
  title: z.string().min(3, 'El título es obligatorio').max(256),
  clientId: z.string().min(1, 'Debe seleccionar un cliente'),
  clientName: z.string().min(1),
  clientDniCuit: z.string().regex(DNI_CUIT_REGEX, 'DNI / CUIT inválido'),
  vehicleDomain: z.string().min(6).max(10).regex(PATENTE_REGEX, 'Dominio / Patente con formato argentino inválido (ej. AF123JK o ABC123)'),
  vehicleBrandModel: z.string().min(2).max(128),
  procedureId: z.string().min(1),
  procedureTitle: z.string().min(1),
  status: z.enum(['NUEVO', 'DOC_INCOMPLETA', 'EN_PROCESO', 'PRESENTADO', 'FINALIZADO', 'OBSERVADO', 'CANCELADO']).default('NUEVO'),
  turnsDate: z.string().optional(),
  feesAmount: z.number().min(0).default(0),
  feesPaid: z.boolean().default(false),
  checklist: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      isRequired: z.boolean(),
      isCompleted: z.boolean(),
      category: z.string().optional(),
      note: z.string().optional(),
    })
  ).optional().default([]),
  notes: z.array(
    z.object({
      id: z.string(),
      author: z.string(),
      text: z.string(),
      date: z.string(),
    })
  ).optional().default([]),
  organizationId: z.string().optional(),
}).strict();

export const UpdateCaseSchema = CreateCaseSchema.partial();

export const CreateNormSchema = z.object({
  title: z.string().min(3).max(256),
  documentType: z.enum(['DISPOSICION', 'DECRETO_LEY', 'DIGESTO_DNTR', 'CIRCULAR', 'RESOLUCION', 'FORMULARIO', 'OTRO']),
  issuingAuthority: z.enum(['DNRPA', 'MINISTERIO_JUSTICIA', 'BOLETIN_OFICIAL', 'INFOLEG', 'ORGANISMO_PROVINCIAL']),
  number: z.string().min(1).max(64),
  year: z.number().int().min(1900).max(2100),
  publicationDate: z.string().min(8),
  effectiveDate: z.string().min(8),
  status: z.enum(['VIGENTE', 'DEROGADA', 'SUSTITUIDA', 'MODIFICADA', 'EN_REVISION', 'DESCONOCIDA']),
  topics: z.array(z.string()).default([]),
  subtopics: z.array(z.string()).default([]),
  vehicleTypes: z.array(z.enum(['AUTOMOVIL', 'MOTOVEHICULO', 'MAQUINARIA', 'ACOPLADO', 'TODOS'])).default(['TODOS']),
  sourceUrl: z.string().url().or(z.literal('')).optional(),
  officialSource: z.boolean().default(true),
  content: z.string().min(10, 'El contenido debe tener al menos 10 caracteres'),
  summary: z.string().max(1000).optional(),
}).strict();

export const UpdateNormSchema = CreateNormSchema.partial();

export const LoginSchema = z.object({
  username: z.string().min(2, 'Nombre de usuario requerido').max(64),
  password: z.string().min(4, 'Contraseña requerida').max(128),
}).strict();

export const CreateUserSchema = z.object({
  username: z.string().min(3).max(64),
  email: z.string().email(),
  name: z.string().min(2).max(128),
  role: z.enum(['ADMIN', 'MANDATARIO', 'ASISTENTE', 'CONSULTA']),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  organizationId: z.string().optional(),
}).strict();

export const AnalyzeDocSchema = z.object({
  imageBase64: z.string().min(10).optional(),
  documentType: z.string().optional(),
  fileName: z.string().max(256).optional(),
  caseId: z.string().optional(),
});

export const VerifyDocsSchema = z.object({
  documents: z.array(
    z.object({
      fileName: z.string().optional(),
      documentType: z.string().optional(),
      extractedFields: z.record(z.string(), z.any()).optional(),
    })
  ).min(1, 'Se requiere al menos un documento para verificación'),
}).strict();


export const ChatRequestSchema = z.object({
  query: z.string().min(2, 'La consulta no puede estar vacía').max(2000),
  mode: z.enum(['profesional', 'simple']).default('profesional'),
  officialOnly: z.boolean().default(false),
}).strict();

export const NormDiffSchema = z.object({
  normAId: z.string().min(1, 'Norma A requerida'),
  normBId: z.string().min(1, 'Norma B requerida'),
}).strict();

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Solicitud con formato de datos inválido',
        details: result.error.format(),
      });
    }
    req.body = result.data;
    next();
  };
}
