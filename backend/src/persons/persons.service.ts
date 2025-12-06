import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Person, PersonStatus, DocumentType } from './entities/person.entity';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { ReniecService } from '../reniec/reniec.service';

@Injectable()
export class PersonsService {
  private readonly logger = new Logger(PersonsService.name);

  constructor(
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    private readonly reniecService: ReniecService,
  ) {}

  /**
   * Busca una persona por email
   */
  async findByEmail(email: string): Promise<Person | null> {
    return this.personRepository.findOne({
      where: { email, status: PersonStatus.ACTIVE },
      relations: ['user'],
    });
  }

  /**
   * Busca una persona por tipo y número de documento
   */
  async findByDocument(
    documentType: DocumentType,
    documentNumber: string,
  ): Promise<Person | null> {
    return this.personRepository.findOne({
      where: {
        documentType,
        documentNumber,
        status: PersonStatus.ACTIVE,
      },
      relations: ['user'],
    });
  }

  /**
   * Busca una persona existente o crea una nueva
   * Primero busca por documento, luego por email
   */
  async findOrCreate(data: CreatePersonDto): Promise<Person> {
    // Intentar buscar por documento
    let person = await this.findByDocument(data.documentType, data.documentNumber);

    if (person) {
      return person;
    }

    // Intentar buscar por email
    person = await this.findByEmail(data.email);

    if (person) {
      // Si encontramos una persona con el mismo email pero diferente documento,
      // podría ser un caso de actualización de datos o un error
      // Por ahora, marcamos el flag de datos observados
      if (
        person.documentType !== data.documentType ||
        person.documentNumber !== data.documentNumber
      ) {
        person.flagDataObserved = true;
        await this.personRepository.save(person);
      }
      return person;
    }

    // Si no existe, crear nueva persona
    return this.create(data);
  }

  /**
   * Crea una nueva persona
   */
  async create(createPersonDto: CreatePersonDto): Promise<Person> {
    // Verificar que no exista una persona con el mismo documento
    const existingByDocument = await this.findByDocument(
      createPersonDto.documentType,
      createPersonDto.documentNumber,
    );

    if (existingByDocument) {
      throw new ConflictException(
        'Ya existe una persona con este tipo y número de documento',
      );
    }

    // Verificar que no exista una persona con el mismo email
    const existingByEmail = await this.findByEmail(createPersonDto.email);

    if (existingByEmail) {
      throw new ConflictException('Ya existe una persona con este email');
    }

    const person = this.personRepository.create({
      ...createPersonDto,
      status: PersonStatus.ACTIVE,
    });

    return this.personRepository.save(person);
  }

  /**
   * Crea una nueva persona con validación RENIEC (si aplica)
   * Este método se debe usar en lugar de create() cuando se requiera validación RENIEC
   */
  async createWithReniecValidation(
    createPersonDto: CreatePersonDto,
  ): Promise<Person> {
    // Crear la persona primero
    const person = await this.create(createPersonDto);

    // Validar con RENIEC solo si es DNI peruano
    if (
      createPersonDto.documentType === DocumentType.DNI &&
      createPersonDto.documentNumber.length === 8
    ) {
      await this.validateWithReniec(person);
    }

    return person;
  }

  /**
   * Valida una persona contra RENIEC y actualiza sus flags
   */
  async validateWithReniec(person: Person): Promise<void> {
    try {
      const validation = await this.reniecService.validatePerson(
        person.documentNumber,
        person.firstName,
        person.lastName,
      );

      // Actualizar campos de validación RENIEC
      person.reniecValidationScore = validation.matchScore;
      person.reniecValidatedAt = new Date();

      // Si la validación falló o el score es bajo, marcar como datos observados
      if (!validation.isValid || validation.matchScore < 80) {
        person.flagDataObserved = true;

        this.logger.warn(
          `Datos de persona ${person.id} no coinciden con RENIEC. ` +
            `Score: ${validation.matchScore}%. ` +
            `DNI: ${person.documentNumber}`,
        );

        // Log detallado para auditoría (sin datos sensibles completos)
        this.logger.debug(
          `Detalles de validación RENIEC: ` +
            `firstNameMatch=${validation.comparisonDetails?.firstNameMatch}%, ` +
            `lastNameMatch=${validation.comparisonDetails?.lastNameMatch}%`,
        );
      } else {
        this.logger.log(
          `Persona ${person.id} validada exitosamente con RENIEC. Score: ${validation.matchScore}%`,
        );
      }

      // Guardar los cambios
      await this.personRepository.save(person);
    } catch (error) {
      // Si hay error en la validación RENIEC, no bloquear la creación
      // Solo marcar como datos observados por seguridad
      this.logger.error(
        `Error validando persona ${person.id} con RENIEC: ${error.message}`,
        error.stack,
      );

      person.flagDataObserved = true;
      person.reniecValidationScore = 0;
      person.reniecValidatedAt = new Date();
      await this.personRepository.save(person);
    }
  }

  /**
   * Busca una persona por ID
   */
  async findOne(id: string): Promise<Person> {
    const person = await this.personRepository.findOne({
      where: { id, status: PersonStatus.ACTIVE },
      relations: ['user', 'mergedToPerson'],
    });

    if (!person) {
      throw new NotFoundException(`Persona con ID ${id} no encontrada`);
    }

    return person;
  }

  /**
   * Obtiene todas las personas activas
   */
  async findAll(): Promise<Person[]> {
    return this.personRepository.find({
      where: { status: PersonStatus.ACTIVE },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Actualiza los datos de una persona
   */
  async update(id: string, updatePersonDto: UpdatePersonDto): Promise<Person> {
    const person = await this.findOne(id);

    // Si se está actualizando el documento, verificar que no exista otro con el mismo
    if (
      updatePersonDto.documentType &&
      updatePersonDto.documentNumber &&
      (person.documentType !== updatePersonDto.documentType ||
        person.documentNumber !== updatePersonDto.documentNumber)
    ) {
      const existing = await this.findByDocument(
        updatePersonDto.documentType,
        updatePersonDto.documentNumber,
      );

      if (existing && existing.id !== id) {
        throw new ConflictException(
          'Ya existe otra persona con este tipo y número de documento',
        );
      }
    }

    // Si se está actualizando el email, verificar que no exista otro con el mismo
    if (updatePersonDto.email && person.email !== updatePersonDto.email) {
      const existing = await this.findByEmail(updatePersonDto.email);

      if (existing && existing.id !== id) {
        throw new ConflictException('Ya existe otra persona con este email');
      }
    }

    this.personRepository.merge(person, updatePersonDto);
    return this.personRepository.save(person);
  }

  /**
   * Vincula una persona con una cuenta de usuario
   */
  async linkToUser(personId: string, userId: string): Promise<Person> {
    const person = await this.findOne(personId);

    if (person.user) {
      throw new ConflictException(
        'Esta persona ya está vinculada a una cuenta de usuario',
      );
    }

    person.user = { id: userId } as any;
    return this.personRepository.save(person);
  }

  /**
   * Desvincula una persona de su cuenta de usuario
   */
  async unlinkFromUser(personId: string): Promise<Person> {
    const person = await this.findOne(personId);

    if (!person.user) {
      throw new BadRequestException(
        'Esta persona no está vinculada a ninguna cuenta de usuario',
      );
    }

    person.user = null;
    return this.personRepository.save(person);
  }

  /**
   * Fusiona dos personas (marca una como fusionada y apunta a la otra)
   */
  async merge(
    sourcePersonId: string,
    targetPersonId: string,
    mergedByUserId: string,
  ): Promise<Person> {
    if (sourcePersonId === targetPersonId) {
      throw new BadRequestException('No se puede fusionar una persona consigo misma');
    }

    const sourcePerson = await this.findOne(sourcePersonId);
    const targetPerson = await this.findOne(targetPersonId);

    if (sourcePerson.status === PersonStatus.MERGED) {
      throw new BadRequestException('La persona origen ya está fusionada');
    }

    if (targetPerson.status === PersonStatus.MERGED) {
      throw new BadRequestException('La persona destino ya está fusionada');
    }

    sourcePerson.status = PersonStatus.MERGED;
    sourcePerson.mergedToPerson = targetPerson;
    sourcePerson.mergedAt = new Date();
    sourcePerson.mergedBy = { id: mergedByUserId } as any;

    return this.personRepository.save(sourcePerson);
  }

  /**
   * Elimina una persona (soft delete cambiando su estado)
   */
  async remove(id: string): Promise<Person> {
    const person = await this.findOne(id);
    person.status = PersonStatus.MERGED; // Usamos MERGED como soft delete
    return this.personRepository.save(person);
  }
}
