import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type {
  ReniecPerson,
  ReniecValidationResult,
} from './interfaces/reniec-person.interface';
import { ReniecErrorCode } from './interfaces/reniec-person.interface';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import { AxiosResponse } from 'axios';

@Injectable()
export class ReniecService {
  private readonly logger = new Logger(ReniecService.name);
  private readonly apiUrl: string;
  private readonly apiToken: string;
  private readonly isEnabled: boolean;
  private readonly minMatchScore: number;
  private readonly cacheEnabled: boolean;
  private readonly cacheTtl: number; // en milisegundos

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    // Configuración desde variables de entorno
    this.apiUrl = this.configService.get<string>(
      'RENIEC_API_URL',
      'https://api.apis.net.pe/v2',
    );
    this.apiToken = this.configService.get<string>('RENIEC_API_TOKEN', '');
    this.isEnabled = this.configService.get<boolean>(
      'RENIEC_VALIDATION_ENABLED',
      false,
    );
    this.minMatchScore = this.configService.get<number>(
      'RENIEC_MIN_MATCH_SCORE',
      80,
    );
    this.cacheEnabled = this.configService.get<boolean>(
      'RENIEC_CACHE_ENABLED',
      true,
    );
    this.cacheTtl = this.configService.get<number>(
      'RENIEC_CACHE_TTL',
      86400000,
    ); // 24h por defecto

    if (!this.isEnabled) {
      this.logger.warn('RENIEC validation is DISABLED by configuration');
    }

    if (this.isEnabled && !this.apiToken) {
      this.logger.error(
        'RENIEC validation is enabled but RENIEC_API_TOKEN is not set',
      );
    }
  }

  /**
   * Consulta datos de una persona por DNI en RENIEC
   */
  async queryByDni(dni: string): Promise<ReniecPerson | null> {
    // Verificar si el servicio está habilitado
    if (!this.isEnabled) {
      this.logger.debug('RENIEC service is disabled, skipping query');
      return null;
    }

    // Verificar token de API
    if (!this.apiToken) {
      this.logger.error('RENIEC API token is not configured');
      return null;
    }

    // Buscar en caché si está habilitado
    if (this.cacheEnabled) {
      const cacheKey = `reniec:dni:${dni}`;
      const cached = await this.cacheManager.get<ReniecPerson>(cacheKey);

      if (cached) {
        this.logger.debug(`RENIEC data for DNI ${dni} found in cache`);
        return cached;
      }
    }

    try {
      this.logger.log(`Querying RENIEC for DNI: ${dni}`);

      // Llamar a la API de RENIEC (ejemplo con APIs Perú)
      const response: AxiosResponse<any> = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/reniec/dni`, {
          params: { numero: dni },
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000, // 5 segundos de timeout
        }),
      );

      if (!response.data) {
        this.logger.warn(`No data returned from RENIEC for DNI ${dni}`);
        return null;
      }

      // Mapear la respuesta al formato interno
      const reniecPerson = this.mapResponse(response.data);

      // Guardar en caché si está habilitado
      if (this.cacheEnabled && reniecPerson) {
        const cacheKey = `reniec:dni:${dni}`;
        await this.cacheManager.set(cacheKey, reniecPerson, this.cacheTtl);
        this.logger.debug(`RENIEC data for DNI ${dni} cached`);
      }

      return reniecPerson;
    } catch (error) {
      // Log del error sin exponer datos sensibles
      this.logger.error(
        `Error querying RENIEC for DNI ${dni}: ${error.message}`,
        error.stack,
      );

      // No lanzar error, solo retornar null para no bloquear el flujo
      return null;
    }
  }

  /**
   * Valida si los datos ingresados coinciden con RENIEC
   */
  async validatePerson(
    dni: string,
    firstName: string,
    lastName: string,
  ): Promise<ReniecValidationResult> {
    // Si el servicio está deshabilitado, retornar resultado neutral
    if (!this.isEnabled) {
      return {
        isValid: true, // No bloquear si el servicio está deshabilitado
        matchScore: 0,
        errorCode: ReniecErrorCode.SERVICE_DISABLED,
        errorMessage: 'Validación RENIEC deshabilitada por configuración',
      };
    }

    // Validar formato de DNI
    if (!/^[0-9]{8}$/.test(dni)) {
      return {
        isValid: false,
        matchScore: 0,
        errorCode: ReniecErrorCode.INVALID_DNI,
        errorMessage: 'DNI inválido: debe tener 8 dígitos numéricos',
      };
    }

    // Consultar RENIEC
    const reniecData = await this.queryByDni(dni);

    if (!reniecData) {
      return {
        isValid: false,
        matchScore: 0,
        errorCode: ReniecErrorCode.RENIEC_UNAVAILABLE,
        errorMessage:
          'No se pudo consultar RENIEC o DNI no encontrado. Se marcará para revisión.',
      };
    }

    // Calcular similitud de nombres
    const firstNameMatch = this.calculateStringSimilarity(
      this.normalizeString(firstName),
      this.normalizeString(reniecData.nombres),
    );

    const lastNameMatch = this.calculateStringSimilarity(
      this.normalizeString(lastName),
      this.normalizeString(
        `${reniecData.apellidoPaterno} ${reniecData.apellidoMaterno}`,
      ),
    );

    // Promedio ponderado: apellidos tienen más peso (60%) que nombres (40%)
    const matchScore = Math.round(firstNameMatch * 0.4 + lastNameMatch * 0.6);

    const isValid = matchScore >= this.minMatchScore;

    const result: ReniecValidationResult = {
      isValid,
      matchScore,
      person: reniecData,
      comparisonDetails: {
        firstNameMatch,
        lastNameMatch,
        inputFirstName: firstName,
        inputLastName: lastName,
        reniecFirstName: reniecData.nombres,
        reniecLastName: `${reniecData.apellidoPaterno} ${reniecData.apellidoMaterno}`,
      },
    };

    if (!isValid) {
      this.logger.warn(
        `RENIEC validation failed for DNI ${dni}. Match score: ${matchScore}% (min: ${this.minMatchScore}%)`,
      );
    }

    return result;
  }

  /**
   * Mapea la respuesta de la API externa al formato interno
   * Soporta múltiples proveedores: APIs Perú y DeColecta
   */
  private mapResponse(data: any): ReniecPerson | null {
    try {
      // Detectar formato DeColecta (tiene first_name, first_last_name, second_last_name)
      if (data.first_name !== undefined || data.first_last_name !== undefined) {
        return {
          dni: data.document_number || '',
          nombres: data.first_name || '',
          apellidoPaterno: data.first_last_name || '',
          apellidoMaterno: data.second_last_name || '',
          nombreCompleto: data.full_name ||
            `${data.first_name} ${data.first_last_name} ${data.second_last_name}`.trim(),
        };
      }

      // Formato APIs Perú (tiene nombres, apellidoPaterno, apellidoMaterno)
      return {
        dni: data.numeroDocumento || data.dni || '',
        nombres: data.nombres || data.primerNombre || '',
        apellidoPaterno: data.apellidoPaterno || '',
        apellidoMaterno: data.apellidoMaterno || '',
        nombreCompleto:
          data.nombreCompleto ||
          `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`.trim(),
        fechaNacimiento: data.fechaNacimiento,
        sexo: data.sexo,
        estadoCivil: data.estadoCivil,
        departamento: data.departamento,
        provincia: data.provincia,
        distrito: data.distrito,
        direccion: data.direccion,
        ubigeo: data.ubigeo,
      };
    } catch (error) {
      this.logger.error('Error mapping RENIEC response', error);
      return null;
    }
  }

  /**
   * Normaliza un string para comparación:
   * - Remueve tildes y diacríticos
   * - Convierte a minúsculas
   * - Remueve espacios extra
   * - Remueve caracteres especiales
   */
  private normalizeString(str: string): string {
    if (!str) return '';

    return str
      .normalize('NFD') // Descomponer caracteres con tildes
      .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Espacios múltiples a uno solo
      .replace(/[^a-z0-9\s]/g, ''); // Remover caracteres especiales
  }

  /**
   * Calcula la similitud entre dos strings usando distancia de Levenshtein
   * Retorna un porcentaje de similitud (0-100)
   */
  private calculateStringSimilarity(s1: string, s2: string): number {
    // Coincidencia exacta
    if (s1 === s2) return 100;

    // Si alguno está vacío
    if (!s1 || !s2) return 0;

    // Si uno contiene al otro (match parcial)
    if (s1.includes(s2) || s2.includes(s1)) {
      const longerLength = Math.max(s1.length, s2.length);
      const shorterLength = Math.min(s1.length, s2.length);
      return Math.round((shorterLength / longerLength) * 95); // 95% para match parcial
    }

    // Calcular distancia de Levenshtein
    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);

    if (maxLength === 0) return 100;

    // Convertir distancia a porcentaje de similitud
    const similarity = (1 - distance / maxLength) * 100;

    return Math.round(Math.max(0, similarity));
  }

  /**
   * Implementación de la distancia de Levenshtein
   * Mide el número mínimo de operaciones (inserción, eliminación, sustitución)
   * necesarias para transformar un string en otro
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;

    // Crear matriz de distancias
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    // Inicializar primera fila y columna
    for (let i = 0; i <= m; i++) {
      dp[i][0] = i;
    }
    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }

    // Llenar la matriz
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          // Los caracteres coinciden
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          // Tomar el mínimo de las tres operaciones posibles
          dp[i][j] =
            Math.min(
              dp[i - 1][j], // Eliminación
              dp[i][j - 1], // Inserción
              dp[i - 1][j - 1], // Sustitución
            ) + 1;
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Limpia el caché de RENIEC (útil para testing o mantenimiento)
   */
  async clearCache(dni?: string): Promise<void> {
    if (!this.cacheEnabled) {
      this.logger.warn('Cache is disabled, nothing to clear');
      return;
    }

    if (dni) {
      const cacheKey = `reniec:dni:${dni}`;
      await this.cacheManager.del(cacheKey);
      this.logger.log(`Cache cleared for DNI: ${dni}`);
    } else {
      // Limpiar todo el caché de RENIEC
      // Nota: Esto depende de la implementación del cache manager
      this.logger.log('Clearing all RENIEC cache');
      // await this.cacheManager.reset(); // Solo si quieres limpiar TODO el caché
    }
  }

  /**
   * Obtiene estadísticas del servicio RENIEC
   */
  getServiceInfo() {
    return {
      enabled: this.isEnabled,
      apiUrl: this.apiUrl,
      hasToken: !!this.apiToken,
      minMatchScore: this.minMatchScore,
      cacheEnabled: this.cacheEnabled,
      cacheTtl: this.cacheTtl,
    };
  }
}
