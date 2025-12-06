# Ejemplos de Uso: Sistema de Check-In por QR

Este archivo contiene ejemplos prácticos de cómo usar los endpoints de check-in con diferentes herramientas.

## Variables de Entorno

```bash
# Configurar estas variables antes de ejecutar los ejemplos
export API_URL="http://localhost:3000/api"
export TOKEN="tu-jwt-token-aqui"
export TICKET_CODE="uuid-del-ticket"
export SESSION_ID="uuid-de-sesion"
```

---

## 1. Validar Ticket (Sin Registrar Check-In)

### Con cURL

```bash
curl -X GET "${API_URL}/registrations/qr/${TICKET_CODE}/validate" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"
```

### Con HTTPie

```bash
http GET "${API_URL}/registrations/qr/${TICKET_CODE}/validate" \
  "Authorization: Bearer ${TOKEN}"
```

### Con JavaScript (Fetch)

```javascript
const validateTicket = async (ticketCode) => {
  const response = await fetch(
    `${API_URL}/registrations/qr/${ticketCode}/validate`,
    {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const data = await response.json();
  console.log('Ticket válido:', data);
  return data;
};

// Uso
validateTicket('uuid-del-ticket');
```

### Respuesta Esperada

```json
{
  "valid": true,
  "ticketCode": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "attendee": {
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan.perez@email.com",
    "documentNumber": "12345678"
  },
  "event": {
    "id": "event-uuid",
    "title": "Congreso Internacional de Ingeniería 2025"
  },
  "eventTicket": {
    "id": "ticket-type-uuid",
    "name": "Entrada General"
  },
  "status": "CONFIRMED",
  "attended": false,
  "attendedAt": null
}
```

---

## 2. Check-In General al Evento (Sin Sesión)

### Con cURL

```bash
curl -X POST "${API_URL}/registrations/qr/check-in" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "ticketCode": "'${TICKET_CODE}'"
  }'
```

### Con HTTPie

```bash
http POST "${API_URL}/registrations/qr/check-in" \
  "Authorization: Bearer ${TOKEN}" \
  ticketCode="${TICKET_CODE}"
```

### Con JavaScript (Fetch)

```javascript
const checkIn = async (ticketCode) => {
  const response = await fetch(
    `${API_URL}/registrations/qr/check-in`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ticketCode })
    }
  );

  const data = await response.json();
  console.log('Check-in exitoso:', data);
  return data;
};

// Uso
checkIn('uuid-del-ticket');
```

### Respuesta Esperada

```json
{
  "success": true,
  "message": "Check-in registrado exitosamente",
  "isReentry": false,
  "attendee": {
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan.perez@email.com",
    "documentNumber": "12345678"
  },
  "event": "Congreso Internacional de Ingeniería 2025",
  "checkInTime": "2025-01-20T09:30:00.000Z"
}
```

---

## 3. Check-In a Sesión Específica

### Con cURL

```bash
curl -X POST "${API_URL}/registrations/qr/check-in" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "ticketCode": "'${TICKET_CODE}'",
    "sessionId": "'${SESSION_ID}'",
    "mode": "simple"
  }'
```

### Con HTTPie

```bash
http POST "${API_URL}/registrations/qr/check-in" \
  "Authorization: Bearer ${TOKEN}" \
  ticketCode="${TICKET_CODE}" \
  sessionId="${SESSION_ID}" \
  mode="simple"
```

### Con JavaScript (Fetch)

```javascript
const checkInToSession = async (ticketCode, sessionId, mode = 'simple') => {
  const response = await fetch(
    `${API_URL}/registrations/qr/check-in`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ticketCode,
        sessionId,
        mode
      })
    }
  );

  const data = await response.json();
  console.log('Check-in a sesión exitoso:', data);
  return data;
};

// Uso
checkInToSession('uuid-del-ticket', 'uuid-de-sesion', 'advanced');
```

### Respuesta Esperada

```json
{
  "success": true,
  "message": "Check-in registrado exitosamente",
  "isReentry": false,
  "attendee": {
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan.perez@email.com",
    "documentNumber": "12345678"
  },
  "session": {
    "id": "session-uuid",
    "title": "Keynote: El Futuro de la IA",
    "startAt": "2025-01-20T09:00:00.000Z",
    "endAt": "2025-01-20T11:00:00.000Z"
  },
  "checkInTime": "2025-01-20T09:15:00.000Z",
  "attendance": {
    "id": "attendance-uuid",
    "status": "PRESENT",
    "modality": "IN_PERSON"
  }
}
```

---

## 4. Check-Out de Sesión (Modo Avanzado)

### Con cURL

```bash
curl -X POST "${API_URL}/registrations/qr/check-out" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "ticketCode": "'${TICKET_CODE}'",
    "sessionId": "'${SESSION_ID}'"
  }'
```

### Con HTTPie

```bash
http POST "${API_URL}/registrations/qr/check-out" \
  "Authorization: Bearer ${TOKEN}" \
  ticketCode="${TICKET_CODE}" \
  sessionId="${SESSION_ID}"
```

### Con JavaScript (Fetch)

```javascript
const checkOut = async (ticketCode, sessionId) => {
  const response = await fetch(
    `${API_URL}/registrations/qr/check-out`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ticketCode,
        sessionId
      })
    }
  );

  const data = await response.json();
  console.log('Check-out exitoso:', data);
  console.log(`Tiempo asistido: ${data.minutesAttended} minutos (${data.attendancePercentage}%)`);
  return data;
};

// Uso
checkOut('uuid-del-ticket', 'uuid-de-sesion');
```

### Respuesta Esperada

```json
{
  "success": true,
  "message": "Check-out registrado exitosamente",
  "attendee": {
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan.perez@email.com"
  },
  "session": {
    "id": "session-uuid",
    "title": "Keynote: El Futuro de la IA"
  },
  "checkInTime": "2025-01-20T09:15:00.000Z",
  "checkOutTime": "2025-01-20T10:45:00.000Z",
  "minutesAttended": 90,
  "attendancePercentage": 75.0
}
```

---

## 5. Consultar Estado de Check-In

### Con cURL

```bash
curl -X GET "${API_URL}/registrations/qr/${TICKET_CODE}/status" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"
```

### Con HTTPie

```bash
http GET "${API_URL}/registrations/qr/${TICKET_CODE}/status" \
  "Authorization: Bearer ${TOKEN}"
```

### Con JavaScript (Fetch)

```javascript
const getCheckInStatus = async (ticketCode) => {
  const response = await fetch(
    `${API_URL}/registrations/qr/${ticketCode}/status`,
    {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const data = await response.json();
  console.log('Estado de check-in:', data);

  // Mostrar resumen
  console.log(`Asistente: ${data.attendee.firstName} ${data.attendee.lastName}`);
  console.log(`Evento: ${data.event.title}`);
  console.log(`Check-in general: ${data.eventCheckIn.attended ? 'Sí' : 'No'}`);
  console.log(`Sesiones asistidas: ${data.sessionAttendances.length}`);

  return data;
};

// Uso
getCheckInStatus('uuid-del-ticket');
```

### Respuesta Esperada

```json
{
  "ticketCode": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "attendee": {
    "id": "attendee-uuid",
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "juan.perez@email.com",
    "documentNumber": "12345678"
  },
  "event": {
    "id": "event-uuid",
    "title": "Congreso Internacional de Ingeniería 2025"
  },
  "eventCheckIn": {
    "attended": true,
    "attendedAt": "2025-01-20T09:15:00.000Z"
  },
  "sessionAttendances": [
    {
      "sessionId": "session-uuid-1",
      "sessionTitle": "Keynote: El Futuro de la IA",
      "checkInAt": "2025-01-20T09:15:00.000Z",
      "checkOutAt": "2025-01-20T10:45:00.000Z",
      "status": "PRESENT",
      "modality": "IN_PERSON",
      "minutesAttended": 90,
      "attendancePercentage": 75.0
    },
    {
      "sessionId": "session-uuid-2",
      "sessionTitle": "Workshop: Machine Learning Práctico",
      "checkInAt": "2025-01-20T14:00:00.000Z",
      "checkOutAt": null,
      "status": "PRESENT",
      "modality": "IN_PERSON",
      "minutesAttended": 0,
      "attendancePercentage": 0
    }
  ]
}
```

---

## 6. Aplicación React Completa con Scanner QR

### Instalación de Dependencias

```bash
npm install @zxing/library react-qr-reader
# o
pnpm add @zxing/library react-qr-reader
```

### Componente QR Scanner con Check-In

```typescript
import React, { useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

interface CheckInResponse {
  success: boolean;
  message: string;
  isReentry: boolean;
  attendee: {
    firstName: string;
    lastName: string;
    email: string;
  };
  event?: string;
  session?: {
    title: string;
  };
  checkInTime: string;
}

const QRCheckIn: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<CheckInResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
  const TOKEN = localStorage.getItem('accessToken');

  const startScan = async () => {
    setScanning(true);
    setError(null);
    setResult(null);

    const codeReader = new BrowserMultiFormatReader();

    try {
      const videoInputDevices = await codeReader.listVideoInputDevices();
      const selectedDeviceId = videoInputDevices[0].deviceId;

      codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        'video',
        async (result, err) => {
          if (result) {
            const ticketCode = result.getText();
            console.log('QR escaneado:', ticketCode);

            // Detener el scanner
            codeReader.reset();
            setScanning(false);

            // Hacer check-in
            await performCheckIn(ticketCode);
          }

          if (err && !(err instanceof Error)) {
            console.error('Error de escaneo:', err);
          }
        }
      );
    } catch (err) {
      console.error('Error al iniciar scanner:', err);
      setError('No se pudo acceder a la cámara');
      setScanning(false);
    }
  };

  const performCheckIn = async (ticketCode: string) => {
    try {
      // 1. Primero validar el ticket
      const validateResponse = await fetch(
        `${API_URL}/registrations/qr/${ticketCode}/validate`,
        {
          headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!validateResponse.ok) {
        const errorData = await validateResponse.json();
        throw new Error(errorData.message || 'Ticket inválido');
      }

      const validation = await validateResponse.json();

      // 2. Hacer check-in
      const checkInResponse = await fetch(
        `${API_URL}/registrations/qr/check-in`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ticketCode,
            sessionId: selectedSession || undefined,
            mode: 'simple'
          })
        }
      );

      if (!checkInResponse.ok) {
        const errorData = await checkInResponse.json();
        throw new Error(errorData.message || 'Error en check-in');
      }

      const checkInData: CheckInResponse = await checkInResponse.json();
      setResult(checkInData);

      // Reproducir sonido de éxito
      playSuccessSound();

    } catch (err) {
      console.error('Error en check-in:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      playErrorSound();
    }
  };

  const playSuccessSound = () => {
    const audio = new Audio('/sounds/success.mp3');
    audio.play();
  };

  const playErrorSound = () => {
    const audio = new Audio('/sounds/error.mp3');
    audio.play();
  };

  const resetScanner = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="qr-checkin-container">
      <h2>Check-In por QR</h2>

      {/* Selector de sesión (opcional) */}
      <div className="session-selector">
        <label>Sesión (opcional):</label>
        <select
          value={selectedSession || ''}
          onChange={(e) => setSelectedSession(e.target.value || null)}
        >
          <option value="">Check-in general al evento</option>
          <option value="session-uuid-1">Keynote: El Futuro de la IA</option>
          <option value="session-uuid-2">Workshop: ML Práctico</option>
        </select>
      </div>

      {/* Scanner */}
      {!scanning && !result && !error && (
        <button onClick={startScan} className="btn-primary">
          Iniciar Scanner
        </button>
      )}

      {scanning && (
        <div className="scanner">
          <video id="video" width="100%" height="auto" />
          <button onClick={() => setScanning(false)} className="btn-secondary">
            Cancelar
          </button>
        </div>
      )}

      {/* Resultado exitoso */}
      {result && (
        <div className={`result ${result.isReentry ? 'warning' : 'success'}`}>
          <h3>
            {result.isReentry ? '⚠️ Reingreso Detectado' : '✅ Check-In Exitoso'}
          </h3>
          <div className="attendee-info">
            <h4>
              {result.attendee.firstName} {result.attendee.lastName}
            </h4>
            <p>{result.attendee.email}</p>
          </div>
          <div className="event-info">
            {result.event && <p><strong>Evento:</strong> {result.event}</p>}
            {result.session && <p><strong>Sesión:</strong> {result.session.title}</p>}
            <p><strong>Hora:</strong> {new Date(result.checkInTime).toLocaleString()}</p>
          </div>
          <p className="message">{result.message}</p>
          <button onClick={resetScanner} className="btn-primary">
            Escanear Otro
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="result error">
          <h3>❌ Error</h3>
          <p>{error}</p>
          <button onClick={resetScanner} className="btn-primary">
            Intentar de Nuevo
          </button>
        </div>
      )}
    </div>
  );
};

export default QRCheckIn;
```

---

## 7. Script de Prueba Automática (Node.js)

```javascript
// test-checkin.js
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
const TOKEN = 'tu-jwt-token-aqui';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testCheckInFlow() {
  const ticketCode = 'uuid-del-ticket-de-prueba';
  const sessionId = 'uuid-de-sesion-de-prueba';

  console.log('🧪 Iniciando prueba de check-in...\n');

  try {
    // 1. Validar ticket
    console.log('1️⃣ Validando ticket...');
    const validation = await api.get(`/registrations/qr/${ticketCode}/validate`);
    console.log('✅ Ticket válido:', validation.data.attendee.firstName);
    console.log('');

    // 2. Check-in general
    console.log('2️⃣ Haciendo check-in general...');
    const checkIn = await api.post('/registrations/qr/check-in', {
      ticketCode
    });
    console.log('✅', checkIn.data.message);
    console.log('   Asistente:', checkIn.data.attendee.firstName);
    console.log('');

    // 3. Check-in a sesión
    console.log('3️⃣ Haciendo check-in a sesión...');
    const sessionCheckIn = await api.post('/registrations/qr/check-in', {
      ticketCode,
      sessionId,
      mode: 'advanced'
    });
    console.log('✅', sessionCheckIn.data.message);
    console.log('   Sesión:', sessionCheckIn.data.session.title);
    console.log('');

    // 4. Esperar 5 segundos (simular tiempo de asistencia)
    console.log('4️⃣ Esperando 5 segundos...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('');

    // 5. Check-out
    console.log('5️⃣ Haciendo check-out...');
    const checkOut = await api.post('/registrations/qr/check-out', {
      ticketCode,
      sessionId
    });
    console.log('✅', checkOut.data.message);
    console.log('   Minutos asistidos:', checkOut.data.minutesAttended);
    console.log('   Porcentaje:', checkOut.data.attendancePercentage + '%');
    console.log('');

    // 6. Consultar estado
    console.log('6️⃣ Consultando estado final...');
    const status = await api.get(`/registrations/qr/${ticketCode}/status`);
    console.log('✅ Estado obtenido');
    console.log('   Check-in general:', status.data.eventCheckIn.attended ? 'Sí' : 'No');
    console.log('   Sesiones asistidas:', status.data.sessionAttendances.length);
    console.log('');

    console.log('🎉 Todas las pruebas pasaron exitosamente!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    console.error('Status:', error.response?.status);
  }
}

// Ejecutar
testCheckInFlow();
```

### Ejecutar el script

```bash
node test-checkin.js
```

---

## 8. Postman Collection

### Importar colección JSON

```json
{
  "info": {
    "name": "Check-In QR API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api"
    },
    {
      "key": "token",
      "value": "tu-jwt-token-aqui"
    },
    {
      "key": "ticketCode",
      "value": "uuid-del-ticket"
    },
    {
      "key": "sessionId",
      "value": "uuid-de-sesion"
    }
  ],
  "item": [
    {
      "name": "Validar Ticket",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/registrations/qr/{{ticketCode}}/validate",
          "host": ["{{baseUrl}}"],
          "path": ["registrations", "qr", "{{ticketCode}}", "validate"]
        }
      }
    },
    {
      "name": "Check-In General",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"ticketCode\": \"{{ticketCode}}\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/registrations/qr/check-in",
          "host": ["{{baseUrl}}"],
          "path": ["registrations", "qr", "check-in"]
        }
      }
    },
    {
      "name": "Check-In a Sesión",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"ticketCode\": \"{{ticketCode}}\",\n  \"sessionId\": \"{{sessionId}}\",\n  \"mode\": \"advanced\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/registrations/qr/check-in",
          "host": ["{{baseUrl}}"],
          "path": ["registrations", "qr", "check-in"]
        }
      }
    },
    {
      "name": "Check-Out",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"ticketCode\": \"{{ticketCode}}\",\n  \"sessionId\": \"{{sessionId}}\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/registrations/qr/check-out",
          "host": ["{{baseUrl}}"],
          "path": ["registrations", "qr", "check-out"]
        }
      }
    },
    {
      "name": "Consultar Estado",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/registrations/qr/{{ticketCode}}/status",
          "host": ["{{baseUrl}}"],
          "path": ["registrations", "qr", "{{ticketCode}}", "status"]
        }
      }
    }
  ]
}
```

---

## Notas Finales

- Reemplaza `${TOKEN}` con un JWT válido obtenido del endpoint `/auth/login`
- Reemplaza `${TICKET_CODE}` con un UUID de ticket válido de la base de datos
- Reemplaza `${SESSION_ID}` con un UUID de sesión válido (si aplica)
- Todos los ejemplos asumen que el servidor está corriendo en `http://localhost:3000`
- Los timestamps en las respuestas están en formato ISO 8601 (UTC)
