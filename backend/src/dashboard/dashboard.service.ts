import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Between } from 'typeorm';
import { EventsService } from '../events/events.service';
import { RegistrationsService } from '../registrations/registrations.service';
import { PaymentsService } from '../payments/payments.service';
import { UsersService } from '../users/users.service';
import { Event, EventStatus } from '../events/entities/event.entity';
import {
  Registration,
  RegistrationStatus,
} from '../registrations/entities/registration.entity';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { RedisService } from '../redis/redis.service';

// Cache TTLs en milisegundos
const CACHE_TTL = {
  STATS: 5 * 60 * 1000, // 5 minutos
  UPCOMING_EVENTS: 2 * 60 * 1000, // 2 minutos
  RECENT_ACTIVITY: 1 * 60 * 1000, // 1 minuto
};

@Injectable()
export class DashboardService {
  constructor(
    private readonly eventsService: EventsService,
    private readonly registrationsService: RegistrationsService,
    private readonly paymentsService: PaymentsService,
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Registration)
    private readonly registrationRepository: Repository<Registration>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async getStats() {
    // Intentar obtener del cache
    const cacheKey = 'dashboard:stats';
    const cached =
      await this.redisService.get<ReturnType<typeof this.calculateStats>>(
        cacheKey,
      );
    if (cached) {
      return cached;
    }

    const stats = await this.calculateStats();
    await this.redisService.set(cacheKey, stats, CACHE_TTL.STATS);
    return stats;
  }

  private async calculateStats() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );
    const firstDayOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );
    const lastDayOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
    );

    // 1. Active Events (PUBLISHED status and upcoming or ongoing)
    const activeEvents = await this.eventRepository.count({
      where: {
        status: EventStatus.PUBLISHED,
        endAt: MoreThan(now),
      },
    });

    // Active events from last month for trend calculation
    const lastMonthActiveEvents = await this.eventRepository.count({
      where: {
        status: EventStatus.PUBLISHED,
        endAt: MoreThan(firstDayOfLastMonth),
      },
    });

    // 2. Total Registered (all confirmed registrations)
    const totalRegistered = await this.registrationRepository.count({
      where: {
        status: RegistrationStatus.CONFIRMED,
      },
    });

    const lastMonthRegistered = await this.registrationRepository.count({
      where: {
        status: RegistrationStatus.CONFIRMED,
        registeredAt: Between(firstDayOfLastMonth, lastDayOfLastMonth),
      },
    });

    // 3. Monthly Income (current month completed payments)
    const monthlyPayments = await this.paymentRepository.find({
      where: {
        status: PaymentStatus.COMPLETED,
        createdAt: Between(firstDayOfMonth, lastDayOfMonth),
      },
      select: ['amount'],
    });
    const monthlyIncome = monthlyPayments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    // Last month income for trend
    const lastMonthPayments = await this.paymentRepository.find({
      where: {
        status: PaymentStatus.COMPLETED,
        createdAt: Between(firstDayOfLastMonth, lastDayOfLastMonth),
      },
      select: ['amount'],
    });
    const lastMonthIncome = lastMonthPayments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    // 4. Tickets Sold (current month)
    const ticketsSold = await this.registrationRepository.count({
      where: {
        status: RegistrationStatus.CONFIRMED,
        registeredAt: Between(firstDayOfMonth, lastDayOfMonth),
      },
    });

    const lastMonthTicketsSold = await this.registrationRepository.count({
      where: {
        status: RegistrationStatus.CONFIRMED,
        registeredAt: Between(firstDayOfLastMonth, lastDayOfLastMonth),
      },
    });

    // Calculate trends (percentage change from last month)
    const calculateTrend = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      activeEvents,
      totalRegistered,
      monthlyIncome: Math.round(monthlyIncome * 100) / 100, // Round to 2 decimals
      ticketsSold,
      trends: {
        activeEvents: calculateTrend(activeEvents, lastMonthActiveEvents),
        totalRegistered: calculateTrend(totalRegistered, lastMonthRegistered),
        monthlyIncome: calculateTrend(monthlyIncome, lastMonthIncome),
        ticketsSold: calculateTrend(ticketsSold, lastMonthTicketsSold),
      },
    };
  }

  async getUpcomingEvents(limit: number) {
    // Intentar obtener del cache
    const cacheKey = `dashboard:upcoming:${limit}`;
    const cached =
      await this.redisService.get<
        Awaited<ReturnType<typeof this.fetchUpcomingEvents>>
      >(cacheKey);
    if (cached) {
      return cached;
    }

    const events = await this.fetchUpcomingEvents(limit);
    await this.redisService.set(cacheKey, events, CACHE_TTL.UPCOMING_EVENTS);
    return events;
  }

  private async fetchUpcomingEvents(limit: number) {
    const now = new Date();

    const upcomingEvents = await this.eventRepository.find({
      where: {
        startAt: MoreThan(now),
        status: EventStatus.PUBLISHED,
      },
      order: {
        startAt: 'ASC',
      },
      take: limit,
      relations: ['tickets'],
    });

    // Transform events to match frontend interface
    const eventsWithAttendees = await Promise.all(
      upcomingEvents.map(async (event) => {
        const attendeesCount = await this.registrationRepository.count({
          where: {
            event: { id: event.id },
            status: RegistrationStatus.CONFIRMED,
          },
        });

        return {
          id: event.id,
          title: event.title,
          date: event.startAt.toISOString(),
          attendees: attendeesCount,
          status: event.status.toLowerCase(),
        };
      }),
    );

    return eventsWithAttendees;
  }

  async getRecentActivity(limit: number) {
    // Intentar obtener del cache
    const cacheKey = `dashboard:activity:${limit}`;
    const cached =
      await this.redisService.get<
        Awaited<ReturnType<typeof this.fetchRecentActivity>>
      >(cacheKey);
    if (cached) {
      return cached;
    }

    const activities = await this.fetchRecentActivity(limit);
    await this.redisService.set(
      cacheKey,
      activities,
      CACHE_TTL.RECENT_ACTIVITY,
    );
    return activities;
  }

  private async fetchRecentActivity(limit: number) {
    // Fetch recent registrations as activity
    const recentRegistrations = await this.registrationRepository.find({
      order: {
        registeredAt: 'DESC',
      },
      take: limit,
      relations: ['attendee', 'event', 'payment'],
    });

    // Transform registrations to activity format
    const activities = recentRegistrations.map((registration) => {
      let action = 'registered';

      if (registration.payment?.status === PaymentStatus.COMPLETED) {
        action = 'payment';
      } else if (registration.attended) {
        action = 'check-in';
      }

      return {
        id: registration.id,
        user:
          registration.attendee?.firstName && registration.attendee?.lastName
            ? `${registration.attendee.firstName} ${registration.attendee.lastName}`
            : registration.attendee?.email || 'Usuario',
        action,
        target: registration.event?.title || 'Evento',
        timestamp: registration.registeredAt.toISOString(),
      };
    });

    return activities;
  }

  /**
   * Invalidar cache del dashboard
   * Llamar cuando hay cambios en eventos, registros o pagos
   */
  async invalidateCache() {
    await Promise.all([
      this.redisService.del('dashboard:stats'),
      this.redisService.del('dashboard:upcoming:5'),
      this.redisService.del('dashboard:upcoming:10'),
      this.redisService.del('dashboard:activity:5'),
      this.redisService.del('dashboard:activity:10'),
    ]);
  }
}
