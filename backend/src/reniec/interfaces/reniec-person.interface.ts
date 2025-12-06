/**
 * Interfaz para los datos de una persona consultados en RENIEC
 */
export interface ReniecPerson {
  /** Número de DNI */
  dni: string;

  /** Nombres de la persona */
  nombres: string;

  /** Apellido paterno */
  apellidoPaterno: string;

  /** Apellido materno */
  apellidoMaterno: string;

  /** Nombre completo concatenado */
  nombreCompleto: string;

  /** Fecha de nacimiento (opcional) */
  fechaNacimiento?: string;

  /** Sexo (M/F) */
  sexo?: string;

  /** Estado civil */
  estadoCivil?: string;

  /** Departamento de residencia */
  departamento?: string;

  /** Provincia de residencia */
  provincia?: string;

  /** Distrito de residencia */
  distrito?: string;

  /** Dirección de residencia */
  direccion?: string;

  /** Código de ubigeo */
  ubigeo?: string;
}

/**
 * Resultado de la validación de una persona contra RENIEC
 */
export interface ReniecValidationResult {
  /** Indica si los datos son válidos (coinciden con RENIEC) */
  isValid: boolean;

  /** Puntuación de coincidencia (0-100) */
  matchScore: number;

  /** Datos de la persona según RENIEC (si se encontró) */
  person?: ReniecPerson;

  /** Código de error (si hubo algún problema) */
  errorCode?: string;

  /** Mensaje de error descriptivo */
  errorMessage?: string;

  /** Detalles de la comparación de nombres */
  comparisonDetails?: {
    firstNameMatch: number;
    lastNameMatch: number;
    inputFirstName: string;
    inputLastName: string;
    reniecFirstName: string;
    reniecLastName: string;
  };
}

/**
 * Códigos de error de RENIEC
 */
export enum ReniecErrorCode {
  /** El servicio de RENIEC no está disponible */
  RENIEC_UNAVAILABLE = 'RENIEC_UNAVAILABLE',

  /** DNI no encontrado en RENIEC */
  DNI_NOT_FOUND = 'DNI_NOT_FOUND',

  /** Error en la llamada a la API */
  API_ERROR = 'API_ERROR',

  /** DNI inválido (formato incorrecto) */
  INVALID_DNI = 'INVALID_DNI',

  /** Servicio deshabilitado por configuración */
  SERVICE_DISABLED = 'SERVICE_DISABLED',

  /** Límite de tasa excedido */
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}
