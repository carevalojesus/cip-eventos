import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  NotFoundException,
  Logger,
  Delete,
} from '@nestjs/common';
import { ReniecService } from './reniec.service';
import { ValidatePersonDto } from './dto/validate-person.dto';
import { ReniecQueryDto } from './dto/reniec-query.dto';
import {
  ReniecResponseDto,
  ReniecValidationResponseDto,
} from './dto/reniec-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('RENIEC')
@Controller('reniec')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReniecController {
  private readonly logger = new Logger(ReniecController.name);

  constructor(private readonly reniecService: ReniecService) {}

  @Get('query/:dni')
  @Roles('ORG_ADMIN', 'SUPER_ADMIN', 'ORG_STAFF_ACCESO')
  @ApiOperation({
    summary: 'Consultar datos de una persona por DNI en RENIEC',
    description:
      'Consulta los datos oficiales de una persona en RENIEC dado su número de DNI. Requiere permisos de administrador o staff de acceso.',
  })
  @ApiParam({
    name: 'dni',
    description: 'Número de DNI (8 dígitos)',
    example: '12345678',
  })
  @ApiResponse({
    status: 200,
    description: 'Datos encontrados en RENIEC',
    type: ReniecResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'DNI no encontrado en RENIEC',
  })
  async queryByDni(@Param() params: ReniecQueryDto): Promise<ReniecResponseDto> {
    this.logger.log(`Querying RENIEC for DNI: ${params.dni}`);

    const result = await this.reniecService.queryByDni(params.dni);

    if (!result) {
      throw new NotFoundException({
        found: false,
        dni: params.dni,
        message: 'No se encontró información para este DNI en RENIEC',
        errorCode: 'DNI_NOT_FOUND',
      });
    }

    return {
      found: true,
      dni: params.dni,
      data: result,
    };
  }

  @Post('validate')
  @Roles('ORG_ADMIN', 'SUPER_ADMIN', 'ORG_STAFF_ACCESO')
  @ApiOperation({
    summary: 'Validar datos de una persona contra RENIEC',
    description:
      'Valida si el nombre y apellidos ingresados coinciden con los datos oficiales de RENIEC para un DNI dado. Retorna un puntaje de coincidencia.',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado de la validación',
    type: ReniecValidationResponseDto,
  })
  async validate(
    @Body() dto: ValidatePersonDto,
  ): Promise<ReniecValidationResponseDto> {
    this.logger.log(`Validating person data for DNI: ${dto.dni}`);

    const result = await this.reniecService.validatePerson(
      dto.dni,
      dto.firstName,
      dto.lastName,
    );

    return {
      isValid: result.isValid,
      matchScore: result.matchScore,
      person: result.person,
      errorCode: result.errorCode,
      message: this.getValidationMessage(result.isValid, result.matchScore),
      comparisonDetails: result.comparisonDetails,
    };
  }

  @Get('service-info')
  @Roles('SUPER_ADMIN')
  @ApiOperation({
    summary: 'Obtener información del servicio RENIEC',
    description:
      'Obtiene información sobre la configuración y estado del servicio de validación RENIEC. Solo para super administradores.',
  })
  @ApiResponse({
    status: 200,
    description: 'Información del servicio',
  })
  async getServiceInfo() {
    return this.reniecService.getServiceInfo();
  }

  @Delete('cache/:dni')
  @Roles('SUPER_ADMIN')
  @ApiOperation({
    summary: 'Limpiar caché de RENIEC para un DNI',
    description:
      'Elimina los datos en caché de RENIEC para un DNI específico. Útil para forzar una nueva consulta.',
  })
  @ApiParam({
    name: 'dni',
    description: 'Número de DNI (8 dígitos)',
    example: '12345678',
  })
  @ApiResponse({
    status: 200,
    description: 'Caché limpiado exitosamente',
  })
  async clearCache(@Param() params: ReniecQueryDto) {
    this.logger.log(`Clearing RENIEC cache for DNI: ${params.dni}`);
    await this.reniecService.clearCache(params.dni);
    return {
      success: true,
      message: `Caché limpiado para DNI ${params.dni}`,
    };
  }

  /**
   * Genera un mensaje descriptivo basado en el resultado de la validación
   */
  private getValidationMessage(isValid: boolean, matchScore: number): string {
    if (isValid) {
      if (matchScore >= 95) {
        return 'Los datos coinciden perfectamente con RENIEC';
      } else if (matchScore >= 90) {
        return 'Los datos coinciden muy bien con RENIEC';
      } else {
        return 'Los datos coinciden aceptablemente con RENIEC';
      }
    } else {
      if (matchScore >= 70) {
        return 'Los datos tienen similitudes con RENIEC pero no alcanzan el umbral mínimo. Se recomienda revisar.';
      } else if (matchScore >= 50) {
        return 'Los datos tienen diferencias significativas con RENIEC. Se requiere revisión.';
      } else {
        return 'Los datos no coinciden con RENIEC. Se requiere verificación manual.';
      }
    }
  }
}
