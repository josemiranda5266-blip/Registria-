/**
 * REGISTRIA - Types & Data Models
 * Inteligencia Registral para el Automotor Argentino
 */

export type NormativeStatus = 
  | 'VIGENTE' 
  | 'DEROGADA' 
  | 'SUSTITUIDA' 
  | 'MODIFICADA' 
  | 'EN_REVISION' 
  | 'DESCONOCIDA';

export type DocumentType = 
  | 'DISPOSICION' 
  | 'DECRETO_LEY' 
  | 'DIGESTO_DNTR' 
  | 'CIRCULAR' 
  | 'RESOLUCION' 
  | 'FORMULARIO' 
  | 'OTRO';

export type VehicleType = 
  | 'AUTOMOVIL' 
  | 'MOTOVEHICULO' 
  | 'MAQUINARIA' 
  | 'ACOPLADO' 
  | 'TODOS';

export interface NormDocument {
  documentId: string;
  title: string;
  documentType: DocumentType;
  issuingAuthority: 'DNRPA' | 'MINISTERIO_JUSTICIA' | 'BOLETIN_OFICIAL' | 'INFOLEG' | 'ORGANISMO_PROVINCIAL';
  number: string;
  year: number;
  publicationDate: string;
  effectiveDate: string;
  status: NormativeStatus;
  topics: string[];
  subtopics: string[];
  vehicleTypes: VehicleType[];
  relatedDocuments?: string[];
  modifiesDocuments?: string[];
  repealsDocuments?: string[];
  replacedByDocuments?: string[];
  sourceUrl?: string;
  officialSource: boolean;
  content: string;
  contentHash: string;
  uploadedAt: string;
  version: string;
  uploadedBy?: string;
  summary?: string;
}

export interface NormChunk {
  chunkId: string;
  documentId: string;
  docTitle: string;
  pageNumber?: number;
  sectionTitle?: string;
  text: string;
  status: NormativeStatus;
  officialSource: boolean;
}

export interface NormRelation {
  id: string;
  sourceNormId: string;
  sourceTitle: string;
  targetNormId: string;
  targetTitle: string;
  relationType: 'MODIFICA' | 'DEROGA' | 'SUSTITUYE' | 'CITA';
  description: string;
  date: string;
}

export interface Procedure {
  id: string;
  title: string;
  category: 
    | 'Transferencia'
    | 'Inscripción Inicial'
    | 'Radicación'
    | 'Denuncia de Venta/Compra'
    | 'Duplicados'
    | 'Prendas y Cédulas'
    | 'Bajas y Altas'
    | 'Sucesiones y Condominios'
    | 'Personas Jurídicas'
    | 'Otros';
  description: string;
  requirements: string[];
  stepByStep: string[];
  formsRequired: string[];
  estimatedDays: string;
  warnings: string[];
  relatedNormIds: string[];
  officialUrl?: string;
  wizardQuestions?: {
    id: string;
    question: string;
    options: { label: string; value: string; nextQuestionId?: string; isMatch?: boolean }[];
  }[];
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  isRequired: boolean;
  isCompleted: boolean;
  category?: string;
  note?: string;
}

export type CaseStatus = 
  | 'NUEVO' 
  | 'DOC_INCOMPLETA' 
  | 'EN_PROCESO' 
  | 'PRESENTADO' 
  | 'FINALIZADO' 
  | 'OBSERVADO' 
  | 'CANCELADO';

export interface ProcedureCase {
  id: string;
  organizationId?: string;
  createdBy?: string;
  assignedTo?: string;
  caseNumber: string;
  title: string;
  clientId: string;
  clientName: string;
  clientDniCuit: string;
  vehicleDomain: string; // Patente
  vehicleBrandModel: string;
  procedureId: string;
  procedureTitle: string;
  status: CaseStatus;
  checklist: ChecklistItem[];
  uploadedDocs: AnalyzedDocument[];
  notes: Array<{ id: string; author: string; text: string; date: string }>;
  turnsDate?: string;
  feesAmount: number;
  feesPaid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  organizationId?: string;
  createdBy?: string;
  name: string;
  dniCuit: string;
  type: 'PERSONA_HUMANA' | 'PERSONA_JURIDICA';
  phone: string;
  email: string;
  address?: string;
  notes?: string;
  casesCount: number;
  createdAt: string;
}

export interface ExtractedField {
  label: string;
  value: string;
  confidence: number; // 0 to 1
  isReadable: boolean;
}

export interface AnalyzedDocument {
  id: string;
  organizationId?: string;
  uploadedBy?: string;
  fileName: string;
  documentType: 'TITULO_AUTOMOTOR' | 'CEDULA_VERDE' | 'CEDULA_AZUL' | 'DNI' | 'FORMULARIO_08' | 'FORMULARIO_02' | 'FORMULARIO_12' | 'PODER' | 'ESTATUTO_SOCIETARIO' | 'OTRO';
  extractedFields: Record<string, ExtractedField>;
  rawOcrText: string;
  confidenceScore: number;
  uploadedAt: string;
  previewUrl?: string;
}

export interface DocumentInconsistency {
  id: string;
  fieldLabel: string;
  docAName: string;
  valueA: string;
  docBName: string;
  valueB: string;
  severity: 'GRAVE' | 'MODERADA' | 'LEVE';
  recommendation: string;
}

export interface DocumentVerificationResult {
  isConsistent: boolean;
  inconsistencies: DocumentInconsistency[];
  summary: string;
  verifiedFieldsCount: number;
}

export interface AIResponseSource {
  documentTitle: string;
  sectionOrPage: string;
  url?: string;
  official: boolean;
  status: NormativeStatus;
}

export interface AIResponseStructure {
  answer: string;
  legalBasis: string[];
  requirements: string[];
  steps: string[];
  documentation: string[];
  observations: string[];
  sources: AIResponseSource[];
  confidence: 'ALTA' | 'MEDIA' | 'BAJA';
  confidenceReason?: string;
  lastSyncDate: string;
  warnings?: string[];
}

export interface RAGTraceInfo {
  queryClassification: string;
  keywordsUsed: string[];
  matchedChunksCount: number;
  vigencyFilteredCount: number;
  modelUsed: string;
  executionTimeMs: number;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  responseStructure?: AIResponseStructure;
  traceInfo?: RAGTraceInfo;
  isOfficialOnlyMode?: boolean;
}

export type UserRole = 'ADMIN' | 'MANDATARIO' | 'ASISTENTE' | 'CONSULTA' | 'LECTOR';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId?: string;
  createdAt: string;
  lastLogin?: string;
  active: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId?: string;
  username?: string;
  userRole?: UserRole;
  action: string;
  entity: 'CASE' | 'CLIENT' | 'NORM' | 'USER' | 'DOCUMENT' | 'SYSTEM' | 'AUTH';
  entityId?: string;
  details: string;
  ipAddress?: string;
}

export interface SystemAuditItem {
  id: string;
  category: string;
  title: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  detail: string;
}

export interface OfficialPortalLink {
  id: string;
  name: string;
  organism: string;
  description: string;
  url: string;
  verifiedDate: string;
  isOfficial: boolean;
  category: string;
}
