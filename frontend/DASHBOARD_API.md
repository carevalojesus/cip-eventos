# Dashboard API Integration

Este documento explica cómo conectar el dashboard con tu backend.

## 📡 Endpoints Requeridos

El dashboard hace llamadas a los siguientes endpoints:

### 1. **GET `/api/dashboard/stats`**
Retorna las estadísticas generales del dashboard.

**Response:**
```json
{
  "success": true,
  "data": {
    "activeEvents": 12,
    "totalRegistered": 1234,
    "monthlyIncome": 45200,
    "ticketsSold": 892,
    "trends": {
      "activeEvents": 20,
      "totalRegistered": 15,
      "monthlyIncome": 8,
      "ticketsSold": 12
    }
  }
}
```

---

### 2. **GET `/api/dashboard/upcoming-events?limit=5`**
Retorna los próximos eventos.

**Query Params:**
- `limit` (opcional): Número de eventos a retornar. Default: 10

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Semana de la Ingeniería Civil 2024",
      "date": "15 Nov, 2024",
      "attendees": 450,
      "status": "confirmed",
      "capacity": 500,
      "location": "Auditorio Principal"
    },
    {
      "id": 2,
      "title": "Workshop: IA en Construcción",
      "date": "18 Nov, 2024",
      "attendees": 120,
      "status": "pending"
    }
  ]
}
```

**Status values:** `"confirmed"` | `"pending"` | `"cancelled"`

---

### 3. **GET `/api/dashboard/activity?limit=5`**
Retorna la actividad reciente.

**Query Params:**
- `limit` (opcional): Número de actividades a retornar. Default: 10

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user": "María González",
      "action": "registró un nuevo pago",
      "target": null,
      "timestamp": "Hace 2 min",
      "type": "payment"
    },
    {
      "id": 2,
      "user": "Carlos Rodríguez",
      "action": "creó el evento",
      "target": "Semana IC",
      "timestamp": "Hace 15 min",
      "type": "event"
    }
  ]
}
```

**Type values:** `"payment"` | `"event"` | `"update"` | `"other"`

---

## 🔧 Implementación Backend (Ejemplo con NestJS)

### Dashboard Controller

```typescript
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats() {
    const data = await this.dashboardService.getStats();
    return { success: true, data };
  }

  @Get('upcoming-events')
  async getUpcomingEvents(@Query('limit') limit = 10) {
    const data = await this.dashboardService.getUpcomingEvents(+limit);
    return { success: true, data };
  }

  @Get('activity')
  async getRecentActivity(@Query('limit') limit = 10) {
    const data = await this.dashboardService.getRecentActivity(+limit);
    return { success: true, data };
  }
}
```

---

## 🧪 Datos de Prueba (Mock)

Si el backend aún no está listo, puedes usar datos mock temporalmente:

### Opción 1: Mock Service Worker (MSW)

```bash
npm install msw --save-dev
```

### Opción 2: Modificar el Service

En `src/services/dashboard.service.ts`, comenta las llamadas reales y retorna datos mock:

```typescript
async getStats(): Promise<DashboardStats> {
  // return await api.get(...) // Comentar esto

  // Retornar mock temporalmente
  return {
    activeEvents: 12,
    totalRegistered: 1234,
    monthlyIncome: 45200,
    ticketsSold: 892,
    trends: {
      activeEvents: 20,
      totalRegistered: 15
    }
  };
}
```

---

## 🔐 Autenticación

Las llamadas a la API usan el token almacenado en Zustand:

```typescript
// src/lib/api.ts ya maneja el token automáticamente
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 🚀 Testing

### Test manual de los endpoints:

```bash
# Stats
curl http://localhost:3000/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Upcoming Events
curl http://localhost:3000/api/dashboard/upcoming-events?limit=5 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Activity
curl http://localhost:3000/api/dashboard/activity?limit=5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 Notas

- El hook `useDashboardData()` hace las 3 llamadas en paralelo con `Promise.all`
- Maneja automáticamente estados de loading y error
- Incluye función `refetch()` para recargar datos
- i18n completo en todos los textos

---

## 🐛 Troubleshooting

### Error: "Network Error"
- Verifica que el backend esté corriendo
- Revisa la variable `PUBLIC_API_URL` en `.env`

### Error: 401 Unauthorized
- El token de autenticación está vencido o es inválido
- Verifica que el login funcione correctamente

### Datos no se muestran
- Abre DevTools > Network para ver las llamadas
- Verifica que las respuestas tengan el formato correcto
- Revisa la consola para errores de TypeScript
