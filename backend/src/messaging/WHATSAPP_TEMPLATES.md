# WhatsApp Business Templates

Los templates de WhatsApp deben ser pre-aprobados por Meta antes de poder usarse. Este documento lista los templates recomendados para el sistema CIP Eventos.

## Proceso de Aprobación

1. Crear cuenta de WhatsApp Business en Meta
2. Crear templates en la consola de Meta Business
3. Esperar aprobación (24-48 horas típicamente)
4. Una vez aprobado, obtener el Content SID de Twilio
5. Usar el Content SID en los métodos `sendWhatsAppTemplate`

## Templates Recomendados

### 1. Payment Confirmation (Confirmación de Pago)

**Nombre:** `payment_confirmation`
**Categoría:** TRANSACTIONAL
**Idioma:** Spanish (es)

**Mensaje:**
```
Hola {{1}},

Tu pago ha sido confirmado para *{{2}}*.

Código de ticket: *{{3}}*

¡Nos vemos en el evento!

CIP Eventos
```

**Variables:**
1. `{{1}}` - Nombre del asistente
2. `{{2}}` - Nombre del evento
3. `{{3}}` - Código del ticket

**Ejemplo:**
```
Hola Juan,

Tu pago ha sido confirmado para *Workshop de NestJS*.

Código de ticket: *ABC123*

¡Nos vemos en el evento!

CIP Eventos
```

---

### 2. Event Reminder (Recordatorio de Evento)

**Nombre:** `event_reminder`
**Categoría:** UTILITY
**Idioma:** Spanish (es)

**Mensaje:**
```
Recordatorio: Mañana es *{{1}}*

📅 Fecha: {{2}}
📍 Lugar: {{3}}

Presenta tu ticket al ingresar.
Código: *{{4}}*

CIP Eventos
```

**Variables:**
1. `{{1}}` - Nombre del evento
2. `{{2}}` - Fecha y hora
3. `{{3}}` - Ubicación
4. `{{4}}` - Código del ticket

---

### 3. Certificate Ready (Certificado Listo)

**Nombre:** `certificate_ready`
**Categoría:** UTILITY
**Idioma:** Spanish (es)

**Mensaje:**
```
¡Tu certificado está listo!

Evento: *{{1}}*

Descárgalo aquí: {{2}}

Válido por 30 días.

CIP Eventos
```

**Variables:**
1. `{{1}}` - Nombre del evento
2. `{{2}}` - Link de descarga

---

### 4. Ticket Transfer (Transferencia de Ticket)

**Nombre:** `ticket_transfer`
**Categoría:** TRANSACTIONAL
**Idioma:** Spanish (es)

**Mensaje:**
```
Has recibido un ticket para *{{1}}*

Código: *{{2}}*

📅 {{3}}
📍 {{4}}

Guarda este mensaje para ingresar al evento.

CIP Eventos
```

**Variables:**
1. `{{1}}` - Nombre del evento
2. `{{2}}` - Código del ticket
3. `{{3}}` - Fecha y hora
4. `{{4}}` - Ubicación

---

### 5. OTP Verification (Verificación de Código)

**Nombre:** `otp_verification`
**Categoría:** AUTHENTICATION
**Idioma:** Spanish (es)

**Mensaje:**
```
Tu código de verificación es:

*{{1}}*

⏱️ Válido por 5 minutos.

No compartas este código.

CIP Eventos
```

**Variables:**
1. `{{1}}` - Código OTP

---

### 6. Event Cancellation (Cancelación de Evento)

**Nombre:** `event_cancellation`
**Categoría:** TRANSACTIONAL
**Idioma:** Spanish (es)

**Mensaje:**
```
⚠️ EVENTO CANCELADO

Lamentamos informarte que *{{1}}* ha sido cancelado.

Tu pago será reembolsado en 5-7 días hábiles.

Para más información: {{2}}

CIP Eventos
```

**Variables:**
1. `{{1}}` - Nombre del evento
2. `{{2}}` - Link de soporte

---

## Categorías de Templates

Meta clasifica los templates en estas categorías:

- **MARKETING**: Promociones, ofertas, anuncios
- **UTILITY**: Actualizaciones de cuenta, cambios, recordatorios
- **AUTHENTICATION**: OTP, códigos de verificación
- **TRANSACTIONAL**: Confirmaciones de pago, recibos, tickets

## Directrices de Meta para Aprobación

### ✅ Permitido

- Usar variables para personalización
- Incluir CTAs (Call to Action) claros
- Proveer información útil y relevante
- Usar emojis moderadamente
- Incluir links de opt-out en marketing

### ❌ No Permitido

- Contenido engañoso
- Información médica/financiera sensible
- Contenido que infringe derechos de autor
- Spam o contenido promocional excesivo
- Variables en la primera línea (saludo)
- URLs acortadas (bit.ly, etc.)

## Buenas Prácticas

1. **Mantener mensajes cortos**: 100-300 caracteres idealmente
2. **Usar formato**: *negrita* para información importante
3. **Incluir branding**: Firmar con "CIP Eventos"
4. **Ser claro y directo**: No ambigüedad
5. **Proveer contexto**: El usuario debe saber por qué recibe el mensaje
6. **Incluir opt-out**: En mensajes de marketing
7. **Respetar horarios**: No enviar de noche (10pm-8am)
8. **Personalizar**: Usar nombre del usuario cuando sea posible

## Configuración en Twilio

Una vez aprobado el template en Meta:

1. Ir a Twilio Console > Messaging > Content Editor
2. Importar template desde WhatsApp Business
3. Copiar el Content SID (ejemplo: `HX1234567890abcdef`)
4. Usar este SID en el código:

```typescript
await this.messagingService.sendWhatsAppTemplate(
  '+51999999999',
  'HX1234567890abcdef', // Content SID
  {
    '1': 'Juan',
    '2': 'Workshop de NestJS',
    '3': 'ABC123',
  }
);
```

## Testing

### Sandbox de WhatsApp

Para testing sin aprobación:

1. Configurar sandbox en Twilio
2. Enviar mensaje al número de sandbox: `join <código>`
3. Ahora puedes recibir mensajes de testing
4. Número sandbox: `whatsapp:+14155238886`

### Testing de Templates

Los templates pueden tener diferentes estados:

- **PENDING**: Esperando aprobación
- **APPROVED**: Aprobado y listo para usar
- **REJECTED**: Rechazado, revisar feedback
- **PAUSED**: Pausado por bajo quality score

## Métricas de Calidad

Meta califica la calidad de tus mensajes:

- **Quality Rating**: GREEN (bueno), YELLOW (medio), RED (bajo)
- **Status**: CONNECTED, FLAGGED, RESTRICTED

Factores que afectan la calidad:
- Tasa de bloqueo (usuarios que te bloquean)
- Tasa de reporte (usuarios que reportan spam)
- Feedback negativo
- Opt-out rate

**Mantener Quality Rating alto:**
- Solo enviar a usuarios que dieron opt-in
- Contenido relevante y útil
- No enviar con mucha frecuencia
- Responder a mensajes de usuarios
- Proveer opción de opt-out clara

## Límites de Mensajería

WhatsApp tiene límites basados en tu tier:

- **Tier 1**: 1,000 conversaciones/día
- **Tier 2**: 10,000 conversaciones/día
- **Tier 3**: 100,000 conversaciones/día
- **Tier 4**: Sin límite (previa aprobación)

El tier aumenta automáticamente si mantienes buena calidad.

## Costos Estimados

Los costos varían por país. Para Perú (PE):

- **Marketing**: ~$0.008 USD por mensaje
- **Utility**: ~$0.005 USD por mensaje
- **Authentication**: ~$0.003 USD por mensaje
- **Service**: Gratis (respuestas dentro de 24h)

## Recursos

- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [Template Message Guidelines](https://developers.facebook.com/docs/whatsapp/message-templates/guidelines)
- [Twilio WhatsApp Docs](https://www.twilio.com/docs/whatsapp)
- [Meta Business Manager](https://business.facebook.com/)

## Soporte

Para problemas con templates:

1. Revisar logs en Twilio Console
2. Verificar status del template en Meta
3. Contactar soporte de Meta/Twilio
4. Revisar quality rating de la cuenta
