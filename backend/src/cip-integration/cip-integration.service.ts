import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CipMember } from './entities/cip-member.entity';

interface CipValidationResponse {
  isValid: boolean;
  isHabilitado: boolean;
  message?: string;
  memberData?: {
    fullName: string;
    chapter: string;
    condition: string;
  };
}

@Injectable()
export class CipIntegrationService {
  private readonly logger = new Logger(CipIntegrationService.name);

  constructor(
    @InjectRepository(CipMember)
    private readonly memberRepo: Repository<CipMember>,
  ) {}

  async validateCip(cipCode: string): Promise<CipValidationResponse> {
    // 1. Consultar Base de Datos Local (Sincronizada con el Excel)
    const member = await this.memberRepo.findOneBy({ cip: cipCode });

    if (!member) {
      return {
        isValid: false,
        isHabilitado: false,
        message: 'Código CIP no encontrado en el padrón',
      };
    }

    // 2. Retornar estado real
    if (member.isHabilitado) {
      return {
        isValid: true,
        isHabilitado: true,
        message: 'Ingeniero Habilitado',
        memberData: {
          fullName: member.fullName,
          chapter: member.chapter,
          condition: member.condition,
        },
      };
    } else {
      return {
        isValid: true,
        isHabilitado: false,
        message: 'Ingeniero NO Habilitado',
        memberData: {
          fullName: member.fullName,
          chapter: member.chapter,
          condition: member.condition,
        },
      };
    }
  }

  // Método extra útil: Buscar por DNI (Para cuando se registran con DNI)
  async findByDni(dni: string) {
    return await this.memberRepo.findOneBy({ dni });
  }
}
