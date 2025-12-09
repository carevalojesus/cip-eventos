import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In, LessThanOrEqual } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { Cron, CronExpression } from '@nestjs/schedule';
import { v4 as uuidv4 } from 'uuid';

import { PurchaseOrder } from './entities/purchase-order.entity';
import { PaymentAttempt } from './entities/payment-attempt.entity';
import { PurchaseOrderStatus } from './enums/purchase-order-status.enum';
import { PaymentAttemptStatus } from './enums/payment-attempt-status.enum';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { CreatePaymentAttemptDto } from './dto/create-payment-attempt.dto';

import { Registration, RegistrationStatus } from '../registrations/entities/registration.entity';
import { EventTicket } from '../events/entities/event-ticket.entity';
import { Attendee, DocumentType } from '../attendees/entities/attendee.entity';
import { Person } from '../persons/entities/person.entity';
import { Event, EventStatus } from '../events/entities/event.entity';
import { CipIntegrationService } from '../cip-integration/cip-integration.service';
import { CouponsService, CouponValidationResult } from '../coupons/coupons.service';
import { EmailQueueService } from '../queue/services/email-queue.service';

// Tiempo de expiracion de pedido en minutos (por defecto 20)
const DEFAULT_ORDER_TIMEOUT_MINUTES = 20;

@Injectable()
export class PurchaseOrdersService {
  private readonly logger = new Logger(PurchaseOrdersService.name);
  private readonly orderTimeoutMinutes: number;

  constructor(
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepo: Repository<PurchaseOrder>,
    @InjectRepository(PaymentAttempt)
    private paymentAttemptRepo: Repository<PaymentAttempt>,
    @InjectRepository(Registration)
    private registrationRepo: Repository<Registration>,
    @InjectRepository(EventTicket)
    private ticketRepo: Repository<EventTicket>,
    @InjectRepository(Attendee)
    private attendeeRepo: Repository<Attendee>,
    @InjectRepository(Person)
    private personRepo: Repository<Person>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
    private readonly cipService: CipIntegrationService,
    private readonly couponsService: CouponsService,
    private readonly emailQueueService: EmailQueueService,
  ) {
    this.orderTimeoutMinutes = this.configService.get<number>(
      'PURCHASE_ORDER_TIMEOUT_MINUTES',
      DEFAULT_ORDER_TIMEOUT_MINUTES,
    );
  }

  // Crear un pedido de compra con multiples items
  async create(dto: CreatePurchaseOrderDto, metadata?: { clientIp?: string; userAgent?: string }) {
    const { buyerEmail, buyerPersonId, items } = dto;

    return await this.dataSource.transaction(
      'SERIALIZABLE',
      async (manager) => {
        // 1. Resolver persona compradora (si existe)
        let buyerPerson: Person | null = null;
        if (buyerPersonId) {
          buyerPerson = await manager.findOne(Person, {
            where: { id: buyerPersonId },
          });
          if (!buyerPerson) {
            throw new NotFoundException(
              this.i18n.t('purchase-orders.buyer_not_found', {
                lang: I18nContext.current()?.lang,
              }),
            );
          }
        }

        // 2. Crear el pedido de compra
        const purchaseOrder = manager.create(PurchaseOrder, {
          buyerEmail,
          buyerPerson,
          totalAmount: 0,
          currency: 'PEN',
          status: PurchaseOrderStatus.PENDING,
          expiresAt: new Date(
            Date.now() + this.orderTimeoutMinutes * 60 * 1000,
          ),
          metadata: metadata || null,
        });

        const savedOrder = await manager.save(purchaseOrder);
        this.logger.log(
          `Pedido de compra creado: ${savedOrder.id} para ${buyerEmail}`,
        );

        // 3. Procesar cada item del pedido
        let totalAmount = 0;
        const registrations: Registration[] = [];

        for (const item of items) {
          const { ticketId, quantity, attendees, couponCode } = item;

          // Validar que la cantidad coincida con el numero de asistentes
          if (attendees.length !== quantity) {
            throw new BadRequestException(
              this.i18n.t('purchase-orders.attendee_count_mismatch', {
                lang: I18nContext.current()?.lang,
              }),
            );
          }

          // Buscar ticket con bloqueo pesimista
          const ticket = await manager.findOne(EventTicket, {
            where: { id: ticketId, isActive: true },
            relations: ['event', 'event.location'],
            lock: { mode: 'pessimistic_write' },
          });

          if (!ticket) {
            throw new NotFoundException(
              this.i18n.t('purchase-orders.ticket_not_found', {
                lang: I18nContext.current()?.lang,
                args: { ticketId },
              }),
            );
          }

          const event = ticket.event;

          if (event.status !== EventStatus.PUBLISHED) {
            throw new BadRequestException(
              this.i18n.t('purchase-orders.event_not_available', {
                lang: I18nContext.current()?.lang,
              }),
            );
          }

          // Validar limite por pedido
          if (quantity > ticket.maxPerOrder) {
            throw new BadRequestException(
              this.i18n.t('purchase-orders.exceeds_max_per_order', {
                lang: I18nContext.current()?.lang,
                args: { max: ticket.maxPerOrder },
              }),
            );
          }

          // Validar stock disponible
          const reservedCount = await manager.count(Registration, {
            where: {
              eventTicket: { id: ticketId },
              status: In([
                RegistrationStatus.CONFIRMED,
                RegistrationStatus.PENDING,
              ]),
            },
          });

          if (reservedCount + quantity > ticket.stock) {
            throw new BadRequestException(
              this.i18n.t('purchase-orders.insufficient_stock', {
                lang: I18nContext.current()?.lang,
                args: { available: ticket.stock - reservedCount },
              }),
            );
          }

          // Crear una inscripcion por cada asistente
          for (const attendeeData of attendees) {
            // Resolver o crear attendee
            let attendee = await manager.findOne(Attendee, {
              where: [
                { email: attendeeData.email },
                { documentNumber: attendeeData.documentNumber },
              ],
            });

            if (!attendee) {
              attendee = manager.create(Attendee, {
                ...attendeeData,
                documentType: attendeeData.documentType || DocumentType.DNI,
              });
              attendee = await manager.save(attendee);
            } else {
              // Validar CIP si cambio
              if (
                attendeeData.cipCode &&
                attendeeData.cipCode !== attendee.cipCode
              ) {
                const cipValidation = await this.cipService.validateCip(
                  attendeeData.cipCode,
                );
                if (!cipValidation.isValid) {
                  throw new BadRequestException(
                    this.i18n.t('purchase-orders.invalid_cip_code', {
                      lang: I18nContext.current()?.lang,
                    }),
                  );
                }
                attendee.cipCode = attendeeData.cipCode;
                await manager.save(attendee);
              }
            }

            // Validar duplicidad
            const existing = await manager.findOne(Registration, {
              where: {
                attendee: { id: attendee.id },
                event: { id: event.id },
                status: In([
                  RegistrationStatus.CONFIRMED,
                  RegistrationStatus.PENDING,
                  RegistrationStatus.ATTENDED,
                ]),
              },
            });

            if (existing) {
              throw new BadRequestException(
                this.i18n.t('purchase-orders.already_registered', {
                  lang: I18nContext.current()?.lang,
                  args: { name: `${attendee.firstName} ${attendee.lastName}` },
                }),
              );
            }

            // Validar reglas de CIP
            if (ticket.requiresCipValidation) {
              if (!attendee.cipCode) {
                throw new BadRequestException(
                  this.i18n.t('purchase-orders.cip_required', {
                    lang: I18nContext.current()?.lang,
                  }),
                );
              }

              const cipStatus = await this.cipService.validateCip(
                attendee.cipCode,
              );
              if (!cipStatus.isHabilitado) {
                throw new BadRequestException(
                  this.i18n.t('purchase-orders.not_habilitated', {
                    lang: I18nContext.current()?.lang,
                  }),
                );
              }
            }

            // Calcular precio con cupon si aplica
            const originalPrice = Number(ticket.price);
            let finalPrice = originalPrice;
            let discountAmount = 0;
            let couponValidation: CouponValidationResult | null = null;

            if (couponCode) {
              couponValidation = await this.couponsService.validateCoupon({
                code: couponCode,
                ticketId: ticketId,
                attendeeId: attendee.id,
                cipCode: attendee.cipCode || undefined,
              });

              if (!couponValidation.isValid) {
                throw new BadRequestException(
                  couponValidation.errorMessage ||
                    this.i18n.t('purchase-orders.invalid_coupon', {
                      lang: I18nContext.current()?.lang,
                    }),
                );
              }

              finalPrice = couponValidation.finalPrice!;
              discountAmount = couponValidation.discount!;
            }

            // Crear inscripcion
            const registration = manager.create(Registration, {
              attendee,
              eventTicket: ticket,
              event,
              purchaseOrder: savedOrder,
              ticketCode: uuidv4(),
              originalPrice,
              finalPrice,
              discountAmount,
              status: RegistrationStatus.PENDING,
              expiresAt: savedOrder.expiresAt,
            });

            const savedReg = await manager.save(registration);
            registrations.push(savedReg);

            // Registrar uso del cupon
            if (couponValidation?.isValid && couponValidation.coupon) {
              await this.couponsService.applyCoupon(
                couponValidation.coupon,
                savedReg,
                attendee,
                originalPrice,
                finalPrice,
              );
            }

            totalAmount += finalPrice;
          }
        }

        // 4. Actualizar el monto total del pedido
        savedOrder.totalAmount = totalAmount;
        await manager.save(savedOrder);

        this.logger.log(
          `Pedido de compra ${savedOrder.id} completado con ${registrations.length} inscripciones. Total: S/${totalAmount}`,
        );

        // 5. Si el total es 0 (todo gratis), confirmar inmediatamente
        if (totalAmount === 0) {
          await this.markAsPaidInternal(savedOrder.id, null, manager);
          this.logger.log(
            `Pedido de compra ${savedOrder.id} confirmado automaticamente (monto 0)`,
          );
        }

        return {
          message: this.i18n.t('purchase-orders.created', {
            lang: I18nContext.current()?.lang,
          }),
          purchaseOrderId: savedOrder.id,
          status: savedOrder.status,
          totalAmount,
          itemCount: registrations.length,
          expiresAt: savedOrder.expiresAt,
        };
      },
    );
  }

  // Obtener un pedido por ID
  async findById(id: string) {
    const purchaseOrder = await this.purchaseOrderRepo.findOne({
      where: { id },
      relations: [
        'buyerPerson',
        'registrations',
        'registrations.attendee',
        'registrations.eventTicket',
        'registrations.event',
        'paymentAttempts',
        'payment',
      ],
    });

    if (!purchaseOrder) {
      throw new NotFoundException(
        this.i18n.t('purchase-orders.not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    return purchaseOrder;
  }

  // Marcar pedido como expirado y liberar cupos
  async expire(id: string) {
    return await this.dataSource.transaction(async (manager) => {
      const purchaseOrder = await manager.findOne(PurchaseOrder, {
        where: { id },
        relations: ['registrations'],
      });

      if (!purchaseOrder) {
        throw new NotFoundException(
          this.i18n.t('purchase-orders.not_found', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      if (purchaseOrder.status !== PurchaseOrderStatus.PENDING) {
        throw new BadRequestException(
          this.i18n.t('purchase-orders.cannot_expire', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      // Marcar pedido como expirado
      purchaseOrder.status = PurchaseOrderStatus.EXPIRED;
      await manager.save(purchaseOrder);

      // Marcar todas las inscripciones como expiradas
      for (const registration of purchaseOrder.registrations) {
        registration.status = RegistrationStatus.EXPIRED;
        await manager.save(registration);
      }

      this.logger.log(
        `Pedido de compra ${id} expirado. ${purchaseOrder.registrations.length} inscripciones liberadas`,
      );

      return {
        message: this.i18n.t('purchase-orders.expired', {
          lang: I18nContext.current()?.lang,
        }),
      };
    });
  }

  // Marcar pedido como pagado (version interna para transacciones)
  private async markAsPaidInternal(
    id: string,
    paymentId: string | null,
    manager: any,
  ) {
    const purchaseOrder = await manager.findOne(PurchaseOrder, {
      where: { id },
      relations: ['registrations'],
    });

    if (!purchaseOrder) {
      throw new NotFoundException(
        this.i18n.t('purchase-orders.not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    if (purchaseOrder.status === PurchaseOrderStatus.PAID) {
      this.logger.log(`Pedido ${id} ya estaba pagado`);
      return purchaseOrder;
    }

    // Marcar pedido como pagado
    purchaseOrder.status = PurchaseOrderStatus.PAID;
    purchaseOrder.paidAt = new Date();
    await manager.save(purchaseOrder);

    // Confirmar todas las inscripciones
    for (const registration of purchaseOrder.registrations) {
      registration.status = RegistrationStatus.CONFIRMED;
      await manager.save(registration);

      // Encolar email de confirmacion
      await this.emailQueueService.queueTicketEmail(registration.id);
    }

    this.logger.log(
      `Pedido de compra ${id} marcado como pagado. ${purchaseOrder.registrations.length} inscripciones confirmadas`,
    );

    return purchaseOrder;
  }

  // Marcar pedido como pagado (version publica)
  async markAsPaid(id: string, paymentId: string) {
    return await this.dataSource.transaction(async (manager) => {
      return await this.markAsPaidInternal(id, paymentId, manager);
    });
  }

  // Cancelar un pedido pendiente
  async cancel(id: string) {
    return await this.dataSource.transaction(async (manager) => {
      const purchaseOrder = await manager.findOne(PurchaseOrder, {
        where: { id },
        relations: ['registrations'],
      });

      if (!purchaseOrder) {
        throw new NotFoundException(
          this.i18n.t('purchase-orders.not_found', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      if (purchaseOrder.status !== PurchaseOrderStatus.PENDING) {
        throw new BadRequestException(
          this.i18n.t('purchase-orders.cannot_cancel', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }

      // Marcar pedido como cancelado
      purchaseOrder.status = PurchaseOrderStatus.CANCELLED;
      await manager.save(purchaseOrder);

      // Marcar todas las inscripciones como canceladas
      for (const registration of purchaseOrder.registrations) {
        registration.status = RegistrationStatus.CANCELLED;
        await manager.save(registration);
      }

      this.logger.log(
        `Pedido de compra ${id} cancelado. ${purchaseOrder.registrations.length} inscripciones liberadas`,
      );

      return {
        message: this.i18n.t('purchase-orders.cancelled', {
          lang: I18nContext.current()?.lang,
        }),
      };
    });
  }

  // CRON: Expirar pedidos pendientes que pasaron su fecha limite
  @Cron(CronExpression.EVERY_MINUTE)
  async expirePendingOrders() {
    const now = new Date();

    const expiredOrders = await this.purchaseOrderRepo.find({
      where: {
        status: PurchaseOrderStatus.PENDING,
        expiresAt: LessThanOrEqual(now),
      },
      relations: ['registrations'],
    });

    if (expiredOrders.length === 0) {
      return;
    }

    this.logger.log(
      `Expirando ${expiredOrders.length} pedidos de compra pendientes...`,
    );

    for (const order of expiredOrders) {
      try {
        await this.expire(order.id);
      } catch (error) {
        this.logger.error(
          `Error expirando pedido ${order.id}: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `${expiredOrders.length} pedidos de compra marcados como expirados`,
    );
  }

  // Crear intento de pago
  async createPaymentAttempt(dto: CreatePaymentAttemptDto) {
    const { purchaseOrderId, provider, amount, transactionId } = dto;

    const purchaseOrder = await this.purchaseOrderRepo.findOne({
      where: { id: purchaseOrderId },
    });

    if (!purchaseOrder) {
      throw new NotFoundException(
        this.i18n.t('purchase-orders.not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    const paymentAttempt = this.paymentAttemptRepo.create({
      purchaseOrder,
      provider,
      amount,
      transactionId: transactionId || null,
      status: PaymentAttemptStatus.INITIATED,
    });

    return await this.paymentAttemptRepo.save(paymentAttempt);
  }

  // Actualizar estado de intento de pago
  async updatePaymentAttemptStatus(
    id: string,
    status: PaymentAttemptStatus,
    transactionId?: string,
    errorMessage?: string,
    metadata?: any,
  ) {
    const attempt = await this.paymentAttemptRepo.findOne({
      where: { id },
    });

    if (!attempt) {
      throw new NotFoundException(
        this.i18n.t('purchase-orders.attempt_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    attempt.status = status;
    if (transactionId) attempt.transactionId = transactionId;
    if (errorMessage) attempt.errorMessage = errorMessage;
    if (metadata) attempt.metadata = metadata;

    return await this.paymentAttemptRepo.save(attempt);
  }
}
