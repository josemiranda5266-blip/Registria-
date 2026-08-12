/**
 * REGISTRIA - Local Adapter & State Cache
 * Proporciona métodos sincrónicos de caché con sincronización backend mediante ApiClient.
 */

import { ProcedureCase, Client, AnalyzedDocument, NormDocument, UserRole } from '../types';
import { INITIAL_NORMATIVE_LIBRARY } from '../data/normativeDatabase';
import { ApiClient } from './api';

const CASES_KEY = 'registria_cases_v2';
const CLIENTS_KEY = 'registria_clients_v2';
const NORMS_KEY = 'registria_norms_v2';
const ROLE_KEY = 'registria_user_role_v2';

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-101',
    name: 'Estudio Jurídico Gómez & Asociados',
    dniCuit: '30-71234567-8',
    type: 'PERSONA_JURIDICA',
    phone: '+54 11 4321-8765',
    email: 'contacto@gomezestudio.com.ar',
    address: 'Av. Corrientes 1250 4° A, CABA',
    notes: 'Cliente corporativo con flota de vehículos.',
    casesCount: 2,
    createdAt: '2026-07-10',
  },
  {
    id: 'cli-102',
    name: 'Carlos Alberto Rodríguez',
    dniCuit: '20-28493021-4',
    phone: '+54 11 5543-9812',
    email: 'carlos.rodriguez@gmail.com',
    type: 'PERSONA_HUMANA',
    address: 'Calle 14 N° 450, La Plata, Buenos Aires',
    notes: 'Sucesión en trámite Juzgado Civil N° 3.',
    casesCount: 1,
    createdAt: '2026-07-25',
  },
];

export const INITIAL_CASES: ProcedureCase[] = [
  {
    id: 'case-2026-001',
    caseNumber: 'EXP-2026-0089',
    title: 'Transferencia por Sucesión - Fiat Cronos',
    clientId: 'cli-102',
    clientName: 'Carlos Alberto Rodríguez',
    clientDniCuit: '20-28493021-4',
    vehicleDomain: 'AF123JK',
    vehicleBrandModel: 'Fiat Cronos Precision 1.8 2022',
    procedureId: 'proc-transferencia-fallecimiento',
    procedureTitle: 'Transferencia por Fallecimiento (Sucesión)',
    status: 'EN_PROCESO',
    checklist: [
      { id: 'chk-1', title: 'Oficio Judicial / Testimonio de Sucesión', isRequired: true, isCompleted: true },
      { id: 'chk-2', title: 'Declaratoria de Herederos en copias certificadas', isRequired: true, isCompleted: true },
      { id: 'chk-3', title: 'Solicitud Tipo 08 firmado por herederos', isRequired: true, isCompleted: false },
      { id: 'chk-4', title: 'Verificación Policial Formulario 12', isRequired: true, isCompleted: true },
      { id: 'chk-5', title: 'Informe de Dominio e Inhibiciones', isRequired: false, isCompleted: true },
    ],
    uploadedDocs: [],
    notes: [
      { id: 'n-1', author: 'Dr. López', text: 'Se recibió testimonio del Juzgado N° 3 La Plata el 02/08/2026.', date: '2026-08-02' },
      { id: 'n-2', author: 'Mandatario Varela', text: 'Pendiente firma de Solicitud 08 por el co-heredero Juan Rodríguez.', date: '2026-08-05' },
    ],
    turnsDate: '2026-08-18 10:30',
    feesAmount: 145000,
    feesPaid: true,
    createdAt: '2026-07-28',
    updatedAt: '2026-08-05',
  },
  {
    id: 'case-2026-002',
    caseNumber: 'EXP-2026-0094',
    title: 'Transferencia Soc. Anon. - Toyota Hilux',
    clientId: 'cli-101',
    clientName: 'Estudio Jurídico Gómez & Asociados',
    clientDniCuit: '30-71234567-8',
    vehicleDomain: 'AC892PQ',
    vehicleBrandModel: 'Toyota Hilux SRX 4x4 2020',
    procedureId: 'proc-transferencia-persona-juridica',
    procedureTitle: 'Transferencia con Persona Jurídica (Empresa)',
    status: 'DOC_INCOMPLETA',
    checklist: [
      { id: 'chk-10', title: 'Estatuto Social inscripto en IGJ', isRequired: true, isCompleted: true },
      { id: 'chk-11', title: 'Acta de Asamblea de designación de autoridades', isRequired: true, isCompleted: false },
      { id: 'chk-12', title: 'Solicitud 08 firmado por representantes legales', isRequired: true, isCompleted: false },
      { id: 'chk-13', title: 'Formulario 12 Verificación Policial', isRequired: true, isCompleted: true },
    ],
    uploadedDocs: [],
    notes: [
      { id: 'n-10', author: 'Asistente P. Gómez', text: 'Se requirió la última acta de directorio certificada a la escribanía.', date: '2026-08-08' },
    ],
    turnsDate: '2026-08-22 11:15',
    feesAmount: 210000,
    feesPaid: false,
    createdAt: '2026-08-01',
    updatedAt: '2026-08-08',
  },
];

export const StorageEngine = {
  getRole(): UserRole {
    return (localStorage.getItem(ROLE_KEY) as UserRole) || 'MANDATARIO';
  },
  setRole(role: UserRole) {
    localStorage.setItem(ROLE_KEY, role);
  },

  getCases(): ProcedureCase[] {
    const data = localStorage.getItem(CASES_KEY);
    if (!data) {
      return INITIAL_CASES;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_CASES;
    }
  },

  saveCase(newCase: ProcedureCase): ProcedureCase[] {
    const cases = this.getCases();
    const idx = cases.findIndex((c) => c.id === newCase.id);
    if (idx >= 0) {
      cases[idx] = { ...newCase, updatedAt: new Date().toISOString().split('T')[0] };
    } else {
      cases.unshift(newCase);
    }
    localStorage.setItem(CASES_KEY, JSON.stringify(cases));

    // Async sync with API
    ApiClient.saveCase(newCase).catch(() => {});
    return cases;
  },

  deleteCase(id: string): ProcedureCase[] {
    const cases = this.getCases().filter((c) => c.id !== id);
    localStorage.setItem(CASES_KEY, JSON.stringify(cases));
    ApiClient.deleteCase(id).catch(() => {});
    return cases;
  },

  getClients(): Client[] {
    const data = localStorage.getItem(CLIENTS_KEY);
    if (!data) {
      return INITIAL_CLIENTS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_CLIENTS;
    }
  },

  saveClient(newClient: Client): Client[] {
    const clients = this.getClients();
    const idx = clients.findIndex((c) => c.id === newClient.id);
    if (idx >= 0) {
      clients[idx] = newClient;
    } else {
      clients.unshift(newClient);
    }
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    ApiClient.saveClient(newClient).catch(() => {});
    return clients;
  },

  getNorms(): NormDocument[] {
    const data = localStorage.getItem(NORMS_KEY);
    if (!data) {
      return INITIAL_NORMATIVE_LIBRARY;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_NORMATIVE_LIBRARY;
    }
  },

  saveNorm(norm: NormDocument): NormDocument[] {
    const norms = this.getNorms();
    const idx = norms.findIndex((n) => n.documentId === norm.documentId);
    if (idx >= 0) {
      norms[idx] = norm;
    } else {
      norms.unshift(norm);
    }
    localStorage.setItem(NORMS_KEY, JSON.stringify(norms));
    ApiClient.saveNorm(norm).catch(() => {});
    return norms;
  },
};
