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

    this.logger.log(`Iniciando importación de padrón (Buffer de ${buffer.length} bytes)`);

    // Remover BOM (Byte Order Mark) si existe
    // BOM es el carácter invisible U+FEFF que Excel/Windows agrega al inicio de archivos UTF-8
    let cleanBuffer = buffer;
    if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
      this.logger.debug('BOM detectado, removiendo...');
      cleanBuffer = buffer.slice(3);
    }

    return new Promise((resolve, reject) => {
      let rowCount = 0;

      Readable.from(cleanBuffer)
        .pipe(csv())
        .on('data', (data: CsvRow) => {
          rowCount++;
          results.push(data);

          // Log del primer registro para debug
          if (rowCount === 1) {
            this.logger.debug(`Primera fila parseada: ${JSON.stringify(data)}`);
            this.logger.debug(`Headers detectados: ${Object.keys(data).join(', ')}`);
          }
        })
        .on('end', () => {
          this.logger.log(`Parseadas ${results.length} filas del CSV`);

          this.processData(results)
            .then(() => resolve(true))
            .catch((err) => {
              this.logger.error(`Error en processData: ${err.message}`, err.stack);
              reject(err instanceof Error ? err : new Error(String(err)));
            });
        })
        .on('error', (error) => {
          this.logger.error(`Error al parsear CSV: ${error.message}`, error.stack);
          reject(error);
        });
    });
  }

  private async processData(rows: CsvRow[]): Promise<void> {
    let processed = 0;
    let skipped = 0;
    let errors = 0;

    this.logger.log(`Iniciando procesamiento de ${rows.length} filas...`);

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

        if (!cip) {
          skipped++;
          if (skipped === 1) {
            this.logger.warn(`Fila sin CIP saltada: ${JSON.stringify(row)}`);
          }
          continue; // Saltar filas vacías
        }

        // Log del primer registro procesado
        if (processed === 0) {
          this.logger.debug(
            `Procesando primer registro - CIP: ${cip}, Nombre: ${fullName}, Estado: ${estado}`,
          );
        }

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
          `Error en fila (procesados: ${processed}): ${JSON.stringify(row).substring(0, 200)}`,
          e instanceof Error ? e.stack : String(e),
        );

        // Si hay muchos errores consecutivos, abortar
        if (errors > 10 && processed === 0) {
          throw new Error(`Demasiados errores al inicio del procesamiento (${errors}). Abortando.`);
        }
      }
    }

    this.logger.log(
      `Importación finalizada. Procesados: ${processed}. Saltados: ${skipped}. Errores: ${errors}`,
    );

    if (processed === 0 && rows.length > 0) {
      throw new Error(`No se procesó ningún registro de ${rows.length} filas. Verificar formato del CSV.`);
    }
  }
}
