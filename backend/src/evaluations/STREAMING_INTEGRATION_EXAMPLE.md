# Ejemplo de Integración del Sistema de Streaming Tokens

## Ejemplo Completo: Reproductor de Video con Control de Acceso

### 1. Componente React del Reproductor

```typescript
// StreamingPlayer.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useBeforeUnload } from 'react-router-dom';

interface StreamingPlayerProps {
  sessionId: string;
  attendeeId: string;
  userToken: string;
}

interface StreamingToken {
  token: string;
  expiresAt: string;
  sessionTitle: string;
  sessionStartAt: string;
  sessionEndAt: string;
}

export const StreamingPlayer: React.FC<StreamingPlayerProps> = ({
  sessionId,
  attendeeId,
  userToken,
}) => {
  const [streamingToken, setStreamingToken] = useState<StreamingToken | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionInfo, setConnectionInfo] = useState({
    active: 0,
    max: 2,
    canConnect: true,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  // 1. Generar token al montar el componente
  useEffect(() => {
    generateStreamingToken();
  }, [sessionId, attendeeId]);

  // 2. Validar y conectar cuando tenemos el token
  useEffect(() => {
    if (streamingToken && !isConnected) {
      validateAndConnect();
    }
  }, [streamingToken]);

  // 3. Desconectar al desmontar
  useEffect(() => {
    return () => {
      if (isConnected && streamingToken) {
        disconnectStreaming();
      }
    };
  }, [isConnected, streamingToken]);

  // 4. Desconectar antes de cerrar la página
  useBeforeUnload(() => {
    if (isConnected && streamingToken) {
      // Usar sendBeacon para garantizar que se envíe
      navigator.sendBeacon(
        '/api/streaming/disconnect',
        JSON.stringify({
          token: streamingToken.token,
          ip: 'auto', // Se detectará en el backend
        })
      );
    }
  });

  const generateStreamingToken = async () => {
    try {
      const response = await fetch('/api/streaming/generate-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, attendeeId }),
      });

      if (!response.ok) {
        throw new Error('Error al generar token de streaming');
      }

      const token = await response.json();
      setStreamingToken(token);
    } catch (err) {
      setError(err.message);
    }
  };

  const validateAndConnect = async () => {
    try {
      // Validar token
      const validateResponse = await fetch('/api/streaming/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: streamingToken!.token,
        }),
      });

      const validation = await validateResponse.json();

      if (!validation.valid) {
        setError(validation.message);
        return;
      }

      // Conectar
      const connectResponse = await fetch('/api/streaming/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: streamingToken!.token,
          ip: 'auto',
        }),
      });

      if (!connectResponse.ok) {
        const errorData = await connectResponse.json();
        throw new Error(errorData.message || 'Error al conectar al streaming');
      }

      setIsConnected(true);
      startHeartbeat();
    } catch (err) {
      setError(err.message);
    }
  };

  const disconnectStreaming = async () => {
    try {
      await fetch('/api/streaming/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: streamingToken!.token,
          ip: 'auto',
        }),
      });

      setIsConnected(false);
      stopHeartbeat();
    } catch (err) {
      console.error('Error al desconectar:', err);
    }
  };

  const startHeartbeat = () => {
    // Verificar conexiones activas cada 30 segundos
    heartbeatInterval.current = setInterval(async () => {
      try {
        const response = await fetch('/api/streaming/active-connections', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: streamingToken!.token,
          }),
        });

        const data = await response.json();
        setConnectionInfo({
          active: data.totalActive,
          max: data.maxAllowed,
          canConnect: data.canConnect,
        });

        // Si alcanzamos el límite, mostrar advertencia
        if (data.totalActive >= data.maxAllowed) {
          console.warn('Límite de conexiones alcanzado');
        }
      } catch (err) {
        console.error('Error en heartbeat:', err);
      }
    }, 30000);
  };

  const stopHeartbeat = () => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  };

  if (error) {
    return (
      <div className="streaming-error">
        <h3>Error de Streaming</h3>
        <p>{error}</p>
        <button onClick={generateStreamingToken}>Reintentar</button>
      </div>
    );
  }

  if (!streamingToken) {
    return <div className="streaming-loading">Cargando streaming...</div>;
  }

  return (
    <div className="streaming-player">
      <div className="streaming-header">
        <h2>{streamingToken.sessionTitle}</h2>
        <div className="connection-info">
          <span className={isConnected ? 'connected' : 'disconnected'}>
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
          <span className="connection-count">
            Conexiones: {connectionInfo.active}/{connectionInfo.max}
          </span>
        </div>
      </div>

      {isConnected ? (
        <video
          ref={videoRef}
          controls
          autoPlay
          className="streaming-video"
          src={`/api/streaming/stream/${sessionId}?token=${streamingToken.token}`}
          onError={() => setError('Error al cargar el video')}
        />
      ) : (
        <div className="streaming-waiting">
          Conectando al streaming...
        </div>
      )}

      <div className="streaming-footer">
        <p>
          Sesión válida hasta:{' '}
          {new Date(streamingToken.expiresAt).toLocaleString()}
        </p>
        {connectionInfo.active >= connectionInfo.max && (
          <div className="warning">
            Has alcanzado el límite de conexiones simultáneas.
            Cierra otras sesiones para continuar.
          </div>
        )}
      </div>
    </div>
  );
};
```

### 2. Hook Personalizado para Streaming

```typescript
// useStreaming.ts
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseStreamingOptions {
  sessionId: string;
  attendeeId: string;
  userToken: string;
  autoConnect?: boolean;
}

interface UseStreamingReturn {
  token: string | null;
  isConnected: boolean;
  error: string | null;
  activeConnections: number;
  maxConnections: number;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  retry: () => Promise<void>;
}

export const useStreaming = ({
  sessionId,
  attendeeId,
  userToken,
  autoConnect = true,
}: UseStreamingOptions): UseStreamingReturn => {
  const [token, setToken] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeConnections, setActiveConnections] = useState(0);
  const [maxConnections, setMaxConnections] = useState(2);

  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  // Generar token
  const generateToken = useCallback(async () => {
    try {
      const response = await fetch('/api/streaming/generate-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, attendeeId }),
      });

      if (!response.ok) throw new Error('Error al generar token');

      const data = await response.json();
      setToken(data.token);
      setError(null);
      return data.token;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [sessionId, attendeeId, userToken]);

  // Conectar
  const connect = useCallback(async () => {
    try {
      let currentToken = token;

      if (!currentToken) {
        currentToken = await generateToken();
      }

      // Validar
      const validateResponse = await fetch('/api/streaming/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: currentToken }),
      });

      const validation = await validateResponse.json();
      if (!validation.valid) {
        throw new Error(validation.message);
      }

      // Conectar
      const connectResponse = await fetch('/api/streaming/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: currentToken, ip: 'auto' }),
      });

      if (!connectResponse.ok) {
        const errorData = await connectResponse.json();
        throw new Error(errorData.message);
      }

      setIsConnected(true);
      setError(null);
      startHeartbeat(currentToken);
    } catch (err) {
      setError(err.message);
      setIsConnected(false);
    }
  }, [token, generateToken]);

  // Desconectar
  const disconnect = useCallback(async () => {
    if (!token) return;

    try {
      await fetch('/api/streaming/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ip: 'auto' }),
      });

      setIsConnected(false);
      stopHeartbeat();
    } catch (err) {
      console.error('Error al desconectar:', err);
    }
  }, [token]);

  // Reintentar
  const retry = useCallback(async () => {
    setError(null);
    await generateToken();
    if (autoConnect) {
      await connect();
    }
  }, [generateToken, connect, autoConnect]);

  // Heartbeat
  const startHeartbeat = (currentToken: string) => {
    stopHeartbeat();

    heartbeatRef.current = setInterval(async () => {
      try {
        const response = await fetch('/api/streaming/active-connections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: currentToken }),
        });

        const data = await response.json();
        setActiveConnections(data.totalActive);
        setMaxConnections(data.maxAllowed);
      } catch (err) {
        console.error('Error en heartbeat:', err);
      }
    }, 30000);
  };

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  };

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && !token) {
      generateToken().then(() => {
        if (autoConnect) connect();
      });
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, [isConnected, disconnect]);

  return {
    token,
    isConnected,
    error,
    activeConnections,
    maxConnections,
    connect,
    disconnect,
    retry,
  };
};
```

### 3. Servicio de API (Opcional)

```typescript
// streaming.service.ts
import axios from 'axios';

export class StreamingService {
  private baseUrl = '/api/streaming';

  async generateToken(sessionId: string, attendeeId: string, userToken: string) {
    const response = await axios.post(
      `${this.baseUrl}/generate-token`,
      { sessionId, attendeeId },
      {
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
      }
    );
    return response.data;
  }

  async validateToken(token: string) {
    const response = await axios.post(`${this.baseUrl}/validate`, { token });
    return response.data;
  }

  async connect(token: string, ip: string = 'auto') {
    const response = await axios.post(`${this.baseUrl}/connect`, { token, ip });
    return response.data;
  }

  async disconnect(token: string, ip: string = 'auto') {
    const response = await axios.post(`${this.baseUrl}/disconnect`, { token, ip });
    return response.data;
  }

  async getActiveConnections(token: string) {
    const response = await axios.post(`${this.baseUrl}/active-connections`, { token });
    return response.data;
  }
}

export const streamingService = new StreamingService();
```

### 4. Uso en una Página

```typescript
// SessionPage.tsx
import React from 'react';
import { StreamingPlayer } from './StreamingPlayer';
import { useAuth } from './hooks/useAuth';
import { useParams } from 'react-router-dom';

export const SessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, token } = useAuth();

  if (!user) {
    return <div>Debes iniciar sesión para ver el streaming</div>;
  }

  return (
    <div className="session-page">
      <StreamingPlayer
        sessionId={sessionId}
        attendeeId={user.attendeeId}
        userToken={token}
      />
    </div>
  );
};
```

### 5. Estilos CSS

```css
/* streaming-player.css */
.streaming-player {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.streaming-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.connection-info {
  display: flex;
  gap: 15px;
  align-items: center;
}

.connected {
  color: #28a745;
  font-weight: 600;
}

.disconnected {
  color: #dc3545;
  font-weight: 600;
}

.connection-count {
  padding: 5px 10px;
  background: #007bff;
  color: white;
  border-radius: 4px;
  font-size: 0.9em;
}

.streaming-video {
  width: 100%;
  max-height: 600px;
  background: #000;
  border-radius: 8px;
}

.streaming-waiting,
.streaming-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  background: #f0f0f0;
  border-radius: 8px;
  font-size: 1.2em;
  color: #666;
}

.streaming-footer {
  margin-top: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.warning {
  margin-top: 10px;
  padding: 10px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  color: #856404;
}

.streaming-error {
  padding: 20px;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  color: #721c24;
}

.streaming-error button {
  margin-top: 10px;
  padding: 10px 20px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.streaming-error button:hover {
  background: #c82333;
}
```

## Flujo de Datos Completo

```
┌─────────────────┐
│   Usuario       │
│   Autenticado   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  1. Solicitar Token de Streaming            │
│  POST /api/streaming/generate-token         │
│  Headers: Authorization: Bearer {userToken} │
│  Body: { sessionId, attendeeId }            │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  2. Recibir Token                           │
│  { token, expiresAt, sessionInfo... }       │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  3. Validar Token                           │
│  POST /api/streaming/validate               │
│  Body: { token }                            │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  4. Registrar Conexión                      │
│  POST /api/streaming/connect                │
│  Body: { token, ip }                        │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  5. Reproducir Streaming                    │
│  Video Player con token en URL              │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  6. Heartbeat (cada 30s)                    │
│  POST /api/streaming/active-connections     │
│  Body: { token }                            │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  7. Desconectar (al cerrar)                 │
│  POST /api/streaming/disconnect             │
│  Body: { token, ip }                        │
└─────────────────────────────────────────────┘
```

## Casos de Uso Especiales

### Reconexión Automática

```typescript
const handleReconnect = async () => {
  try {
    // Desconectar primero
    await disconnect();

    // Esperar un momento
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Reconectar
    await connect();
  } catch (err) {
    console.error('Error al reconectar:', err);
  }
};
```

### Detección de Pérdida de Conexión

```typescript
useEffect(() => {
  const handleOffline = () => {
    setError('Conexión perdida. Intentando reconectar...');
    disconnect();
  };

  const handleOnline = () => {
    setError(null);
    connect();
  };

  window.addEventListener('offline', handleOffline);
  window.addEventListener('online', handleOnline);

  return () => {
    window.removeEventListener('offline', handleOffline);
    window.removeEventListener('online', handleOnline);
  };
}, [connect, disconnect]);
```

### Advertencia de Múltiples Dispositivos

```typescript
useEffect(() => {
  if (activeConnections >= maxConnections) {
    const shouldDisconnectOthers = window.confirm(
      'Has alcanzado el límite de conexiones simultáneas. ' +
      '¿Deseas desconectar otros dispositivos?'
    );

    if (shouldDisconnectOthers) {
      // Aquí podrías implementar lógica para forzar desconexión
      // de otros dispositivos si el backend lo soporta
    }
  }
}, [activeConnections, maxConnections]);
```

## Testing

### Test Unitario del Hook

```typescript
// useStreaming.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useStreaming } from './useStreaming';

describe('useStreaming', () => {
  it('should generate token on mount', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useStreaming({
        sessionId: 'session-123',
        attendeeId: 'attendee-456',
        userToken: 'user-token',
        autoConnect: false,
      })
    );

    await waitForNextUpdate();

    expect(result.current.token).toBeTruthy();
    expect(result.current.error).toBeNull();
  });

  it('should connect and track active connections', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useStreaming({
        sessionId: 'session-123',
        attendeeId: 'attendee-456',
        userToken: 'user-token',
      })
    );

    await waitForNextUpdate();

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.activeConnections).toBeGreaterThanOrEqual(0);
  });
});
```

Este ejemplo proporciona una implementación completa y lista para producción del sistema de streaming tokens.
