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

  /**
   * Obtiene estadísticas del padrón CIP
   */
  async getStats() {
    const [total, habilitados, noHabilitados, lastImport] = await Promise.all([
      this.memberRepo.count(),
      this.memberRepo.count({ where: { isHabilitado: true } }),
      this.memberRepo.count({ where: { isHabilitado: false } }),
      this.memberRepo
        .createQueryBuilder('member')
        .select('MAX(member.importedAt)', 'lastImport')
        .getRawOne(),
    ]);

    // Estadísticas por capítulo
    const byChapter = await this.memberRepo
      .createQueryBuilder('member')
      .select('member.chapter', 'chapter')
      .addSelect('COUNT(*)', 'count')
      .addSelect(
        'SUM(CASE WHEN member.isHabilitado = true THEN 1 ELSE 0 END)',
        'habilitados',
      )
      .groupBy('member.chapter')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      total,
      habilitados,
      noHabilitados,
      percentageHabilitados: total > 0 ? ((habilitados / total) * 100).toFixed(2) : 0,
      lastImportDate: lastImport?.lastImport || null,
      topChapters: byChapter.map((ch) => ({
        chapter: ch.chapter,
        total: parseInt(ch.count),
        habilitados: parseInt(ch.habilitados),
      })),
    };
  }

  /**
   * Obtiene información de la última importación
   */
  async getLastImportInfo() {
    const result = await this.memberRepo
      .createQueryBuilder('member')
      .select('MAX(member.importedAt)', 'lastImport')
      .addSelect('COUNT(*)', 'totalImported')
      .getRawOne();

    if (!result.lastImport) {
      return {
        hasData: false,
        message: 'No se ha importado ningún padrón aún',
      };
    }

    const importDate = new Date(result.lastImport);
    const now = new Date();
    const daysSinceImport = Math.floor(
      (now.getTime() - importDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      hasData: true,
      lastImportDate: importDate,
      totalRecords: parseInt(result.totalImported),
      daysSinceImport,
      needsUpdate: daysSinceImport > 30, // Sugerir actualización si tiene más de 30 días
    };
  }

  /**
   * Verifica un miembro CIP (similar a validateCip pero con formato simplificado)
   */
  async verifyCipMember(cipCode: string) {
    const member = await this.memberRepo.findOneBy({ cip: cipCode });

    if (!member) {
      return {
        found: false,
        cip: cipCode,
        message: 'Código CIP no encontrado en el padrón',
      };
    }

    return {
      found: true,
      cip: member.cip,
      fullName: member.fullName,
      chapter: member.chapter,
      condition: member.condition,
      isHabilitado: member.isHabilitado,
      dni: member.dni || null,
      lastUpdated: member.importedAt,
    };
  }
}
