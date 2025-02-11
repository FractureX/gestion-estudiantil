// Base
export const URL_BASE = 'http://127.0.0.1:8000';
const URL_API = 'api';

// Validar token
export const URL_TOKEN_VALIDATE = `${URL_BASE}/${URL_API}/validate_token/`;

// Roles
export const URL_ROL_SELECT = `${URL_BASE}/${URL_API}/rol/`;

// Usuario
export const URL_USUARIO_SELECT = `${URL_BASE}/${URL_API}/usuario/`;
export const URL_USUARIO_SELECT_BY_EMAIL = `${URL_BASE}/${URL_API}/usuario/email?email=`;
export const URL_USUARIO_SELECT_BY_DNI = `${URL_BASE}/${URL_API}/usuario/dni?dni=`;
export const URL_USUARIO_SELECT_INFO = `${URL_BASE}/${URL_API}/user/info/`;
export const URL_USUARIO_LOGIN = `${URL_BASE}/${URL_API}/usuario/login/`;
export const URL_USUARIO_CREATE = `${URL_BASE}/${URL_API}/usuario/`;
export const URL_USUARIO_UPDATE = `${URL_BASE}/${URL_API}/usuario/{id}/`;
export const URL_USUARIO_SEND_OTP = `${URL_BASE}/${URL_API}/user/otp/`;
export const URL_USUARIO_VERIFY_OTP = `${URL_BASE}/${URL_API}/user/otp/verify/`;

// Notificaciones
export const URL_NOTIFICACION_SELECT_BY_ID_USUARIO = `${URL_BASE}/${URL_API}/notificacion/`;
export const URL_NOTIFICACION_CREATE = `${URL_BASE}/${URL_API}/notificacion/`;
export const URL_NOTIFICACION_UPDATE = `${URL_BASE}/${URL_API}/notificacion/{id}/`;

// Periodo
export const URL_PERIODO_SELECT_ALL = `${URL_BASE}/${URL_API}/periodo/`;
export const URL_PERIODO_UPDATE = `${URL_BASE}/${URL_API}/periodo/{id}/`;
export const URL_PERIODO_CREATE = `${URL_BASE}/${URL_API}/periodo/`;
export const URL_PERIODO_DELETE = `${URL_BASE}/${URL_API}/periodo/{id}/`;

// Materia
export const URL_MATERIA_SELECT_ALL = `${URL_BASE}/${URL_API}/materia/`;
export const URL_MATERIA_UPDATE = `${URL_BASE}/${URL_API}/materia/{id}/`;
export const URL_MATERIA_CREATE = `${URL_BASE}/${URL_API}/materia/`;
export const URL_MATERIA_DELETE = `${URL_BASE}/${URL_API}/materia/{id}/`;

// Materia periodo
export const URL_MATERIA_PERIODO_SELECT_BY_ID = `${URL_BASE}/${URL_API}/materia-periodo/{id}/`;
export const URL_MATERIA_PERIODO_SELECT_BY_ID_PERIODO = `${URL_BASE}/${URL_API}/materia-periodo/`;
export const URL_MATERIA_PERIODO_SELECT_BY_ID_PERIODO_ID_MATERIA = `${URL_BASE}/${URL_API}/materia-periodo/`;
export const URL_MATERIA_PERIODO_SELECT_ALL = `${URL_BASE}/${URL_API}/materia-periodo/`;
export const URL_MATERIA_PERIODO_UPDATE = `${URL_BASE}/${URL_API}/materia-periodo/{id}/`;
export const URL_MATERIA_PERIODO_CREATE = `${URL_BASE}/${URL_API}/materia-periodo/`;
export const URL_MATERIA_PERIODO_DELETE = `${URL_BASE}/${URL_API}/materia-periodo/{id}/`;

// Documentos PDF
export const URL_DOCUMENTOS_PDF_SELECT_ALL = `${URL_BASE}/${URL_API}/documento-pdf/`;
export const URL_DOCUMENTOS_PDF_SELECT_BY_ID_USUARIO = `${URL_BASE}/${URL_API}/documento-pdf/`;
export const URL_DOCUMENTOS_PDF_SELECT_BY_ID_USUARIO_ID_MATERIA_PERIODO = `${URL_BASE}/${URL_API}/documento-pdf/`;
export const URL_DOCUMENTOS_PDF_CREATE = `${URL_BASE}/${URL_API}/documento-pdf/`;

// Evaluación
export const URL_EVALUACION_SELECT_BY_ID = `${URL_BASE}/${URL_API}/evaluacion/{id}`;
export const URL_EVALUACION_SELECT_BY_ID_USUARIO = `${URL_BASE}/${URL_API}/evaluacion/`;
export const URL_EVALUACION_SELECT_BY_ID_DOCUMENTO_PDF = `${URL_BASE}/${URL_API}/evaluacion/`;
export const URL_EVALUACION_UPDATE = `${URL_BASE}/${URL_API}/evaluacion/{id}/`;

// Preguntas
export const URL_PREGUNTA_SELECT_ALL = `${URL_BASE}/${URL_API}/pregunta/`;
export const URL_PREGUNTA_SELECT_BY_ID_EVALUACION = `${URL_BASE}/${URL_API}/pregunta/`;
export const URL_PREGUNTA_UPDATE_BY_ID = `${URL_BASE}/${URL_API}/pregunta/{id}/`;

// Historial
export const URL_HISTORIAL_SELECT_BY_ID_USUARIO = `${URL_BASE}/${URL_API}/historial/`;
export const URL_HISTORIAL_CREATE = `${URL_BASE}/${URL_API}/historial/`;