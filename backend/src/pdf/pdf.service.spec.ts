import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as hbs from 'handlebars';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Definimos la interfaz de los datos que espera la plantilla
interface CertificateData {
  recipientName: string;
  eventTitle: string;
  eventDate: string;
  eventHours: number;
  validationCode: string;
  signers: { fullName: string; title: string; signatureUrl: string }[];
}

@Injectable()
export class PdfService {
  private readonly templatesPath = path.join(
    process.cwd(),
    'src/templates/certificates',
  );
  // Carpeta temporal donde guardaremos los PDFs generados localmente
  private readonly outputPath = path.join(
    process.cwd(),
    'uploads',
    'certificates',
  );

  constructor() {
    // Asegurar que la carpeta de salida exista al iniciar
    fs.ensureDirSync(this.outputPath);
  }

  async generateCertificatePdf(data: CertificateData): Promise<string> {
    let browser;
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
      browser = await puppeteer.launch({
        headless: true, // Modo rápido (antes 'new')
        args: ['--no-sandbox'], // Necesario para que corra bien en servidores Linux/Docker
      });

      const page = await browser.newPage();

      // 4. Cargar el HTML
      // waitUntil: 'networkidle0' asegura que carguen las fuentes e imágenes externas
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // 5. Generar el PDF
      const fileName = `CERT-${data.validationCode}-${uuidv4().slice(0, 4)}.pdf`;
      const filePath = path.join(this.outputPath, fileName);

      await page.pdf({
        path: filePath, // Dónde guardar localmente
        format: 'A4',
        landscape: true, // ¡Importante! Diplomas suelen ser horizontales
        printBackground: true, // VITAL: Para que se impriman los colores y fondos CSS
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }, // Márgenes 0 para control total con CSS
      });

      console.log(`✅ PDF generado en: ${filePath}`);

      // Retornamos la ruta relativa para guardarla en la DB
      // En producción, AQUÍ subirías el archivo a S3/Cloudinary y retornarías la URL pública.
      return `/uploads/certificates/${fileName}`;
    } catch (error) {
      console.error('Error generando PDF:', error);
      throw new InternalServerErrorException(
        'Error al generar el documento PDF',
      );
    } finally {
      // 6. CERRAR EL NAVEGADOR SIEMPRE (Para no comerse la RAM del servidor)
      if (browser) {
        await browser.close();
      }
    }
  }
}
