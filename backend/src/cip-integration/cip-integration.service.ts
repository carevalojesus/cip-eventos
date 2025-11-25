import { Injectable, Logger } from '@nestjs/common';

interface CipValidationResponse {
  isValid: boolean;
  isHabilitado: boolean;
  message?: string;
}

@Injectable()
export class CipIntegrationService {
  private readonly logger = new Logger(CipIntegrationService.name);

  async validateCip(cipCode: string): Promise<CipValidationResponse> {
    // ⚠️ ADVERTENCIA: Esta es una implementación SIMULADA
    // En producción, esto debe conectarse a la API real del CIP

    // Validación básica de formato
    if (!cipCode || cipCode.length < 4) {
      this.logger.warn(
        `Intento de validación CIP con formato inválido: ${cipCode}`,
      );
      return {
        isValid: false,
        isHabilitado: false,
        message: 'Formato de código CIP inválido',
      };
    }

    // Simulación mejorada con logging de seguridad
    // Termina en 0 = Inválido
    // Termina en 1 = No Habilitado
    // Otro = Habilitado

    if (cipCode.endsWith('0')) {
      this.logger.warn(`Código CIP inválido detectado: ${cipCode}`);
      return {
        isValid: false,
        isHabilitado: false,
        message: 'Código CIP no existe en el sistema',
      };
    }

    if (cipCode.endsWith('1')) {
      this.logger.log(`Código CIP válido pero no habilitado: ${cipCode}`);
      return {
        isValid: true,
        isHabilitado: false,
        message: 'Colegiado no habilitado',
      };
    }

    this.logger.log(`Validación CIP exitosa para: ${cipCode}`);
    return {
      isValid: true,
      isHabilitado: true,
      message: 'Colegiado habilitado',
    };

    // TODO: Reemplazar con integración real a la API del CIP
    // Ejemplo de implementación real:
    /*
    try {
      const response = await this.httpService.get(
        `${CIP_API_URL}/validate/${cipCode}`,
        {
          headers: { Authorization: `Bearer ${CIP_API_KEY}` }
        }
      ).toPromise();

      return {
        isValid: response.data.exists,
        isHabilitado: response.data.status === 'HABILITADO',
        message: response.data.message
      };
    } catch (error) {
      this.logger.error(`Error validando CIP: ${error.message}`);
      throw new BadRequestException('Error al validar código CIP');
    }
    */
  }
}
