# Messaging Module

Módulo de mensajería que proporciona canales de comunicación SMS y WhatsApp para el sistema de eventos CIP.

## Características

- **SMS**: Envío de mensajes SMS a través de Twilio
- **WhatsApp**: Envío de mensajes de WhatsApp a través de Twilio
- **Templates**: Soporte para templates pre-definidos
- **Mock Provider**: Provider simulado para desarrollo y testing
- **Webhooks**: Recepción de actualizaciones de estado de mensajes
- **Rate Limiting**: Control de frecuencia de envío para evitar spam

## Instalación

El módulo ya está instalado y configurado en el sistema. Solo necesitas configurar las variables de entorno.

### Variables de Entorno

Agrega las siguientes variables a tu archivo `.env`:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+1234567890

# Feature Flags
SMS_ENABLED=true
WHATSAPP_ENABLED=true
```

## Uso

### Inyección del Servicio

```typescript
import { MessagingService } from '../messaging/messaging.service';

@Injectable()
export class MyService {
  constructor(private readonly messagingService: MessagingService) {}
}
```

### Enviar SMS Simple

```typescript
const result = await this.messagingService.sendSms(
  '+51999999999',
  'Hola, este es un mensaje de prueba'
);

if (result.success) {
  console.log('SMS enviado:', result.messageId);
} else {
  console.error('Error:', result.errorMessage);
}
```

### Enviar SMS con Template

```typescript
const result = await this.messagingService.sendSmsTemplate(
  '+51999999999',
  'payment-reminder',
  {
    link: 'https://ejemplo.com/pagar/123',
  }
);
```

### Enviar WhatsApp

```typescript
const result = await this.messagingService.sendWhatsApp(
  '+51999999999',
  'Hola, este es un mensaje por WhatsApp'
);
```

### Enviar WhatsApp con Template Aprobado

```typescript
const result = await this.messagingService.sendWhatsAppTemplate(
  '+51999999999',
  'HX1234567890abcdef', // Content SID de Twilio
  {
    eventName: 'Mi Evento',
    ticketCode: 'ABC123',
  }
);
```

### Métodos Helper

El servicio incluye métodos helper para notificaciones comunes:

```typescript
// Recordatorio de pago
await this.messagingService.sendPaymentReminder(
  '+51999999999',
  'https://ejemplo.com/pagar/123'
);

// Recordatorio de evento
await this.messagingService.sendEventReminder(
  '+51999999999',
  'Nombre del Evento'
);

// Certificado listo
await this.messagingService.sendCertificateReady(
  '+51999999999',
  'https://ejemplo.com/certificado/123'
);

// Confirmación de pago por WhatsApp
await this.messagingService.sendPaymentConfirmationWhatsApp(
  '+51999999999',
  'Mi Evento',
  'ABC123'
);
```

### Enviar a Múltiples Canales

```typescript
const results = await this.messagingService.sendMultiChannel(
  ['SMS', 'WHATSAPP'],
  '+51999999999',
  'Mensaje para ambos canales'
);

console.log('SMS:', results.sms);
console.log('WhatsApp:', results.whatsapp);
```

## Templates Disponibles

### SMS Templates

- `payment-reminder`: Recordatorio de pago pendiente
- `event-reminder`: Recordatorio de evento próximo
- `certificate-ready`: Certificado disponible para descarga
- `payment-confirmed`: Confirmación de pago recibido
- `ticket-transfer`: Notificación de ticket transferido

### WhatsApp Templates

Los templates de WhatsApp deben estar pre-aprobados por Meta. Para usar templates:

1. Crear el template en la consola de WhatsApp Business
2. Esperar aprobación (24-48 horas)
3. Obtener el Content SID del template en Twilio
4. Usar el SID como `templateId` en el método `sendWhatsAppTemplate`

## Testing

### Endpoints de Testing (Solo Admins)

```bash
# Test SMS
POST /messaging/test/sms
{
  "to": "+51999999999",
  "message": "Mensaje de prueba"
}

# Test SMS Template
POST /messaging/test/sms/template
{
  "to": "+51999999999",
  "templateId": "payment-reminder",
  "variables": {
    "link": "https://ejemplo.com/pagar/123"
  }
}

# Test WhatsApp
POST /messaging/test/whatsapp
{
  "to": "+51999999999",
  "message": "Mensaje de prueba por WhatsApp"
}

# Test WhatsApp Template
POST /messaging/test/whatsapp/template
{
  "to": "+51999999999",
  "templateId": "HX1234567890abcdef",
  "variables": {
    "eventName": "Mi Evento",
    "ticketCode": "ABC123"
  }
}

# Verificar estado de entrega
GET /messaging/status/sms/:messageId
GET /messaging/status/whatsapp/:messageId
```

## Webhooks

El módulo expone un endpoint para recibir actualizaciones de estado de Twilio:

```
POST /messaging/webhook/twilio
```

### Configurar Webhook en Twilio

1. Ir a la consola de Twilio
2. Configurar webhook URL: `https://tu-dominio.com/messaging/webhook/twilio`
3. Seleccionar eventos: Message Status Updates
4. El webhook recibirá notificaciones cuando cambie el estado del mensaje

## Formato de Números de Teléfono

Todos los números deben estar en formato E.164:

- Correcto: `+51999999999`
- Correcto: `+1234567890`
- Incorrecto: `999999999`
- Incorrecto: `51-999-999-999`

El sistema automáticamente formatea los números si detecta que son de Perú (+51).

## Mock Provider

En desarrollo (NODE_ENV !== 'production') o cuando no hay credenciales de Twilio configuradas, se usa automáticamente el MockProvider que:

- No envía mensajes reales
- Registra los mensajes en el log
- Retorna siempre success: true
- Genera messageId simulados

Esto permite desarrollar y probar sin gastar créditos de Twilio.

## Consideraciones de Producción

### Costos

- SMS: ~$0.01 - $0.05 USD por mensaje (varía según país)
- WhatsApp: ~$0.005 - $0.01 USD por mensaje
- Configurar alertas de presupuesto en Twilio

### Rate Limiting

Twilio tiene límites de frecuencia:
- SMS: ~1000 msg/segundo (verificar plan)
- WhatsApp: ~80 msg/segundo

Implementar rate limiting en el backend si se esperan picos de tráfico.

### Seguridad

- No enviar información sensible por SMS/WhatsApp
- Validar números de teléfono antes de enviar
- Implementar confirmación de opt-in
- Cumplir con regulaciones locales (GDPR, etc.)

### Monitoreo

- Revisar logs de Twilio regularmente
- Configurar alertas para errores de envío
- Monitorear tasas de entrega
- Analizar tasas de apertura (WhatsApp)

## Troubleshooting

### Los mensajes no se envían

1. Verificar que las credenciales de Twilio estén correctas
2. Verificar que SMS_ENABLED/WHATSAPP_ENABLED estén en true
3. Revisar logs del backend para errores
4. Verificar que el número de teléfono esté en formato correcto
5. Verificar saldo en la cuenta de Twilio

### WhatsApp no funciona

1. Verificar que el número de WhatsApp esté activado en Twilio
2. Verificar que el template esté aprobado por Meta
3. Usar el Content SID correcto del template
4. Verificar que las variables del template coincidan

### Webhooks no funcionan

1. Verificar que la URL sea accesible públicamente
2. Usar HTTPS (requerido por Twilio)
3. Revisar logs del endpoint de webhook
4. Verificar que la URL esté configurada correctamente en Twilio

## Referencias

- [Twilio SMS API](https://www.twilio.com/docs/sms)
- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)
- [WhatsApp Template Guidelines](https://developers.facebook.com/docs/whatsapp/message-templates)
