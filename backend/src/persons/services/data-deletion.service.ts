import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Person } from '../entities/person.entity';
import { User } from '../../users/entities/user.entity';
import { PseudonymizePersonDto } from '../dto/pseudonymize-person.dto';
import { DeletionStatusDto } from '../dto/deletion-status.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DataDeletionService {
  private readonly logger = new Logger(DataDeletionService.name);

  constructor(
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Mark a deletion request for a person associated with a user
   */
  async requestDeletion(userId: string, reason?: string): Promise<void> {
    this.logger.log(`Deletion requested for user: ${userId}`);

    // Find the user
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if already deleted
    if (user.deletedAt) {
      throw new BadRequestException('User account is already marked for deletion');
    }

    // Find associated person
    const person = await this.personRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!person) {
      throw new NotFoundException(`No person associated with user ${userId}`);
    }

    // Check if already pseudonymized
    if (person.isPseudonymized) {
      throw new BadRequestException('Person data is already pseudonymized');
    }

    // Mark deletion request
    person.deletionRequestedAt = new Date();
    await this.personRepository.save(person);

    this.logger.log(`Deletion request marked for person: ${person.id}`);
  }

  /**
   * Execute pseudonymization of a person's data
   * This preserves relationships but anonymizes personal identifiable information
   */
  async executePseudonymization(
    personId: string,
    performedByUserId: string,
    dto?: PseudonymizePersonDto,
  ): Promise<Person> {
    this.logger.log(`Starting pseudonymization for person: ${personId}`);

    // Find the person with all relations
    const person = await this.personRepository.findOne({
      where: { id: personId },
      relations: ['user', 'pseudonymizedBy'],
    });

    if (!person) {
      throw new NotFoundException(`Person with ID ${personId} not found`);
    }

    // Check if already pseudonymized
    if (person.isPseudonymized) {
      throw new BadRequestException('Person data is already pseudonymized');
    }

    // Find the user performing the action
    const performedBy = await this.userRepository.findOne({
      where: { id: performedByUserId },
    });

    if (!performedBy) {
      throw new NotFoundException(`User performing action not found`);
    }

    // Generate unique identifier for pseudonymized email
    const uniqueId = uuidv4();

    // Pseudonymize personal data
    person.firstName = 'Usuario';
    person.lastName = 'Eliminado';
    person.email = `deleted_${uniqueId}@removed.local`;
    person.phone = null;
    person.documentNumber = 'XXXXXXXX';
    person.guardianName = null;
    person.guardianDocument = null;
    person.guardianPhone = null;
    person.guardianAuthorizationUrl = null;
    person.birthDate = null;
    person.country = null;

    // Mark as pseudonymized
    person.isPseudonymized = true;
    person.pseudonymizedAt = new Date();
    person.pseudonymizedBy = performedBy;

    // Save pseudonymized person
    const pseudonymizedPerson = await this.personRepository.save(person);

    // If there's an associated user account, mark it as deleted
    if (person.user) {
      person.user.deletedAt = new Date();
      person.user.deletionReason = dto?.reason || 'GDPR deletion request';
      person.user.isActive = false;
      await this.userRepository.save(person.user);
    }

    this.logger.log(
      `Pseudonymization completed for person: ${personId}`,
    );

    return pseudonymizedPerson;
  }

  /**
   * Get deletion status for a person
   */
  async getDeletionStatus(personId: string): Promise<DeletionStatusDto> {
    const person = await this.personRepository.findOne({
      where: { id: personId },
      relations: ['user', 'pseudonymizedBy'],
    });

    if (!person) {
      throw new NotFoundException(`Person with ID ${personId} not found`);
    }

    const status: DeletionStatusDto = {
      personId: person.id,
      deletionRequested: !!person.deletionRequestedAt,
      deletionRequestedAt: person.deletionRequestedAt,
      isPseudonymized: person.isPseudonymized,
      pseudonymizedAt: person.pseudonymizedAt,
      pseudonymizedBy: person.pseudonymizedBy
        ? {
            id: person.pseudonymizedBy.id,
            email: person.pseudonymizedBy.email,
          }
        : null,
      userDeleted: !!person.user?.deletedAt,
      userDeletedAt: person.user?.deletedAt || null,
      deletionReason: person.user?.deletionReason || null,
    };

    return status;
  }

  /**
   * Get all persons with pending deletion requests
   */
  async getPendingDeletionRequests(): Promise<Person[]> {
    const persons = await this.personRepository.find({
      where: {
        deletionRequestedAt: Not(null as any),
        isPseudonymized: false,
      },
      relations: ['user'],
      order: {
        deletionRequestedAt: 'ASC',
      },
    });

    return persons;
  }
}

// Import Not operator for TypeORM query
import { Not } from 'typeorm';
