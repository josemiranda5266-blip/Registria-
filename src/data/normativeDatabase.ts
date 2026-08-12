/**
 * REGISTRIA - Base Normativa Registral del Automotor Argentino
 * Incluye Digesto de Normas Técnico-Registrales (DNTR), Decreto-Ley 6582/58 y Disposiciones Recientes.
 */

import { NormDocument, NormChunk, OfficialPortalLink } from '../types';

export const OFFICIAL_PORTAL_LINKS: OfficialPortalLink[] = [
  {
    id: 'link-1',
    name: 'DNRPA - Dirección Nacional del Registros del Automotor',
    organism: 'Ministerio de Justicia y Derechos Humanos - Nación',
    description: 'Portal oficial de trámites, turnos, aranceles y consultas de dominio.',
    url: 'https://www.dnrpa.gov.ar',
    verifiedDate: '2026-08-01',
    isOfficial: true,
    category: 'Oficial Nacional',
  },
  {
    id: 'link-2',
    name: 'Digesto de Normas Técnico-Registrales (DNTR) en línea',
    organism: 'DNRPA',
    description: 'Compendio normativo actualizado del régimen registral del automotor.',
    url: 'https://www.dnrpa.gov.ar/digesto/',
    verifiedDate: '2026-08-01',
    isOfficial: true,
    category: 'Normativa',
  },
  {
    id: 'link-3',
    name: 'Boletín Oficial de la República Argentina',
    organism: 'Secretaría Legal y Técnica - Presidencia de la Nación',
    description: 'Publicación de Leyes, Decretos y Disposiciones oficiales.',
    url: 'https://www.boletinoficial.gob.ar',
    verifiedDate: '2026-08-01',
    isOfficial: true,
    category: 'Boletín Oficial',
  },
  {
    id: 'link-4',
    name: 'InfoLEG - Información Legislativa y Documental',
    organism: 'Ministerio de Economía - Nación',
    description: 'Base de datos legislativa oficial con leyes y decretos nacional consolidados.',
    url: 'http://www.infoleg.gob.ar',
    verifiedDate: '2026-08-01',
    isOfficial: true,
    category: 'Legislación',
  },
  {
    id: 'link-5',
    name: 'Argentina.gob.ar - Trámites Automotor',
    organism: 'Jefatura de Gabinete de Ministros',
    description: 'Guía oficial para la ciudadanía sobre trámites de autos, motos y transporte.',
    url: 'https://www.argentina.gob.ar/servicio/transferir-el-dominio-de-un-automotor',
    verifiedDate: '2026-08-01',
    isOfficial: true,
    category: 'Guía de Trámites',
  },
  {
    id: 'link-6',
    name: 'Mi Argentina - Documentación Digital',
    organism: 'Secretaría de Innovación Pública',
    description: 'Acceso a la Cédula de Identificación Digital (Cédula Verde/Azul) y Licencia.',
    url: 'https://www.argentina.gob.ar/miargentina',
    verifiedDate: '2026-08-01',
    isOfficial: true,
    category: 'Servicio Digital',
  },
];

export const INITIAL_NORMATIVE_LIBRARY: NormDocument[] = [
  {
    documentId: 'dntr-titulo2-cap1',
    title: 'DNTR Título II, Capítulo II - Transferencias de Dominio',
    documentType: 'DIGESTO_DNTR',
    issuingAuthority: 'DNRPA',
    number: 'DNTR T.II C.II',
    year: 2024,
    publicationDate: '2024-05-15',
    effectiveDate: '2024-05-20',
    status: 'VIGENTE',
    topics: ['Transferencia', 'Formulario 08', 'Fallecimiento', 'Condominio', 'Prenda'],
    subtopics: ['Transferencia ordinaria', 'Transferencia por sucesión', 'Persona Jurídica'],
    vehicleTypes: ['AUTOMOVIL', 'MOTOVEHICULO', 'MAQUINARIA'],
    sourceUrl: 'https://www.dnrpa.gov.ar/digesto/T2C2.htm',
    officialSource: true,
    content: `
SECCIÓN 1ª: REQUISITOS GENERALES DE LA TRANSFERENCIA
1. Para peticionar la inscripción de la transferencia de un automotor, las partes deben presentar el Solicitud Tipo "08" (o 08 Digital), suscrito por el titular registral transmitente (o su apoderado) y por el adquirente.
2. Identificación de las partes:
   a) Personas humanas: DNI o Pasaporte si es extranjero.
   b) Personas jurídicas: Estatuto o contrato social inscripto, acta de designación de autoridades con mandato vigente, CUIT y DNI del representante legal.
3. Cónyuges y Asentimiento Conyugal: Si el automotor reviste carácter de bien ganancial, se requiere el asentimiento del cónyuge conforme al Art. 470 del Código Civil y Comercial de la Nación (Firma en Sección Especial del Solicitud Tipo 08 o poder especial con facultades suficientes).

SECCIÓN 2ª: FALLECIMIENTO DEL TITULAR REGISTRAL (TRANSFERENCIA POR SUCESIÓN)
1. Si el titular registral falleció, la transferencia debe fundarse en un Oficio Judicial o Testimonio con su respectiva Orden de Inscripción dictada por el Juez de la Sucesión (Declaratoria de Herederos o Aprobación de Testamento).
2. El oficio judicial debe consignar:
   a) Datos completos del vehículo (Marca, Modelo, Tipo, Dominio, Motor, Chasis).
   b) Datos completos de los adjudicatarios o adquirentes (Nombre, DNI, CUIT/CUIL, Estado civil, Domicilio).
   c) La autorización expresa al Registro Seccional para inscribir la transferencia a nombre del heredero o del tercero adquirente (Venta por tracto abreviado).
3. Si existe declaratoria de herederos y los herederos deciden vender el vehículo a un tercero, todos los herederos declarados deben firmar el Solicitud Tipo "08" acompañados por el testimonio judicial de tracto abreviado.

SECCIÓN 3ª: VERIFICACIÓN POLICIAL (FORMULARIO 12)
1. La verificación física del automotor en la planta verificadora autorizada mediante Solicitud Tipo 12 es obligatoria para transferencias de automotores de hasta 20 años de antigüedad.
2. Excepciones: Automotores de antigüedad mayor a 20 años o casos especiales determinados por la Dirección Nacional.

SECCIÓN 4ª: GRAVÁMENES Y RESTRICCIONES (PRENDAS Y EMBARGOS)
1. Si el vehículo posee Prenda inscrita, el Registro Seccional no impedirá la inscripción de la transferencia, pero notificará en forma fehaciente al acreedor prendario conforme al Art. 25 del Decreto-Ley N° 6582/58.
2. Si existe un Embargo o Inhibición General de Bienes sobre el titular, la transferencia NO podrá inscribirse hasta tanto no se levante la medida judicial o exista orden del Juez embargante.
    `,
    contentHash: 'hash-dntr-t2c2-2024',
    uploadedAt: '2026-08-01T10:00:00Z',
    version: '2024.2',
    summary: 'Regula las condiciones generales para la transferencia de automotores, requisitos de partes humanas y jurídicas, reglas en caso de titular fallecido y sucesiones, verificación física y tratamiento de prendas y embargos.',
  },
  {
    documentId: 'decreto-ley-6582-58',
    title: 'Decreto-Ley N° 6582/58 - Régimen Jurídico del Automotor',
    documentType: 'DECRETO_LEY',
    issuingAuthority: 'BOLETIN_OFICIAL',
    number: 'Ley 12.948 / Dec-Ley 6582/58',
    year: 1958,
    publicationDate: '1958-04-30',
    effectiveDate: '1958-05-02',
    status: 'VIGENTE',
    topics: ['Régimen Automotor', 'Constitutividad del Registro', 'Denuncia de Venta', 'Dominio'],
    subtopics: ['Transferencia', 'Responsabilidad civil', 'Inscripción constitutiva'],
    vehicleTypes: ['TODOS'],
    sourceUrl: 'http://www.infoleg.gob.ar/infolegInternet/anexos/15000-19999/16474/texact.htm',
    officialSource: true,
    content: `
ARTÍCULO 1°.- La transmisión del dominio de los automotores deberá formalizarse por instrumento público o privado y sólo surtirá efecto entre las partes y con relación a terceros desde la fecha de su inscripción en el Registro Nacional de la Propiedad del Automotor. (Inscripción Constitutiva).

ARTÍCULO 2°.- A los efectos del presente Registro se consideran automotores los siguientes vehículos: automóviles, colectivos, camiones, camionetas, tractores, maquinarias agrícolas o industriales automotrices y motovehículos.

ARTÍCULO 15°.- El Registro otorgará el Título del Automotor y la Cédula de Identificación del Vehículo. La cédula acredita el derecho a circular con el vehículo por las vías públicas.

ARTÍCULO 27°.- Hasta tanto se inscriba la transferencia, el titular registral responderá por los daños y perjuicios que se causen con el automotor.
Sin embargo, si el titular hubiese otorgado la posesión o tenencia del vehículo y notificado esta circunstancia al Registro Seccional mediante la Denuncia de Venta (Solicitud Tipo 11), cesará la responsabilidad civil del titular registral por los daños posteriores y el Registro dispondrá la prohibición de circular y el secuestro del vehículo si el adquirente no inscribe la transferencia dentro de los 30 días.
    `,
    contentHash: 'hash-dec-ley-6582',
    uploadedAt: '2026-08-01T10:00:00Z',
    version: 'Texto Ordenado 1997 con Modificaciones',
    summary: 'Establece el carácter constitutivo de la inscripción registral del automotor en Argentina, la responsabilidad civil del titular y la Denuncia de Venta (Art. 27).',
  },
  {
    documentId: 'disposicion-dn-29-2024',
    title: 'Disposición D.N. N° 29/2024 - Simplificación Digital y Eliminación de Cédula Azul',
    documentType: 'DISPOSICION',
    issuingAuthority: 'DNRPA',
    number: 'Disposición D.N. 29/2024',
    year: 2024,
    publicationDate: '2024-05-03',
    effectiveDate: '2024-05-13',
    status: 'VIGENTE',
    topics: ['Cédula Verde', 'Cédula Azul', 'Cédulas de Identificación', 'Simplificación'],
    subtopics: ['Eliminación Cédula Azul', 'Vigencia de Cédula Verde', 'Mi Argentina'],
    vehicleTypes: ['AUTOMOVIL', 'MOTOVEHICULO'],
    modifiesDocuments: ['dntr-titulo2-cap1'],
    sourceUrl: 'https://www.boletinoficial.gob.ar/detalleAviso/primera/307010/20240503',
    officialSource: true,
    content: `
ARTÍCULO 1°.- Deróganse las resoluciones que establecían la emisión obligatoria de la Cédula de Identificación para Autorizado a Conducir (Cédula Azul).
ARTÍCULO 2°.- Establécese que la Cédula de Identificación del Automotor (Cédula Verde) carecerá de fecha de vencimiento mientras no cambie la titularidad del vehículo. Podrá ser exhibida tanto en formato físico como digital a través de la aplicación "Mi Argentina".
ARTÍCULO 3°.- El titular registral podrá autorizar a un tercero a circular con el vehículo mediante la asignación digital de perfil de usuario autorizado a través del portal oficial de la DNRPA o la app Mi Argentina.
    `,
    contentHash: 'hash-disp-dn-29-2024',
    uploadedAt: '2026-08-01T10:00:00Z',
    version: 'Oficial 2024',
    summary: 'Elimina la Cédula Azul obligatoria, establece vigencia indefinida de la Cédula Verde para el titular mientras no cambie de dominio y habilita autorización digital en Mi Argentina.',
  },
  {
    documentId: 'dntr-titulo2-cap3-denuncias',
    title: 'DNTR Título II, Capítulo III - Denuncia de Venta y Denuncia de Compra',
    documentType: 'DIGESTO_DNTR',
    issuingAuthority: 'DNRPA',
    number: 'DNTR T.II C.III',
    year: 2024,
    publicationDate: '2024-01-10',
    effectiveDate: '2024-01-15',
    status: 'VIGENTE',
    topics: ['Denuncia de Venta', 'Denuncia de Compra', 'Solicitud Tipo 11', 'Poseedor'],
    subtopics: ['Efectos jurídicos', 'Secuestro del vehículo', 'Cese de responsabilidad civil'],
    vehicleTypes: ['TODOS'],
    sourceUrl: 'https://www.dnrpa.gov.ar/digesto/T2C3.htm',
    officialSource: true,
    content: `
SECCIÓN 1ª: DENUNCIA DE VENTA (SOLICITUD TIPO 11)
1. El titular registral que hubiere entregado la posesión del automotor sin haberse inscripto la transferencia, podrá realizar la Denuncia de Venta mediante la Solicitud Tipo 11.
2. Requisitos:
   a) Datos del comprador (Nombre completo, DNI/CUIT y Domicilio exacto).
   b) Fecha cierta de entrega de la posesión.
   c) Firma certificada del titular registral.
3. Efectos: A partir de la fecha consignada en la denuncia de venta, el titular exime su responsabilidad civil por accidentes posteriores (Art. 27 Ley 6582/58) y el Registro concede 30 días hábiles al comprador para inscribir. Vencido el plazo sin transferencia, se emite orden de prohibición de circular y secuestro del automotor.

SECCIÓN 2ª: DENUNCIA DE COMPRA Y POSESIÓN (DENUNCIA DE COMPRA)
1. Aquel que posea un automotor sin contar con la Solicitud Tipo 08 firmada por el titular registral, podrá denunciar su condición de adquirente de buena fe para regularizar su situación.
2. El Registro notificará fehacientemente al titular registral para que preste conformidad o formule oposición dentro de los 15 días hábiles.
    `,
    contentHash: 'hash-dntr-denuncias',
    uploadedAt: '2026-08-01T10:00:00Z',
    version: '2024',
    summary: 'Procedimiento, requisitos y consecuencias de la Denuncia de Venta (Formulario 11) para exonerar responsabilidad civil y de la Denuncia de Compra y Posesión.',
  },
  {
    documentId: 'dntr-personas-juridicas',
    title: 'DNTR Título I, Capítulo II, Sección 3ª - Documentación para Personas Jurídicas',
    documentType: 'DIGESTO_DNTR',
    issuingAuthority: 'DNRPA',
    number: 'DNTR T.I C.II S.3',
    year: 2023,
    publicationDate: '2023-11-01',
    effectiveDate: '2023-11-05',
    status: 'VIGENTE',
    topics: ['Persona Jurídica', 'Sociedades', 'SA', 'SRL', 'Poderes', 'Estatuto'],
    subtopics: ['Requisitos societarios', 'Inscripción en IGJ o Registro Público', 'Representante legal'],
    vehicleTypes: ['TODOS'],
    sourceUrl: 'https://www.dnrpa.gov.ar/digesto/T1C2.htm',
    officialSource: true,
    content: `
REQUISITOS PARA SOCIEDADES Y PERSONAS JURÍDICAS EN TRÁMITES REGISTRALES:
1. Documentación Obligatoria:
   a) Copia autenticada por Escribano Público del Estatuto Social o Contrato Constitutivo inscripto ante el Registro Público correspondiente (IGJ, DPPJ, etc.).
   b) Acta de Asamblea/Directorio o Gerencia donde se designan las autoridades vigentes firmantes del trámite.
   c) Constancia de CUIT de la sociedad emitida por AFIP/ARCA.
   d) DNI del Representante Legal o Apoderado firmante.
2. Facultades de Disposición:
   Se debe verificar expresamente que el Estatuto o Acta no contenga limitaciones a la facultad de disponer bienes muebles registrables. Si se requiere firma conjunta de dos directores/gerentes, ambos deberán suscribir el Solicitud Tipo 08 ante escribano o encargado de Registro.
3. Poderes otorgados por Sociedades:
   El poder notarial conferido por una sociedad debe incluir la reseña del escribano de los libros y actas donde consta la representación del poderdante y vigencia de la sociedad.
    `,
    contentHash: 'hash-personas-juridicas',
    uploadedAt: '2026-08-01T10:00:00Z',
    version: '2023.1',
    summary: 'Establece la documentación que deben presentar las sociedades comerciales (SA, SRL, SAS, etc.) para disponer o adquirir vehículos automotores.',
  },
];

export const NORMATIVE_CHUNKS: NormChunk[] = [
  {
    chunkId: 'c-1',
    documentId: 'dntr-titulo2-cap1',
    docTitle: 'DNTR Título II, Capítulo II - Transferencias de Dominio',
    pageNumber: 1,
    sectionTitle: 'Sección 1ª: Requisitos Generales de Transferencia',
    text: 'Para transferir un vehículo se requiere Solicitud Tipo 08 suscrito por transmitente y adquirente. Si el vehículo es ganancial se requiere el asentimiento conyugal conforme Art. 470 CCCN en la sección especial del 08.',
    status: 'VIGENTE',
    officialSource: true,
  },
  {
    chunkId: 'c-2',
    documentId: 'dntr-titulo2-cap1',
    docTitle: 'DNTR Título II, Capítulo II - Transferencias de Dominio',
    pageNumber: 2,
    sectionTitle: 'Sección 2ª: Fallecimiento del Titular (Sucesión)',
    text: 'Si el titular falleció, la transferencia requiere Oficio Judicial o Testimonio dictado por el Juez del Juicio Sucesorío con la orden de inscripción (Declaratoria de Herederos). Se permite tracto abreviado con firma de los herederos y testimonio.',
    status: 'VIGENTE',
    officialSource: true,
  },
  {
    chunkId: 'c-3',
    documentId: 'decreto-ley-6582-58',
    docTitle: 'Decreto-Ley N° 6582/58 - Régimen Jurídico del Automotor',
    pageNumber: 1,
    sectionTitle: 'Artículo 27 - Denuncia de Venta y Responsabilidad',
    text: 'El titular registral responde por daños hasta la transferencia. La Denuncia de Venta (Formulario 11) notificada al Registro exonera su responsabilidad civil y concede 30 días al comprador bajo apercibimiento de prohibición de circular y secuestro.',
    status: 'VIGENTE',
    officialSource: true,
  },
  {
    chunkId: 'c-4',
    documentId: 'disposicion-dn-29-2024',
    docTitle: 'Disposición D.N. N° 29/2024 - Simplificación Cédulas',
    pageNumber: 1,
    sectionTitle: 'Eliminación Cédula Azul y Vigencia Cédula Verde',
    text: 'Se elimina la Cédula Azul obligatoria. La Cédula Verde no vence mientras no cambie la titularidad. La autorización a terceros se gestiona digitalmente en Mi Argentina.',
    status: 'VIGENTE',
    officialSource: true,
  },
  {
    chunkId: 'c-5',
    documentId: 'dntr-personas-juridicas',
    docTitle: 'DNTR Título I, Capítulo II - Personas Jurídicas',
    pageNumber: 1,
    sectionTitle: 'Requisitos de Sociedades Comercial para Automotores',
    text: 'Las personas jurídicas deben presentar Estatuto inscripto en IGJ/Registro Público, Acta de designación de autoridades vigentes, CUIT y DNI del representante legal. Si requiere firmas conjuntas, ambos directores deben firmar.',
    status: 'VIGENTE',
    officialSource: true,
  },
];
