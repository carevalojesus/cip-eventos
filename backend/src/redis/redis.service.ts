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
}
