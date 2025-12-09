import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { PurchaseOrder } from '../../purchase-orders/entities/purchase-order.entity';
import { PurchaseOrderStatus } from '../../purchase-orders/enums/purchase-order-status.enum';
import { RateLimitConfig } from '../config/rate-limit.config';
import { I18nService, I18nContext } from 'nestjs-i18n';

@Injectable()
export class PendingOrdersLimitGuard implements CanActivate {
  private readonly logger = new Logger(PendingOrdersLimitGuard.name);

  constructor(
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepo: Repository<PurchaseOrder>,
    private readonly i18n: I18nService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const body = request.body;

    // Extraer IP del cliente
    const clientIp = this.getClientIp(request);

    // Obtener personId del body si existe
    const buyerPersonId = body?.buyerPersonId;

    // Verificar limite por IP
    await this.checkIpLimit(clientIp);

    // Verificar limite por Persona (solo si se proporciona buyerPersonId)
    if (buyerPersonId) {
      await this.checkPersonLimit(buyerPersonId);
    }

    return true;
  }

  private async checkIpLimit(clientIp: string): Promise<void> {
    const maxPendingPerIp = RateLimitConfig.MAX_PENDING_ORDERS_PER_IP;

    // Contar pedidos PENDING asociados a esta IP
    // Nota: Para rastrear IPs, necesitariamos agregar un campo 'ipAddress' a PurchaseOrder
    // Por ahora, usaremos el email como proxy (limitacion temporal)
    // En una implementacion completa, agregariamos el campo ipAddress a la entidad

    // IMPORTANTE: Esta es una implementacion simplificada
    // Para produccion, se deberia agregar un campo 'ipAddress' en PurchaseOrder
    // y crear un indice sobre ese campo

    const pendingOrdersByIp = await this.purchaseOrderRepo
      .createQueryBuilder('po')
      .where('po.status = :status', { status: PurchaseOrderStatus.PENDING })
      .andWhere('po.metadata @> :metadata', {
        metadata: JSON.stringify({ clientIp }),
      })
      .getCount();

    if (pendingOrdersByIp >= maxPendingPerIp) {
      this.logger.warn(
        `IP ${clientIp} ha excedido el limite de pedidos pendientes (${pendingOrdersByIp}/${maxPendingPerIp})`,
      );

      throw new BadRequestException(
        this.i18n.t('purchase-orders.ip_limit_exceeded', {
          lang: I18nContext.current()?.lang,
          args: { limit: maxPendingPerIp },
        }) ||
          `Has excedido el limite de ${maxPendingPerIp} pedidos pendientes por IP. Por favor, completa o cancela tus pedidos existentes antes de crear uno nuevo.`,
      );
    }

    this.logger.debug(
      `IP ${clientIp}: ${pendingOrdersByIp}/${maxPendingPerIp} pedidos pendientes`,
    );
  }

  private async checkPersonLimit(buyerPersonId: string): Promise<void> {
    const maxPendingPerPerson =
      RateLimitConfig.MAX_PENDING_ORDERS_PER_PERSON;

    // Contar pedidos PENDING asociados a esta Persona
    const pendingOrdersByPerson = await this.purchaseOrderRepo.count({
      where: {
        buyerPerson: { id: buyerPersonId },
        status: PurchaseOrderStatus.PENDING,
      },
    });

    if (pendingOrdersByPerson >= maxPendingPerPerson) {
      this.logger.warn(
        `Persona ${buyerPersonId} ha excedido el limite de pedidos pendientes (${pendingOrdersByPerson}/${maxPendingPerPerson})`,
      );

      throw new BadRequestException(
        this.i18n.t('purchase-orders.person_limit_exceeded', {
          lang: I18nContext.current()?.lang,
          args: { limit: maxPendingPerPerson },
        }) ||
          `Has excedido el limite de ${maxPendingPerPerson} pedidos pendientes. Por favor, completa o cancela tus pedidos existentes antes de crear uno nuevo.`,
      );
    }

    this.logger.debug(
      `Persona ${buyerPersonId}: ${pendingOrdersByPerson}/${maxPendingPerPerson} pedidos pendientes`,
    );
  }

  private getClientIp(request: Request): string {
    // Extraer IP del cliente considerando proxies
    const xForwardedFor = request.headers['x-forwarded-for'];
    const xRealIp = request.headers['x-real-ip'];

    if (xForwardedFor) {
      // x-forwarded-for puede contener multiples IPs separadas por coma
      const ips = Array.isArray(xForwardedFor)
        ? xForwardedFor[0]
        : xForwardedFor;
      return ips.split(',')[0].trim();
    }

    if (xRealIp) {
      return Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
    }

    // Fallback a la IP de la conexion directa
    return (
      request.ip ||
      request.socket.remoteAddress ||
      request.connection.remoteAddress ||
      'unknown'
    );
  }
}
