# Guía de Integración del Módulo de Mensajería

Esta guía te ayudará a integrar el módulo de mensajería (SMS y WhatsApp) en tu código existente.

## Paso 1: Configuración Inicial

### 1.1. Variables de Entorno

Copia las variables del archivo `.env.example` a tu archivo `.env`:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+1234567890

# Feature Flags
SMS_ENABLED=true
WHATSAPP_ENABLED=true
```

### 1.2. Instalar Dependencias

El paquete `twilio` ya está agregado a `package.json`. Ejecuta:

```bash
npm install
```

### 1.3. Configuración de Twilio

1. Crear cuenta en [Twilio](https://www.twilio.com)
2. Obtener Account SID y Auth Token del dashboard
3. Comprar número de teléfono para SMS
4. Activar WhatsApp (sandbox para testing, número aprobado para producción)

## Paso 2: Integración Básica

### 2.1. Inyectar el Servicio

El módulo es Global, por lo que puedes inyectarlo en cualquier servicio:

```typescript
import { Injectable } from '@nestjs/common';
import { MessagingService } from '../messaging/messaging.service';

@Injectable()
export class TuServicio {
  constructor(
    private readonly messagingService: MessagingService,
  ) {}
}
```

### 2.2. Usar los Métodos

```typescript
// Enviar SMS simple
async enviarSMS() {
  const result = await this.messagingService.sendSms(
    '+51999999999',
    'Tu mensaje aquí'
  );

  if (result.success) {
    console.log('Enviado:', result.messageId);
  } else {
    console.error('Error:', result.errorMessage);
  }
}
```

## Paso 3: Integración con Flujos Existentes

### 3.1. Payments Service (Confirmación de Pago)

**Ubicación:** `/Users/carevalojesus/Dev/cip-eventos/backend/src/payments/payments.service.ts`

Agregar después de enviar el email:

```typescript
import { MessagingService } from '../messaging/messaging.service';

@Injectable()
export class PaymentsService {
  constructor(
    // ... otros servicios
    private readonly messagingService: MessagingService,
  ) {}

  async handlePaymentConfirmed(payment: Payment) {
    // ... código existente de email
    await this.mailService.sendTicket(registration);

    // NUEVO: Enviar WhatsApp si tiene teléfono
    if (registration.attendee.phone) {
      await this.messagingService.sendPaymentConfirmationWhatsApp(
        registration.attendee.phone,
        registration.event.title,
        registration.ticketCode,
      );
    }
  }
}
```

### 3.2. Registrations Service (Recordatorio de Expiración)

**Ubicación:** `/Users/carevalojesus/Dev/cip-eventos/backend/src/registrations/registrations.service.ts`

```typescript
import { MessagingService } from '../messaging/messaging.service';

@Injectable()
export class RegistrationsService {
  constructor(
    // ... otros servicios
    private readonly messagingService: MessagingService,
    private readonly configService: ConfigService,
  ) {}

  async sendExpirationReminder(registration: Registration, minutesLeft: number) {
    // Email siempre
    // await this.mailService.sendReservationExpiring(registration);

    // NUEVO: SMS solo si es urgente (menos de 10 min)
    if (registration.attendee.phone && minutesLeft <= 10) {
      const paymentLink = `${this.configService.get('FRONTEND_URL')}/pay/${registration.id}`;

      await this.messagingService.sendPaymentReminder(
        registration.attendee.phone,
        paymentLink,
      );
    }
  }
}
```

### 3.3. Events Service (Recordatorio de Evento)

**Ubicación:** `/Users/carevalojesus/Dev/cip-eventos/backend/src/events/events.service.ts`

Crear un nuevo método para recordatorios:

```typescript
import { MessagingService } from '../messaging/messaging.service';

@Injectable()
export class EventsService {
  constructor(
    // ... otros servicios
    private readonly messagingService: MessagingService,
  ) {}

  async sendEventReminders(eventId: string) {
    const registrations = await this.registrationsRepository.find({
      where: { eventId, status: 'CONFIRMED' },
      relations: ['attendee', 'event'],
    });

    for (const registration of registrations) {
      // Email con detalles completos
      // await this.mailService.sendEventReminder(registration);

      // NUEVO: SMS como recordatorio rápido
      if (registration.attendee.phone) {
        await this.messagingService.sendEventReminder(
          registration.attendee.phone,
          registration.event.title,
        );
      }
    }
  }
}
```

### 3.4. Certificates Service (Certificado Disponible)

**Ubicación:** `/Users/carevalojesus/Dev/cip-eventos/backend/src/certificates/certificates.service.ts`

```typescript
import { MessagingService } from '../messaging/messaging.service';

@Injectable()
export class CertificatesService {
  constructor(
    // ... otros servicios
    private readonly messagingService: MessagingService,
    private readonly configService: ConfigService,
  ) {}

  async notifyCertificateReady(certificateId: string) {
    const certificate = await this.findOne(certificateId);
    const { registration } = certificate;

    // Email con PDF
    // await this.mailService.sendCertificate(certificate);

    // NUEVO: SMS con link de descarga
    if (registration.attendee.phone) {
      const link = `${this.configService.get('FRONTEND_URL')}/certificates/${certificateId}`;

      await this.messagingService.sendCertificateReady(
        registration.attendee.phone,
        link,
      );
    }
  }
}
```

## Paso 4: Crear Cron Jobs (Opcional)

Para recordatorios automáticos, agregar al módulo de Schedule:

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MessagingService } from '../messaging/messaging.service';
import { RegistrationsService } from '../registrations/registrations.service';

@Injectable()
export class MessagingCronService {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly registrationsService: RegistrationsService,
  ) {}

  // Revisar reservas por expirar cada 5 minutos
  @Cron('*/5 * * * *')
  async checkExpiringReservations() {
    const now = new Date();
    const in10Min = new Date(now.getTime() + 10 * 60000);

    const expiringReservations = await this.registrationsService.findExpiringBetween(
      now,
      in10Min,
    );

    for (const registration of expiringReservations) {
      if (registration.attendee.phone) {
        await this.messagingService.sendPaymentReminder(
          registration.attendee.phone,
          `https://ejemplo.com/pay/${registration.id}`,
        );
      }
    }
  }

  // Recordatorio de evento 24h antes
  @Cron(CronExpression.EVERY_HOUR)
  async checkUpcomingEvents() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Lógica para encontrar eventos de mañana
    // Enviar recordatorios...
  }
}
```

## Paso 5: Agregar Endpoints de Admin

Para que los admins puedan probar el servicio:

```typescript
// En tu admin.controller.ts
import { MessagingService } from '../messaging/messaging.service';

@Controller('admin/messaging')
@UseGuards(RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class AdminMessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('test/sms')
  async testSms(@Body() dto: { phone: string; message: string }) {
    return this.messagingService.sendSms(dto.phone, dto.message);
  }

  @Post('broadcast/event/:eventId')
  async broadcastEventReminder(@Param('eventId') eventId: string) {
    // Enviar recordatorio a todos los asistentes
    // ...
  }
}
```

## Paso 6: Manejo de Errores

Siempre manejar errores de manera graceful:

```typescript
async sendNotificationWithFallback(registration: Registration) {
  // 1. Intentar WhatsApp primero
  if (registration.attendee.phone) {
    const result = await this.messagingService.sendWhatsApp(
      registration.attendee.phone,
      'Mensaje importante',
    );

    if (!result.success) {
      this.logger.warn(`WhatsApp failed: ${result.errorMessage}`);

      // 2. Fallback a SMS
      const smsResult = await this.messagingService.sendSms(
        registration.attendee.phone,
        'Mensaje importante',
      );

      if (!smsResult.success) {
        this.logger.error(`SMS also failed: ${smsResult.errorMessage}`);
      }
    }
  }

  // 3. Email siempre como backup
  await this.mailService.send(registration.attendee.email, 'Mensaje importante');
}
```

## Paso 7: Logging y Monitoreo

Crear una tabla para registrar envíos:

```sql
CREATE TABLE messaging_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel VARCHAR(20) NOT NULL, -- 'SMS' | 'WHATSAPP'
  to_phone VARCHAR(20) NOT NULL,
  message_id VARCHAR(100),
  template_id VARCHAR(50),
  status VARCHAR(20), -- 'SENT' | 'FAILED' | 'DELIVERED'
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,
  user_id UUID REFERENCES users(id),
  event_id UUID REFERENCES events(id),
  registration_id UUID REFERENCES registrations(id)
);
```

Servicio para logging:

```typescript
@Injectable()
export class MessagingLogService {
  async log(data: {
    channel: 'SMS' | 'WHATSAPP';
    toPhone: string;
    messageId?: string;
    templateId?: string;
    status: string;
    errorMessage?: string;
    userId?: string;
    eventId?: string;
    registrationId?: string;
  }) {
    // Guardar en la base de datos
  }
}
```

## Paso 8: Testing

### 8.1. Testing en Desarrollo

Usar el MockProvider (activado automáticamente en desarrollo):

```bash
NODE_ENV=development npm run start:dev
```

Los mensajes se mostrarán en los logs pero no se enviarán realmente.

### 8.2. Testing con Twilio Sandbox

Para WhatsApp:
1. Configurar sandbox en Twilio
2. Enviar `join <código>` al número sandbox
3. Ahora puedes recibir mensajes de prueba

### 8.3. Testing Unitario

Ver ejemplo en `messaging.service.spec.ts`

## Paso 9: Despliegue a Producción

### 9.1. Checklist Pre-Producción

- [ ] Credenciales de Twilio configuradas
- [ ] Número de teléfono SMS verificado
- [ ] WhatsApp Business aprobado
- [ ] Templates de WhatsApp aprobados por Meta
- [ ] Variables de entorno configuradas
- [ ] Feature flags activados
- [ ] Webhook configurado en Twilio
- [ ] Presupuesto y alertas configurados
- [ ] Logging implementado
- [ ] Rate limiting configurado

### 9.2. Configuración de Webhook en Twilio

1. Ir a Twilio Console > Messaging > Settings
2. Configurar webhook URL:
   ```
   https://tu-dominio.com/messaging/webhook/twilio
   ```
3. Método: POST
4. Eventos: Message Status Updates

### 9.3. Configurar Presupuesto

1. Twilio Console > Usage > Triggers
2. Crear alerta cuando se alcance cierto gasto
3. Configurar límite diario/mensual

## Paso 10: Monitoreo Post-Despliegue

### Métricas Importantes

- Tasa de entrega (delivery rate)
- Tasa de error
- Tiempo de respuesta
- Costo por mensaje
- Quality score (WhatsApp)

### Logs a Revisar

```bash
# Ver logs de mensajería
grep "MessagingService" logs/app.log

# Ver errores
grep "ERROR.*Messaging" logs/app.log

# Ver webhooks de Twilio
grep "Twilio webhook" logs/app.log
```

## Troubleshooting Común

### Problema: Los mensajes no se envían

**Solución:**
1. Verificar que `SMS_ENABLED=true` o `WHATSAPP_ENABLED=true`
2. Verificar credenciales en `.env`
3. Revisar logs para errores
4. Verificar saldo en Twilio

### Problema: WhatsApp no funciona

**Solución:**
1. Verificar que el template esté aprobado
2. Usar Content SID correcto
3. Verificar que las variables coincidan
4. Probar con sandbox primero

### Problema: Errores de formato de teléfono

**Solución:**
- Asegurar formato E.164: `+51999999999`
- No usar espacios ni guiones
- Incluir código de país

## Recursos Adicionales

- [README.md](./README.md) - Documentación completa del módulo
- [WHATSAPP_TEMPLATES.md](./WHATSAPP_TEMPLATES.md) - Guía de templates
- [examples/notification-integration.example.ts](./examples/notification-integration.example.ts) - Ejemplos de integración
- [Twilio Docs](https://www.twilio.com/docs)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)

## Soporte

Para dudas o problemas:
1. Revisar documentación del módulo
2. Revisar logs del sistema
3. Consultar documentación de Twilio
4. Contactar al equipo de desarrollo
