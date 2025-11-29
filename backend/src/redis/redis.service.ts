import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Obtener un valor del cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  /**
   * Guardar un valor en el cache
   * @param key - Clave del cache
   * @param value - Valor a guardar
   * @param ttl - Tiempo de vida en milisegundos (opcional)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  /**
   * Eliminar un valor del cache
   */
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * Limpiar todo el cache
   */
  async reset(): Promise<void> {
    await this.cacheManager.clear();
  }

  /**
   * Añadir un token a la blacklist (para logout efectivo)
   * @param jti - JWT ID único del token
   * @param ttlMs - Tiempo restante de vida del token en ms
   */
  async blacklistToken(jti: string, ttlMs: number): Promise<void> {
    await this.set(`blacklist:${jti}`, '1', ttlMs);
  }

  /**
   * Verificar si un token está en la blacklist
   */
  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const result = await this.get<string>(`blacklist:${jti}`);
    return result !== undefined && result !== null;
  }

  /**
   * Guardar datos de sesión
   */
  async setSession(
    userId: string,
    sessionId: string,
    data: Record<string, unknown>,
    ttlMs: number,
  ): Promise<void> {
    await this.set(`session:${userId}:${sessionId}`, data, ttlMs);
  }

  /**
   * Obtener datos de sesión
   */
  async getSession(
    userId: string,
    sessionId: string,
  ): Promise<Record<string, unknown> | undefined> {
    return this.get<Record<string, unknown>>(`session:${userId}:${sessionId}`);
  }

  /**
   * Invalidar todas las sesiones de un usuario
   */
  async invalidateUserSessions(userId: string): Promise<void> {
    await this.set(`user:${userId}:invalidated`, Date.now(), 7 * 24 * 60 * 60 * 1000);
  }

  /**
   * Verificar si las sesiones del usuario fueron invalidadas después de cierta fecha
   */
  async wereSessionsInvalidatedAfter(
    userId: string,
    tokenIssuedAt: number,
  ): Promise<boolean> {
    const invalidatedAt = await this.get<number>(`user:${userId}:invalidated`);
    if (!invalidatedAt) return false;
    return invalidatedAt > tokenIssuedAt * 1000;
  }

  // ==================== SESIONES ACTIVAS ====================

  /**
   * Registrar una sesión activa para un usuario
   */
  async registerActiveSession(
    userId: string,
    sessionId: string,
    metadata: {
      userAgent?: string;
      ip?: string;
      createdAt: number;
      expiresAt: number;
    },
  ): Promise<void> {
    const sessionsKey = `user:${userId}:active_sessions`;
    const sessions = await this.get<Record<string, typeof metadata>>(sessionsKey) || {};

    sessions[sessionId] = metadata;

    // TTL de 7 días (máximo tiempo de refresh token)
    await this.set(sessionsKey, sessions, 7 * 24 * 60 * 60 * 1000);
  }

  /**
   * Obtener todas las sesiones activas de un usuario
   */
  async getActiveSessions(
    userId: string,
  ): Promise<Array<{
    sessionId: string;
    userAgent?: string;
    ip?: string;
    createdAt: number;
    expiresAt: number;
    isCurrent?: boolean;
  }>> {
    const sessionsKey = `user:${userId}:active_sessions`;
    const sessions = await this.get<Record<string, {
      userAgent?: string;
      ip?: string;
      createdAt: number;
      expiresAt: number;
    }>>(sessionsKey);

    if (!sessions) return [];

    const now = Date.now();
    const activeSessions = Object.entries(sessions)
      .filter(([_, data]) => data.expiresAt > now)
      .map(([sessionId, data]) => ({
        sessionId,
        ...data,
      }));

    return activeSessions;
  }

  /**
   * Eliminar una sesión específica
   */
  async removeSession(userId: string, sessionId: string): Promise<void> {
    const sessionsKey = `user:${userId}:active_sessions`;
    const sessions = await this.get<Record<string, unknown>>(sessionsKey);

    if (sessions && sessions[sessionId]) {
      delete sessions[sessionId];
      await this.set(sessionsKey, sessions, 7 * 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Eliminar todas las sesiones de un usuario excepto la actual
   */
  async removeOtherSessions(userId: string, currentSessionId: string): Promise<number> {
    const sessionsKey = `user:${userId}:active_sessions`;
    const sessions = await this.get<Record<string, unknown>>(sessionsKey);

    if (!sessions) return 0;

    const sessionIds = Object.keys(sessions).filter(id => id !== currentSessionId);
    const removedCount = sessionIds.length;

    // Mantener solo la sesión actual
    const currentSession = sessions[currentSessionId];
    if (currentSession) {
      await this.set(sessionsKey, { [currentSessionId]: currentSession }, 7 * 24 * 60 * 60 * 1000);
    } else {
      await this.del(sessionsKey);
    }

    return removedCount;
  }

  /**
   * Contar sesiones activas de un usuario
   */
  async countActiveSessions(userId: string): Promise<number> {
    const sessions = await this.getActiveSessions(userId);
    return sessions.length;
  }
}
