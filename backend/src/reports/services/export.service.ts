import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Parser } from 'json2csv';
import { ColumnConfig, ExcelSheet, ExportOptions } from '../interfaces/export.interface';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  /**
   * Genera archivo CSV desde array de objetos
   */
  async toCsv(
    data: any[],
    columns: ColumnConfig[],
    options?: ExportOptions,
  ): Promise<Buffer> {
    try {
      const fields = columns.map((col) => ({
        label: col.header,
        value: col.key,
      }));

      const json2csvParser = new Parser({ fields, withBOM: true }); // BOM para Excel
      const csv = json2csvParser.parse(data);

      return Buffer.from(csv, 'utf-8');
    } catch (error) {
      this.logger.error(`Error generating CSV: ${error.message}`);
      throw error;
    }
  }

  /**
   * Genera archivo Excel con múltiples hojas
   */
  async toExcel(
    sheets: ExcelSheet[],
    options?: ExportOptions,
  ): Promise<Buffer> {
    try {
      const workbook = new ExcelJS.Workbook();

      // Metadata
      workbook.creator = 'CIP Eventos';
      workbook.created = new Date();
      workbook.modified = new Date();

      for (const sheet of sheets) {
        const worksheet = workbook.addWorksheet(sheet.name);

        // Configurar columnas
        worksheet.columns = sheet.columns.map((col) => ({
          header: col.header,
          key: col.key,
          width: col.width || 15,
        }));

        // Estilo del encabezado
        worksheet.getRow(1).font = { bold: true, size: 12 };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' },
        };
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).alignment = {
          vertical: 'middle',
          horizontal: 'center',
        };

        // Agregar datos
        for (const row of sheet.data) {
          const addedRow = worksheet.addRow(row);

          // Aplicar formato según tipo de columna
          sheet.columns.forEach((col, index) => {
            const cell = addedRow.getCell(index + 1);

            switch (col.format) {
              case 'currency':
                cell.numFmt = '"S/." #,##0.00';
                cell.alignment = { horizontal: 'right' };
                break;
              case 'number':
                cell.numFmt = '#,##0';
                cell.alignment = { horizontal: 'right' };
                break;
              case 'percentage':
                cell.numFmt = '0.00"%"';
                cell.alignment = { horizontal: 'right' };
                break;
              case 'date':
                cell.numFmt = 'dd/mm/yyyy';
                cell.alignment = { horizontal: 'center' };
                break;
              case 'datetime':
                cell.numFmt = 'dd/mm/yyyy hh:mm:ss';
                cell.alignment = { horizontal: 'center' };
                break;
              default:
                cell.alignment = { horizontal: 'left' };
            }
          });
        }

        // Auto-filtro
        worksheet.autoFilter = {
          from: { row: 1, column: 1 },
          to: { row: 1, column: sheet.columns.length },
        };

        // Congelar primera fila
        worksheet.views = [{ state: 'frozen', ySplit: 1 }];
      }

      // Generar buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      this.logger.error(`Error generating Excel: ${error.message}`);
      throw error;
    }
  }

  /**
   * Genera PDF simple con tabla (usando el PdfService existente si es necesario)
   * Por ahora retorna un placeholder - se puede integrar con PdfService existente
   */
  async toPdfTable(
    data: any[],
    title: string,
    columns: ColumnConfig[],
    options?: ExportOptions,
  ): Promise<Buffer> {
    // TODO: Integrar con el servicio PDF existente del sistema
    // para generar PDFs más sofisticados con tablas
    this.logger.warn('PDF generation not yet implemented - use Excel or CSV');
    throw new Error('PDF export not implemented yet');
  }

  /**
   * Formatea un valor según su tipo
   */
  private formatValue(value: any, format?: string): string {
    if (value === null || value === undefined) return '';

    switch (format) {
      case 'currency':
        return `S/. ${Number(value).toFixed(2)}`;
      case 'percentage':
        return `${Number(value).toFixed(2)}%`;
      case 'date':
        return new Date(value).toLocaleDateString('es-PE');
      case 'datetime':
        return new Date(value).toLocaleString('es-PE');
      case 'number':
        return Number(value).toLocaleString('es-PE');
      default:
        return String(value);
    }
  }

  /**
   * Helper para crear nombre de archivo con timestamp
   */
  generateFilename(baseName: string, format: 'csv' | 'xlsx' | 'pdf'): string {
    const timestamp = new Date().toISOString().slice(0, 10);
    return `${baseName}_${timestamp}.${format}`;
  }
}
