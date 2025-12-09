export const RateLimitConfig = {
  // Limite de pedidos PENDING por Persona
  MAX_PENDING_ORDERS_PER_PERSON:
    parseInt(process.env.MAX_PENDING_ORDERS_PER_PERSON || '3', 10),

  // Limite de pedidos PENDING por IP
  MAX_PENDING_ORDERS_PER_IP:
    parseInt(process.env.MAX_PENDING_ORDERS_PER_IP || '5', 10),

  // Throttle TTL en milisegundos (por defecto 60 segundos)
  THROTTLE_TTL: parseInt(process.env.THROTTLE_TTL || '60000', 10),

  // Throttle Limit (numero de peticiones permitidas en el TTL)
  THROTTLE_LIMIT: parseInt(process.env.THROTTLE_LIMIT || '10', 10),
} as const;

export type RateLimitConfigType = typeof RateLimitConfig;
