/**
 * REGISTRIA - Catálogo de Trámites y Asistente Wizard ("¿Qué trámite necesito?")
 */

import { Procedure } from '../types';

export const PROCEDURES_CATALOG: Procedure[] = [
  {
    id: 'proc-transferencia-ordinaria',
    title: 'Transferencia de Dominio (Compraventa)',
    category: 'Transferencia',
    description: 'Trámites para transmitir el dominio de un vehículo usado entre personas humanas o jurídicas.',
    requirements: [
      'Solicitud Tipo 08 (Físico o Digital)',
      'DNI original y fotocopia del comprador y vendedor',
      'Constancia de CUIT/CUIL',
      'Título del Automotor y Cédulas de identificación',
      'Verificación Física Policial (Formulario 12) si el vehículo tiene menos de 20 años de antigüedad',
      'Formulario CETA de AFIP/ARCA (si el valor de tabla supera el tope fijado)',
      'Informe de Dominio (Recomendado para verificar embargos o prendas)',
      'Asentimiento conyugal si el titular es casado y el bien es ganancial',
    ],
    stepByStep: [
      'Verificar el estado del vehículo solicitando un Informe de Dominio previo.',
      'Realizar la verificación física en planta policial con el Formulario 12.',
      'Cargar el Formulario 08 Digital o solicitar turno en la web de DNRPA para presentación presencial.',
      'Ambas partes firman la Solicitud Tipo 08 ante el encargado del Registro o ante Escribano Público.',
      'Abonar los aranceles de transferencia e impuesto al sello provincial.',
      'Retirar la nueva Cédula de Identificación a nombre del nuevo titular.',
    ],
    formsRequired: ['08 / 08D', '12 (Verificación)', 'CETA (AFIP)', '13A / 13C (Patentes)'],
    estimatedDays: '2 a 5 días hábiles',
    warnings: [
      'Si el titular registral es casado y el bien es ganancial, su cónyuge DEBE firmar el asentimiento en la Sección del 08.',
      'Si el vehículo registra prendan o embargo, requerirá notificación previa o levantamiento de la medida.',
    ],
    relatedNormIds: ['dntr-titulo2-cap1', 'decreto-ley-6582-58', 'disposicion-dn-29-2024'],
    officialUrl: 'https://www.argentina.gob.ar/servicio/transferir-el-dominio-de-un-automotor',
  },
  {
    id: 'proc-transferencia-fallecimiento',
    title: 'Transferencia por Fallecimiento (Sucesión)',
    category: 'Sucesiones y Condominios',
    description: 'Transferencia de un vehículo cuyo titular falleció, requiriendo intervención judicial (Tracto Abreviado u Adjudicación).',
    requirements: [
      'Oficio Judicial o Testimonio dictado por el Juez de la Sucesión con orden expresa de inscripción.',
      'Declaratoria de Herederos inscrita o Auto aprobatorio de testamento.',
      'Solicitud Tipo 08 firmado por todos los herederos declarados (Tracto Abreviado) o por el Administrador Judicial.',
      'DNI y CUIT/CUIL del o los adjudicatarios / comprador.',
      'Título del Automotor y Cédula de Identificación.',
      'Verificación Policial (Formulario 12).',
    ],
    stepByStep: [
      'Obtener la orden de inscripción firmada por el Juez del Juicio Sucesorio (Oficio/Testimonio).',
      'Solicitar turno en el Registro Seccional correspondiente a la radicación del automotor.',
      'Presentar el oficio judicial original con constancia de pago de tasa de justicia/sellados.',
      'Completar el Solicitud Tipo 08 firmado por los herederos.',
      'El Registro inscribe la titularidad directamente a nombre del heredero o del comprador por tracto abreviado.',
    ],
    formsRequired: ['08 / 08D', '12 (Verificación)', 'Oficio / Testimonio Judicial'],
    estimatedDays: '5 a 10 días hábiles',
    warnings: [
      'NO se puede transferir únicamente con el certificado de defunción; se exige Sucesión e Intervención Judicial.',
      'Si existen varios herederos y uno no consiente la venta, no se podrá realizar el tracto abreviado.',
    ],
    relatedNormIds: ['dntr-titulo2-cap1'],
    officialUrl: 'https://www.dnrpa.gov.ar',
  },
  {
    id: 'proc-transferencia-persona-juridica',
    title: 'Transferencia con Persona Jurídica (Empresa/SA/SRL)',
    category: 'Personas Jurídicas',
    description: 'Trámite donde la parte vendedora o compradora es una sociedad comercial o institución.',
    requirements: [
      'Solicitud Tipo 08 firmado por el Representante Legal con facultades bastantes.',
      'Estatuto Social / Contrato Constitutivo inscripto en IGJ o Registro Público.',
      'Acta de Asamblea/Directorio o Gerencia con designación de autoridades vigentes.',
      'Constancia de CUIT de la sociedad (AFIP/ARCA).',
      'DNI del apoderado o presidente/gerente firmante.',
      'Si actúa por Poder Notarial: Escritura de Poder con reseña de personería.',
    ],
    stepByStep: [
      'Acreditar la personería jurídica ante el Registro Seccional presentando copia certificada del Estatuto y Acta vigente.',
      'Verificar si se requieren firmas conjuntas conforme estatuto.',
      'Suscribir el Solicitud Tipo 08.',
      'Acompañar Verificación Policial (Form. 12) y Certificados de retención si corresponde.',
    ],
    formsRequired: ['08 / 08D', '12', 'Documentación Societaria Certificada'],
    estimatedDays: '3 a 7 días hábiles',
    warnings: [
      'Verificar en el Estatuto que no exista restricción para disponer bienes registrables.',
      'Si la firma del representante es conjunta, ambos directores deben firmar la Solicitud 08.',
    ],
    relatedNormIds: ['dntr-personas-juridicas'],
    officialUrl: 'https://www.dnrpa.gov.ar',
  },
  {
    id: 'proc-denuncia-venta',
    title: 'Denuncia de Venta (Solicitud Tipo 11)',
    category: 'Denuncia de Venta/Compra',
    description: 'Trámite para que el vendedor notifique que entregó el vehículo y eximir su responsabilidad civil.',
    requirements: [
      'Solicitud Tipo 11 (Denuncia de Venta).',
      'DNI del titular registral.',
      'Datos exactos del comprador: Nombre y Apellido, DNI/CUIT, Domicilio real.',
      'Fecha aproximada o exacta de entrega del vehículo.',
    ],
    stepByStep: [
      'Completar la Solicitud Tipo 11 en línea o presencial.',
      'Declarar bajo juramento los datos del comprador y la fecha de entrega.',
      'Abonar el arancel correspondiente.',
      'El Registro emite la notificación fehaciente al comprador e inscribe el cese de responsabilidad civil.',
    ],
    formsRequired: ['11 (Denuncia de Venta)'],
    estimatedDays: '24 a 48 horas',
    warnings: [
      'Otorga un plazo de 30 días al comprador para transferir. Vencido dicho plazo, se emite orden de secuestro del vehículo.',
    ],
    relatedNormIds: ['decreto-ley-6582-58', 'dntr-titulo2-cap3-denuncias'],
    officialUrl: 'https://www.argentina.gob.ar/servicio/hacer-la-denuncia-de-venta-de-un-automotor',
  },
  {
    id: 'proc-duplicado-cedula',
    title: 'Duplicado de Cédula de Identificación',
    category: 'Duplicados',
    description: 'Obtención de nueva Cédula Verde por extravío, robo o deterioro.',
    requirements: [
      'Solicitud Tipo 02.',
      'DNI del titular registral.',
      'Denuncia policial de extravío o robo (o entrega de la cédula deteriorada).',
      'Verificación física policial si el registro lo requiere en casos específicos.',
    ],
    stepByStep: [
      'Radicar la denuncia de extravío o robo.',
      'Iniciar el trámite en la web de DNRPA o presentarse en el Registro de radicación.',
      'Firmar el Formulario 02.',
      'Retirar la nueva cédula o visualizar la Cédula Digital en Mi Argentina.',
    ],
    formsRequired: ['02'],
    estimatedDays: '24 a 48 horas',
    warnings: [
      'A partir de la Disposición 29/2024, la cédula verde del titular NO vence mientras mantenga la titularidad.',
    ],
    relatedNormIds: ['disposicion-dn-29-2024'],
    officialUrl: 'https://www.dnrpa.gov.ar',
  },
];

export interface WizardQuestion {
  id: string;
  text: string;
  subtext?: string;
  options: Array<{
    label: string;
    description?: string;
    nextQuestionId?: string;
    recommendedProcedureId?: string;
  }>;
}

export const WIZARD_DECISION_TREE: Record<string, WizardQuestion> = {
  q1: {
    id: 'q1',
    text: '¿Cuál es el objetivo principal del trámite que querés realizar?',
    options: [
      {
        label: 'Cambiar la propiedad del vehículo (Compré, vendí o quiero ponerlo a mi nombre)',
        nextQuestionId: 'q2',
      },
      {
        label: 'Avisar que vendí el vehículo pero el comprador no lo transfirió',
        recommendedProcedureId: 'proc-denuncia-venta',
      },
      {
        label: 'Perdí o me robaron la Cédula o el Título',
        recommendedProcedureId: 'proc-duplicado-cedula',
      },
      {
        label: 'El titular del vehículo es una empresa o sociedad',
        recommendedProcedureId: 'proc-transferencia-persona-juridica',
      },
    ],
  },
  q2: {
    id: 'q2',
    text: '¿El titular registral que figura en el título se encuentra con vida?',
    options: [
      {
        label: 'Sí, el titular está vivo y puede firmar',
        nextQuestionId: 'q3',
      },
      {
        label: 'No, el titular registral falleció',
        recommendedProcedureId: 'proc-transferencia-fallecimiento',
      },
      {
        label: 'El titular es una Persona Jurídica (SA, SRL, Empresa)',
        recommendedProcedureId: 'proc-transferencia-persona-juridica',
      },
    ],
  },
  q3: {
    id: 'q3',
    text: '¿Contás con el Formulario 08 firmado por el titular o el titular firmará en el Registro?',
    options: [
      {
        label: 'Sí, el titular firmará en el Registro o tenemos la Solicitud 08 certficada',
        recommendedProcedureId: 'proc-transferencia-ordinaria',
      },
      {
        label: 'No tengo contacto con el titular ni tengo el 08 firmado',
        recommendedProcedureId: 'proc-denuncia-venta',
      },
    ],
  },
};
