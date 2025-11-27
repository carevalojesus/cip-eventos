import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CipMember } from './entities/cip-member.entity';
import csv from 'csv-parser';
import { Readable } from 'stream';

// Interfaz para las filas del CSV (según columnas del Excel)
interface CsvRow {
  CIP?: string;
  'APELLIDOS Y NOMBRES'?: string;
  CAPITULO?: string;
  CONDICION?: string;
  ESTADO?: string; // HABILITADO o NO HABILITADO
  DNI?: string;
  [key: string]: string | undefined;
}

@Injectable()
export class CipSeederService {
  private readonly logger = new Logger(CipSeederService.name);

  constructor(
    @InjectRepository(CipMember)
    private readonly memberRepo: Repository<CipMember>,
  ) {}

  async importCsv(buffer: Buffer): Promise<boolean> {
    const results: CsvRow[] = [];

    this.logger.log(`Iniciando importación de padrón (Buffer)`);

    return new Promise((resolve, reject) => {
      Readable.from(buffer)
        .pipe(csv())
        .on('data', (data: CsvRow) => results.push(data))
        .on('end', () => {
          this.processData(results)
            .then(() => resolve(true))
            .catch((err) =>
              reject(err instanceof Error ? err : new Error(String(err))),
            );
        })
        .on('error', (error) => reject(error));
    });
  }

  private async processData(rows: CsvRow[]): Promise<void> {
    let processed = 0;
    let errors = 0;

    // Opcional: Limpiar tabla antes de importar (Cuidado en producción)
    // await this.memberRepo.clear();

    for (const row of rows) {
      try {
        // Mapeo según las columnas de tu CSV (Nº, CIP, APELLIDOS..., CONDICION, ... , HAB?, DNI)
        // Ajusta las claves según como 'csv-parser' lea los headers exactos del archivo

        const cip = row.CIP?.trim();
        const fullName = row['APELLIDOS Y NOMBRES']?.trim();
        const estado = row.ESTADO?.trim();
        const isHabilitado = estado === 'HABILITADO';
        const dni = row.DNI?.trim();
        const chapter = row.CAPITULO?.trim();
        const condition = row.CONDICION?.trim();

        if (!cip) continue; // Saltar filas vacías

        // Upsert (Actualizar si existe, Crear si no)
        let member = await this.memberRepo.findOneBy({ cip });

        if (!member) {
          member = this.memberRepo.create({ cip });
        }

        member.fullName = fullName ?? '';
        member.dni = dni ?? '';
        member.isHabilitado = isHabilitado;
        member.chapter = chapter ?? '';
        member.condition = condition ?? '';
        member.importedAt = new Date();

        await this.memberRepo.save(member);
        processed++;

        if (processed % 100 === 0) {
          this.logger.log(`Procesados: ${processed}...`);
        }
      } catch (e) {
        errors++;
        this.logger.error(
          `Error en fila: ${JSON.stringify(row)}`,
          e instanceof Error ? e.stack : String(e),
        );
      }
    }

    this.logger.log(
      `Importación finalizada. Procesados: ${processed}. Errores: ${errors}`,
    );
  }
}
