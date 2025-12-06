import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Person, PersonStatus } from '../entities/person.entity';
import { User } from '../../users/entities/user.entity';
import { Attendee } from '../../attendees/entities/attendee.entity';
import { BlockEnrollment } from '../../evaluations/entities/block-enrollment.entity';
import { SessionAttendance } from '../../evaluations/entities/session-attendance.entity';

export interface MergeResult {
  primaryPerson: Person;
  secondaryPerson: Person;
  affectedRecords: ReassignmentCounts;
  reissuedCertificates?: number;
}

export interface ReassignmentCounts {
  attendees: number;
  blockEnrollments: number;
  sessionAttendances: number;
  total: number;
}

export interface MergeOptions {
  reissueCertificates?: boolean;
}

@Injectable()
export class PersonMergeService {
  private readonly logger = new Logger(PersonMergeService.name);

  constructor(
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Fusiona personaSecundaria INTO personaPrincipal
   * Todas las referencias se mueven a personaPrincipal
   * personaSecundaria queda en estado MERGED
   */
  async merge(
    primaryPersonId: string,
    secondaryPersonId: string,
    performedBy: User,
    options: MergeOptions = {},
  ): Promise<MergeResult> {
    this.logger.log(
      `Starting merge: ${secondaryPersonId} -> ${primaryPersonId}`,
    );

    return this.dataSource.transaction(async (manager) => {
      // 1. Validar que ambas personas existen y están ACTIVE
      const primaryPerson = await manager.findOne(Person, {
        where: { id: primaryPersonId },
        relations: ['user'],
      });

      if (!primaryPerson) {
        throw new NotFoundException(
          `Primary person with ID ${primaryPersonId} not found`,
        );
      }

      if (primaryPerson.status !== PersonStatus.ACTIVE) {
        throw new BadRequestException(
          `Primary person must be in ACTIVE status. Current status: ${primaryPerson.status}`,
        );
      }

      const secondaryPerson = await manager.findOne(Person, {
        where: { id: secondaryPersonId },
        relations: ['user'],
      });

      if (!secondaryPerson) {
        throw new NotFoundException(
          `Secondary person with ID ${secondaryPersonId} not found`,
        );
      }

      if (secondaryPerson.status !== PersonStatus.ACTIVE) {
        throw new BadRequestException(
          `Secondary person must be in ACTIVE status. Current status: ${secondaryPerson.status}`,
        );
      }

      // No se puede fusionar una persona consigo misma
      if (primaryPersonId === secondaryPersonId) {
        throw new BadRequestException('Cannot merge a person with itself');
      }

      // Validar que existe al menos una razón de duplicidad
      await this.validateDuplicateReason(primaryPerson, secondaryPerson);

      // 2. Reasignar todas las referencias
      const counts = await this.reassignReferences(
        manager,
        primaryPersonId,
        secondaryPersonId,
      );

      // 3. Marcar secundaria como MERGED
      secondaryPerson.status = PersonStatus.MERGED;
      secondaryPerson.mergedToPerson = primaryPerson;
      secondaryPerson.mergedAt = new Date();
      secondaryPerson.mergedBy = performedBy;
      await manager.save(Person, secondaryPerson);

      this.logger.log(
        `Merge completed successfully. Affected records: ${JSON.stringify(counts)}`,
      );

      // 4. Opcionalmente reemitir certificados
      let reissuedCertificates = 0;
      if (options.reissueCertificates) {
        // TODO: Implementar reemisión de certificados
        this.logger.log('Certificate reissue requested but not implemented yet');
      }

      return {
        primaryPerson,
        secondaryPerson,
        affectedRecords: counts,
        reissuedCertificates,
      };
    });
  }

  /**
   * Reasigna todas las referencias de secundaria a principal
   */
  private async reassignReferences(
    manager: EntityManager,
    primaryId: string,
    secondaryId: string,
  ): Promise<ReassignmentCounts> {
    const counts: ReassignmentCounts = {
      attendees: 0,
      blockEnrollments: 0,
      sessionAttendances: 0,
      total: 0,
    };

    // Attendees - Actualizar referencia a person
    const attendeeResult = await manager
      .createQueryBuilder()
      .update(Attendee)
      .set({ person: { id: primaryId } as any })
      .where('personId = :secondaryId', { secondaryId })
      .execute();
    counts.attendees = attendeeResult.affected || 0;

    // Block Enrollments - Se actualizan indirectamente a través de attendee
    // pero los verificamos para el conteo
    const blockEnrollments = await manager
      .createQueryBuilder(BlockEnrollment, 'enrollment')
      .innerJoin('enrollment.attendee', 'attendee')
      .where('attendee.personId = :primaryId', { primaryId })
      .getCount();
    counts.blockEnrollments = blockEnrollments;

    // Session Attendances - Se actualizan indirectamente a través de attendee
    const sessionAttendances = await manager
      .createQueryBuilder(SessionAttendance, 'attendance')
      .innerJoin('attendance.attendee', 'attendee')
      .where('attendee.personId = :primaryId', { primaryId })
      .getCount();
    counts.sessionAttendances = sessionAttendances;

    counts.total = counts.attendees;

    return counts;
  }

  /**
   * Valida que existe al menos una razón de duplicidad
   */
  private async validateDuplicateReason(
    primary: Person,
    secondary: Person,
  ): Promise<void> {
    const hasSameEmail = primary.email === secondary.email;
    const hasSameDocument =
      primary.documentType === secondary.documentType &&
      primary.documentNumber === secondary.documentNumber;

    if (!hasSameEmail && !hasSameDocument) {
      throw new BadRequestException(
        'Persons must have at least one duplicate reason (same email or same document)',
      );
    }
  }

  /**
   * Busca posibles duplicados para una persona
   */
  async findPotentialDuplicates(personId: string): Promise<Person[]> {
    const person = await this.personRepository.findOne({
      where: { id: personId },
    });

    if (!person) {
      throw new NotFoundException(`Person with ID ${personId} not found`);
    }

    const queryBuilder = this.personRepository
      .createQueryBuilder('person')
      .where('person.id != :personId', { personId })
      .andWhere('person.status = :status', { status: PersonStatus.ACTIVE });

    // Buscar por mismo email O mismo documento
    queryBuilder.andWhere(
      '(person.email = :email OR (person.documentType = :documentType AND person.documentNumber = :documentNumber))',
      {
        email: person.email,
        documentType: person.documentType,
        documentNumber: person.documentNumber,
      },
    );

    return queryBuilder.getMany();
  }

  /**
   * Obtiene historial de fusiones de una persona
   * Devuelve todas las personas que fueron fusionadas a esta
   */
  async getMergeHistory(personId: string): Promise<Person[]> {
    const person = await this.personRepository.findOne({
      where: { id: personId },
    });

    if (!person) {
      throw new NotFoundException(`Person with ID ${personId} not found`);
    }

    return this.personRepository.find({
      where: {
        mergedToPerson: { id: personId },
        status: PersonStatus.MERGED,
      },
      relations: ['mergedBy'],
      order: { mergedAt: 'DESC' },
    });
  }

  /**
   * Valida si una persona puede ser fusionada
   */
  async canBeMerged(personId: string): Promise<{
    canMerge: boolean;
    reason?: string;
  }> {
    const person = await this.personRepository.findOne({
      where: { id: personId },
    });

    if (!person) {
      return { canMerge: false, reason: 'Person not found' };
    }

    if (person.status !== PersonStatus.ACTIVE) {
      return {
        canMerge: false,
        reason: `Person is not active. Current status: ${person.status}`,
      };
    }

    return { canMerge: true };
  }
}
