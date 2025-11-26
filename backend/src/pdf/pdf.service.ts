import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { Browser, Page } from 'puppeteer';
import * as hbs from 'handlebars';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UploadsService } from '../uploads/uploads.service';

// Definimos la interfaz de los datos que espera la plantilla
interface CertificateData {
  recipientName: string;
  eventTitle: string;
  eventDate: string;
  eventHours: number;
  validationCode: string;
  qrCode?: string;
  signers: { fullName: string; title: string; signatureUrl: string }[];
}

@Injectable()
export class PdfService {
  private readonly templatesPath = path.join(
    __dirname,
    '../certificates/templates/certificates',
  );

  constructor(private readonly uploadsService: UploadsService) {}

  async generateCertificatePdf(data: CertificateData): Promise<string> {
    let browser: Browser | undefined;
    try {
      // 1. Leer la plantilla HBS
      const templatePath = path.join(
        this.templatesPath,
        'base-certificate.hbs',
      );
      const templateHtml = await fs.readFile(templatePath, 'utf-8');

      // 2. Compilar con Handlebars e inyectar datos
      const template = hbs.compile(templateHtml);
      const htmlContent = template(data);

      // 3. Iniciar Puppeteer (El navegador invisible)
      browser = (await puppeteer.launch({
        headless: true, // Modo rápido
        args: ['--no-sandbox'], // Necesario para que corra bien en servidores Linux/Docker
      })) as unknown as Browser;

      const page: Page = await browser.newPage();

      // 4. Cargar el HTML
      // waitUntil: 'networkidle0' asegura que carguen las fuentes e imágenes externas
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // 5. Generar el PDF en memoria (Buffer)
      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true, // ¡Importante! Diplomas suelen ser horizontales
        printBackground: true, // VITAL: Para que se impriman los colores y fondos CSS
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }, // Márgenes 0 para control total con CSS
      });

      // 6. Subir a S3/MinIO
      const fileName = `CERT-${data.validationCode}.pdf`;
      const publicUrl = await this.uploadsService.uploadFile(
        Buffer.from(pdfBuffer),
        fileName,
        'application/pdf',
      );

      console.log(`✅ PDF subido a: ${publicUrl}`);

      return publicUrl;
    } catch (error) {
      console.error('Error generando PDF:', error);
      throw new InternalServerErrorException(
        'Error al generar el documento PDF',
      );
    } finally {
      // 7. CERRAR EL NAVEGADOR SIEMPRE (Para no comerse la RAM del servidor)
      if (browser) {
        await browser.close();
      }
    }
  }
}
