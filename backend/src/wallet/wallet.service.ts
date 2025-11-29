import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleAuth } from 'google-auth-library';
import * as jwt from 'jsonwebtoken'; // Para Google Wallet
import { JwtService } from '@nestjs/jwt'; // Para nuestro token firmado
import { I18nService, I18nContext } from 'nestjs-i18n';
import { Registration } from '../registrations/entities/registration.entity';
import { Event } from '../events/entities/event.entity';
import * as fs from 'fs';

interface GoogleServiceAccountCredentials {
  client_email: string;
  private_key: string;
  project_id: string;
}

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private issuerId: string;
  private credentials: GoogleServiceAccountCredentials;
  private googleAuth: GoogleAuth;
  private issuerName: string;
  private reviewStatus: string;

  constructor(
    private configService: ConfigService,
    private readonly i18n: I18nService,
    private readonly jwtService: JwtService,
  ) {
    // Validar configuración requerida
    const issuerId = this.configService.get<string>('GOOGLE_WALLET_ISSUER_ID');
    if (!issuerId) {
      throw new Error('GOOGLE_WALLET_ISSUER_ID is not defined in the configuration');
    }
    this.issuerId = issuerId;

    // Configuración de valores
    this.issuerName = this.configService.get<string>('GOOGLE_WALLET_ISSUER_NAME') || 'Colegio de Ingenieros del Perú';
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    this.reviewStatus = nodeEnv === 'production' ? 'UNDER_REVIEW' : 'DRAFT';

    // Carga segura de credenciales usando GoogleAuth
    const keyPath = this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS');
    if (!keyPath) {
      this.logger.error('GOOGLE_APPLICATION_CREDENTIALS is not defined. Wallet features will not work.');
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS is required for Google Wallet integration');
    }

    try {
      // Verificar que el archivo existe
      if (!fs.existsSync(keyPath)) {
        throw new Error(`Google credentials file not found at path: ${keyPath}`);
      }

      // Cargar credenciales de forma segura
      const credentialsData = fs.readFileSync(keyPath, 'utf8');
      this.credentials = JSON.parse(credentialsData);

      // Validar estructura de credenciales
      if (!this.credentials.client_email || !this.credentials.private_key) {
        throw new Error('Invalid Google credentials file: missing required fields');
      }

      // Inicializar GoogleAuth
      this.googleAuth = new GoogleAuth({
        keyFilename: keyPath,
        scopes: ['https://www.googleapis.com/auth/wallet_object.issuer']
      });

      this.logger.log('Google Wallet service initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize Google Wallet credentials: ${error.message}`, error.stack);
      throw new Error(`Google Wallet initialization failed: ${error.message}`);
    }
  }

  // 1. Generar el Link "Add to Google Wallet"
  async createWalletLink(registration: Registration): Promise<string> {
    try {
      // Validar que la registration tenga las relaciones necesarias
      this.validateRegistration(registration);

      const event = registration.event;
      const attendee = registration.attendee;

      // Validar datos requeridos
      if (!registration.ticketCode) {
        throw new BadRequestException(
          this.i18n.t('wallet.missing_ticket_code', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      if (!event.title || !event.startAt || !event.endAt) {
        throw new BadRequestException(
          this.i18n.t('wallet.missing_event_fields', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      if (!attendee.firstName || !attendee.lastName) {
        throw new BadRequestException(
          this.i18n.t('wallet.missing_attendee_fields', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      // Definimos IDs únicos para Google (Google permite puntos en los IDs)
      const classId = `${this.issuerId}.event_${this.sanitizeId(event.id)}`;
      const objectId = `${this.issuerId}.ticket_${this.sanitizeId(registration.id)}`;

      // Payload del JWT para Google
      const payload = {
        iss: this.credentials.client_email,
        aud: 'google',
        typ: 'savetowallet',
        iat: Math.floor(Date.now() / 1000),
        origins: [],
        payload: {
          eventTicketClasses: [
            this.buildEventClass(event, classId)
          ],
          eventTicketObjects: [
            this.buildTicketObject(registration, classId, objectId)
          ]
        }
      };

      // Firmamos el token con la llave privada de Google Service Account
      const token = jwt.sign(payload, this.credentials.private_key, {
        algorithm: 'RS256'
      });

      this.logger.log(`Generated wallet link for registration ${registration.id}`);
      return `https://pay.google.com/gp/v/save/${token}`;
    } catch (error) {
      this.logger.error(`Failed to create wallet link for registration ${registration.id}: ${error.message}`, error.stack);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        this.i18n.t('wallet.wallet_link_failed', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }
  }

  // Validar que la registration tenga todas las relaciones necesarias
  private validateRegistration(registration: Registration): void {
    if (!registration) {
      throw new BadRequestException(
        this.i18n.t('wallet.registration_required', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    if (!registration.event) {
      throw new BadRequestException(
        this.i18n.t('wallet.registration_missing_event', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    if (!registration.attendee) {
      throw new BadRequestException(
        this.i18n.t('wallet.registration_missing_attendee', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }
  }

  // Sanitizar ID para Google Wallet (remover caracteres no permitidos)
  private sanitizeId(id: string): string {
    // Google Wallet permite: letras, números, puntos, guiones bajos y guiones
    // Reemplazamos cualquier otro carácter
    return id.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  // --- Helpers para construir los objetos JSON de Google ---

  private buildEventClass(event: Event, classId: string) {
    // Obtener URL del logo por defecto desde configuración
    const defaultLogoUrl = this.configService.get<string>('GOOGLE_WALLET_DEFAULT_LOGO') ||
      'https://storage.googleapis.com/cip-eventos/logo-cip-default.png';

    return {
      id: classId,
      issuerName: this.issuerName,
      eventName: {
        defaultValue: { language: "es-PE", value: event.title }
      },
      // Logo del evento (debe ser HTTPS público)
      logo: {
        sourceUri: { uri: event.imageUrl || defaultLogoUrl }
      },
      // Fecha y Hora
      dateTime: {
        start: event.startAt.toISOString(),
        end: event.endAt.toISOString()
      },
      reviewStatus: this.reviewStatus
    };
  }

  private buildTicketObject(registration: Registration, classId: string, objectId: string) {
    return {
      id: objectId,
      classId: classId,
      state: "ACTIVE",
      barcode: {
        type: "QR_CODE",
        value: registration.ticketCode,
        alternateText: registration.ticketCode
      },
      ticketHolderName: `${registration.attendee.firstName} ${registration.attendee.lastName}`,
      seatInfo: {
        seat: {
          defaultValue: { language: "es-PE", value: "General" }
        }
      }
    };
  }

  // --- Seguridad: Tokens firmados para endpoints públicos ---

  generateSignedUrl(registrationId: string): string {
    const payload = { sub: registrationId };
    const token = this.jwtService.sign(payload, { expiresIn: '24h' }); // Link válido por 24h

    // Construir URL completa
    const apiUrl = this.configService.get<string>('API_URL') || 'http://localhost:3000';
    return `${apiUrl}/wallet/${registrationId}?token=${token}`;
  }

  verifySignedToken(token: string, registrationId: string): void {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.sub !== registrationId) {
        throw new BadRequestException('Invalid token for this registration');
      }
    } catch (error) {
      this.logger.warn(`Invalid signed token for registration ${registrationId}: ${error.message}`);
      throw new BadRequestException('Invalid or expired token');
    }
  }
}