import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class PaypalService {
  private readonly logger = new Logger(PaypalService.name);
  private readonly apiUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(private configService: ConfigService) {
    // Sandbox: https://api-m.sandbox.paypal.com
    // Live: https://api-m.paypal.com
    const apiUrl = this.configService.get<string>('PAYPAL_API_URL');
    const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID');
    const clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET');

    if (!apiUrl || !clientId || !clientSecret) {
      throw new InternalServerErrorException(
        'Faltan variables de entorno de PayPal (PAYPAL_API_URL, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET)',
      );
    }

    this.apiUrl = apiUrl;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  // 1. Obtener Token de Acceso (OAuth 2.0)
  private async getAccessToken(): Promise<string> {
    try {
      const auth = Buffer.from(
        `${this.clientId}:${this.clientSecret}`,
      ).toString('base64');

      const { data } = await axios.post<{ access_token: string }>(
        `${this.apiUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000, // 10 segundos
        },
      );
      return data.access_token;
    } catch (error) {
      this.handlePaypalError(error, 'Error obteniendo token PayPal');
      throw new InternalServerErrorException(
        'Error de autenticación con PayPal',
      );
    }
  }

  // 2. Crear Orden (Standard Checkout v2)
  async createOrder(amount: number, currency: string = 'USD'): Promise<string> {
    const accessToken = await this.getAccessToken();

    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2), // PayPal exige string con 2 decimales
          },
        },
      ],
    };

    try {
      const { data } = await axios.post<{ id: string }>(
        `${this.apiUrl}/v2/checkout/orders`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 segundos
        },
      );

      return data.id; // Este es el OrderID (ej: "5O190127TN364715T")
    } catch (error) {
      this.handlePaypalError(error, 'Error creando orden PayPal');
      throw new InternalServerErrorException(
        'No se pudo crear la orden de PayPal',
      );
    }
  }

  // 3. Capturar Pago (Cerrar el trato)
  async capturePayment(orderId: string): Promise<{
    success: boolean;
    transactionId?: string;
    metadata?: Record<string, unknown>;
    status?: string;
  }> {
    const accessToken = await this.getAccessToken();

    try {
      const { data } = await axios.post<{
        id: string;
        status: string;
        [key: string]: unknown;
      }>(
        `${this.apiUrl}/v2/checkout/orders/${orderId}/capture`,
        {}, // Body vacío para capture
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 segundos
        },
      );

      // La API v2 retorna 'COMPLETED' cuando el dinero se mueve exitosamente
      if (data.status === 'COMPLETED') {
        return {
          success: true,
          transactionId: data.id, // ID de la captura
          metadata: data as Record<string, unknown>, // Guardamos la respuesta completa para auditoría
        };
      }

      return { success: false, status: data.status };
    } catch (error) {
      this.handlePaypalError(error, 'Error capturando pago PayPal');
      throw new InternalServerErrorException(
        'Error al procesar el cobro en PayPal',
      );
    }
  }

  private handlePaypalError(error: unknown, message: string): void {
    if (axios.isAxiosError(error)) {
      this.logger.error(message, error.response?.data);
    } else {
      this.logger.error(message, error);
    }
  }
}
