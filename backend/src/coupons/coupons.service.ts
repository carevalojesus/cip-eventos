import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { Cron, CronExpression } from '@nestjs/schedule';

import { Coupon, CouponStatus, CouponType } from './entities/coupon.entity';
import { CouponUsage } from './entities/coupon-usage.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';

import { Event } from '../events/entities/event.entity';
import { EventTicket } from '../events/entities/event-ticket.entity';
import { Attendee } from '../attendees/entities/attendee.entity';
import { Registration } from '../registrations/entities/registration.entity';
import { User } from '../users/entities/user.entity';
import { CipIntegrationService } from '../cip-integration/cip-integration.service';

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: Coupon;
  discount?: number;
  finalPrice?: number;
  originalPrice?: number;
  errorCode?: string;
  errorMessage?: string;
}

@Injectable()
export class CouponsService {
  private readonly logger = new Logger(CouponsService.name);

  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepo: Repository<Coupon>,
    @InjectRepository(CouponUsage)
    private readonly usageRepo: Repository<CouponUsage>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(EventTicket)
    private readonly ticketRepo: Repository<EventTicket>,
    @InjectRepository(Attendee)
    private readonly attendeeRepo: Repository<Attendee>,
    private readonly cipService: CipIntegrationService,
    private readonly i18n: I18nService,
  ) {}

  // ========== CRUD ==========

  async create(dto: CreateCouponDto, user: User): Promise<Coupon> {
    // Verificar código único
    const existing = await this.couponRepo.findOne({
      where: { code: dto.code.toUpperCase() },
    });
    if (existing) {
      throw new BadRequestException(
        this.i18n.t('coupons.code_already_exists', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    // Validar evento si se especifica
    let event: Event | null = null;
    if (dto.eventId) {
      event = await this.eventRepo.findOne({ where: { id: dto.eventId } });
      if (!event) {
        throw new NotFoundException(
          this.i18n.t('coupons.event_not_found', {
            lang: I18nContext.current()?.lang,
          }),
        );
      }
    }

    // Validar tickets aplicables
    let applicableTickets: EventTicket[] = [];
    if (dto.applicableTicketIds?.length) {
      applicableTickets = await this.ticketRepo.find({
        where: { id: In(dto.applicableTicketIds) },
      });
    }

    const coupon = this.couponRepo.create({
      code: dto.code.toUpperCase(),
      description: dto.description,
      type: dto.type,
      value: dto.value,
      maxDiscount: dto.maxDiscount,
      minPurchaseAmount: dto.minPurchaseAmount || 0,
      maxTotalUses: dto.maxTotalUses,
      maxUsesPerPerson: dto.maxUsesPerPerson,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      requiresCipValidation: dto.requiresCipValidation || false,
      canCombineWithOthers: dto.canCombineWithOthers ?? true,
      appliesToAllTickets: dto.appliesToAllTickets ?? true,
      event,
      applicableTickets,
      createdBy: user,
    });

    return this.couponRepo.save(coupon);
  }

  async findAll(eventId?: string): Promise<Coupon[]> {
    const query = this.couponRepo
      .createQueryBuilder('coupon')
      .leftJoinAndSelect('coupon.event', 'event')
      .leftJoinAndSelect('coupon.applicableTickets', 'tickets');

    if (eventId) {
      query.where('coupon.event.id = :eventId OR coupon.event IS NULL', {
        eventId,
      });
    }

    return query.orderBy('coupon.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Coupon> {
    const coupon = await this.couponRepo.findOne({
      where: { id },
      relations: ['event', 'applicableTickets', 'createdBy'],
    });

    if (!coupon) {
      throw new NotFoundException(
        this.i18n.t('coupons.not_found', {
          lang: I18nContext.current()?.lang,
        }),
      );
    }

    return coupon;
  }

  async findByCode(code: string): Promise<Coupon | null> {
    return this.couponRepo.findOne({
      where: { code: code.toUpperCase() },
      relations: ['event', 'applicableTickets'],
    });
  }

  async update(id: string, dto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.findOne(id);

    // Validar tickets aplicables si se actualizan
    if (dto.applicableTicketIds) {
      coupon.applicableTickets = await this.ticketRepo.find({
        where: { id: In(dto.applicableTicketIds) },
      });
    }

    Object.assign(coupon, {
      ...dto,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : coupon.validFrom,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : coupon.validUntil,
    });

    return this.couponRepo.save(coupon);
  }

  async remove(id: string): Promise<void> {
    const coupon = await this.findOne(id);

    // Verificar si tiene usos
    const usageCount = await this.usageRepo.count({
      where: { coupon: { id } },
    });

    if (usageCount > 0) {
      // Soft delete - solo desactivar
      coupon.status = CouponStatus.INACTIVE;
      await this.couponRepo.save(coupon);
    } else {
      await this.couponRepo.remove(coupon);
    }
  }

  // ========== VALIDACIÓN Y APLICACIÓN ==========

  async validateCoupon(dto: ValidateCouponDto): Promise<CouponValidationResult> {
    const coupon = await this.findByCode(dto.code);

    if (!coupon) {
      return {
        isValid: false,
        errorCode: 'COUPON_NOT_FOUND',
        errorMessage: this.i18n.t('coupons.not_found', {
          lang: I18nContext.current()?.lang,
        }),
      };
    }

    // Obtener ticket para calcular precio
    const ticket = await this.ticketRepo.findOne({
      where: { id: dto.ticketId },
      relations: ['event'],
    });

    if (!ticket) {
      return {
        isValid: false,
        errorCode: 'TICKET_NOT_FOUND',
        errorMessage: this.i18n.t('coupons.ticket_not_found', {
          lang: I18nContext.current()?.lang,
        }),
      };
    }

    const originalPrice = Number(ticket.price);

    // Validar estado
    if (coupon.status !== CouponStatus.ACTIVE) {
      return {
        isValid: false,
        errorCode: 'COUPON_INACTIVE',
        errorMessage: this.i18n.t('coupons.inactive', {
          lang: I18nContext.current()?.lang,
        }),
      };
    }

    // Validar vigencia
    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
      return {
        isValid: false,
        errorCode: 'COUPON_NOT_YET_VALID',
        errorMessage: this.i18n.t('coupons.not_yet_valid', {
          lang: I18nContext.current()?.lang,
        }),
      };
    }

    if (coupon.validUntil && now > coupon.validUntil) {
      return {
        isValid: false,
        errorCode: 'COUPON_EXPIRED',
        errorMessage: this.i18n.t('coupons.expired', {
          lang: I18nContext.current()?.lang,
        }),
      };
    }

    // Validar evento
    if (coupon.event && coupon.event.id !== ticket.event.id) {
      return {
        isValid: false,
        errorCode: 'COUPON_WRONG_EVENT',
        errorMessage: this.i18n.t('coupons.wrong_event', {
          lang: I18nContext.current()?.lang,
        }),
      };
    }

    // Validar ticket específico
    if (!coupon.appliesToAllTickets && coupon.applicableTickets?.length) {
      const ticketIds = coupon.applicableTickets.map((t) => t.id);
      if (!ticketIds.includes(dto.ticketId)) {
        return {
          isValid: false,
          errorCode: 'COUPON_WRONG_TICKET',
          errorMessage: this.i18n.t('coupons.wrong_ticket', {
            lang: I18nContext.current()?.lang,
          }),
        };
      }
    }

    // Validar monto mínimo
    if (originalPrice < coupon.minPurchaseAmount) {
      return {
        isValid: false,
        errorCode: 'MIN_PURCHASE_NOT_MET',
        errorMessage: this.i18n.t('coupons.min_purchase_not_met', {
          lang: I18nContext.current()?.lang,
          args: { amount: coupon.minPurchaseAmount },
        }),
      };
    }

    // Validar usos totales
    if (coupon.maxTotalUses && coupon.currentUses >= coupon.maxTotalUses) {
      return {
        isValid: false,
        errorCode: 'COUPON_MAX_USES_REACHED',
        errorMessage: this.i18n.t('coupons.max_uses_reached', {
          lang: I18nContext.current()?.lang,
        }),
      };
    }

    // Validar usos por persona
    if (dto.attendeeId && coupon.maxUsesPerPerson) {
      const userUses = await this.usageRepo.count({
        where: {
          coupon: { id: coupon.id },
          attendee: { id: dto.attendeeId },
        },
      });

      if (userUses >= coupon.maxUsesPerPerson) {
        return {
          isValid: false,
          errorCode: 'COUPON_MAX_USES_PER_PERSON',
          errorMessage: this.i18n.t('coupons.max_uses_per_person', {
            lang: I18nContext.current()?.lang,
          }),
        };
      }
    }

    // Validar CIP si es requerido
    if (coupon.requiresCipValidation) {
      if (!dto.cipCode) {
        return {
          isValid: false,
          errorCode: 'CIP_REQUIRED',
          errorMessage: this.i18n.t('coupons.cip_required', {
            lang: I18nContext.current()?.lang,
          }),
        };
      }

      const cipValidation = await this.cipService.validateCip(dto.cipCode);
      if (!cipValidation.isValid || !cipValidation.isHabilitado) {
        return {
          isValid: false,
          errorCode: 'CIP_NOT_VALID',
          errorMessage: this.i18n.t('coupons.cip_not_valid', {
            lang: I18nContext.current()?.lang,
          }),
        };
      }
    }

    // Calcular descuento
    const discount = this.calculateDiscount(coupon, originalPrice);
    const finalPrice = Math.max(0, originalPrice - discount);

    return {
      isValid: true,
      coupon,
      discount,
      originalPrice,
      finalPrice,
    };
  }

  calculateDiscount(coupon: Coupon, originalPrice: number): number {
    let discount: number;

    if (coupon.type === CouponType.PERCENTAGE) {
      discount = (originalPrice * Number(coupon.value)) / 100;

      // Aplicar máximo si existe
      if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
        discount = Number(coupon.maxDiscount);
      }
    } else {
      // FIXED_AMOUNT
      discount = Number(coupon.value);
    }

    // El descuento no puede ser mayor al precio original
    return Math.min(discount, originalPrice);
  }

  async applyCoupon(
    coupon: Coupon,
    registration: Registration,
    attendee: Attendee,
    originalPrice: number,
    finalPrice: number,
  ): Promise<CouponUsage> {
    const discount = originalPrice - finalPrice;

    // Crear registro de uso
    const usage = this.usageRepo.create({
      coupon,
      registration,
      attendee,
      discountApplied: discount,
      originalPrice,
      finalPrice,
    });

    await this.usageRepo.save(usage);

    // Incrementar contador de usos
    coupon.currentUses += 1;
    await this.couponRepo.save(coupon);

    this.logger.log(
      `Cupón ${coupon.code} aplicado a registro ${registration.id}. Descuento: S/ ${discount}`,
    );

    return usage;
  }

  // ========== ESTADÍSTICAS ==========

  async getCouponStats(couponId: string) {
    const coupon = await this.findOne(couponId);

    const usages = await this.usageRepo.find({
      where: { coupon: { id: couponId } },
    });

    const totalDiscountGiven = usages.reduce(
      (sum, u) => sum + Number(u.discountApplied),
      0,
    );

    return {
      coupon,
      totalUses: coupon.currentUses,
      remainingUses: coupon.maxTotalUses
        ? coupon.maxTotalUses - coupon.currentUses
        : null,
      totalDiscountGiven,
      averageDiscount:
        usages.length > 0 ? totalDiscountGiven / usages.length : 0,
    };
  }

  // ========== CRON: Expirar cupones ==========

  @Cron(CronExpression.EVERY_HOUR)
  async expireCoupons() {
    const now = new Date();

    const result = await this.couponRepo.update(
      {
        status: CouponStatus.ACTIVE,
        validUntil: now,
      },
      {
        status: CouponStatus.EXPIRED,
      },
    );

    if (result.affected && result.affected > 0) {
      this.logger.log(`⏰ ${result.affected} cupones expirados automáticamente`);
    }
  }
}
