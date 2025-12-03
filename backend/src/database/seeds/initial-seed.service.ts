import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

// Entities
import { Role, UserRole } from '../../roles/entities/role.entity';
import { User } from '../../users/entities/user.entity';
import { Profile } from '../../profiles/entities/profile.entity';
import { EventType } from '../../events/entities/event-type.entity';
import { EventCategory } from '../../events/entities/event-category.entity';
import { EventModality } from '../../events/entities/event-modality.entity';
import { Organizer } from '../../organizers/entities/organizer.entity';
import { Signer } from '../../signers/entities/signer.entity';
import { Event, EventStatus } from '../../events/entities/event.entity';
import { EventLocation } from '../../events/entities/event-location.entity';
import { EventTicket } from '../../events/entities/event-ticket.entity';

@Injectable()
export class InitialSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(InitialSeedService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(EventType)
    private readonly eventTypeRepository: Repository<EventType>,
    @InjectRepository(EventCategory)
    private readonly eventCategoryRepository: Repository<EventCategory>,
    @InjectRepository(EventModality)
    private readonly eventModalityRepository: Repository<EventModality>,
    @InjectRepository(Organizer)
    private readonly organizerRepository: Repository<Organizer>,
    @InjectRepository(Signer)
    private readonly signerRepository: Repository<Signer>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(EventLocation)
    private readonly eventLocationRepository: Repository<EventLocation>,
    @InjectRepository(EventTicket)
    private readonly eventTicketRepository: Repository<EventTicket>,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Iniciando seed de datos iniciales...');

    try {
      // 1. Roles (obligatorio primero)
      await this.seedRoles();

      // 2. Usuario administrador
      await this.seedAdminUser();

      // 3. Tipos de evento
      await this.seedEventTypes();

      // 4. Categorías de evento
      await this.seedEventCategories();

      // 5. Modalidades de evento
      await this.seedEventModalities();

      // 6. Organizadores por defecto
      await this.seedOrganizers();

      // 7. Firmantes por defecto
      await this.seedSigners();

      // 8. Eventos de prueba
      await this.seedTestEvents();

      this.logger.log('Seed de datos iniciales completado exitosamente');
    } catch (error) {
      this.logger.error('Error durante el seed inicial:', error);
    }
  }

  // ==================== ROLES ====================
  private async seedRoles() {
    const roles = [
      { name: UserRole.ADMIN, description: 'Administrador del sistema con acceso completo' },
      { name: UserRole.USER, description: 'Usuario regular con acceso limitado' },
      { name: UserRole.MODERATOR, description: 'Moderador con permisos intermedios' },
      { name: UserRole.ORGANIZER, description: 'Organizador de eventos' },
    ];

    for (const roleData of roles) {
      const exists = await this.roleRepository.findOne({ where: { name: roleData.name } });
      if (!exists) {
        await this.roleRepository.save(this.roleRepository.create(roleData));
        this.logger.log(`Rol creado: ${roleData.name}`);
      }
    }
  }

  // ==================== ADMIN USER ====================
  private async seedAdminUser() {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL') || 'admin@cip-loreto.org.pe';
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD') || 'Admin123!';

    const existingUser = await this.userRepository.findOne({ where: { email: adminEmail } });
    if (existingUser) {
      this.logger.log(`Usuario admin ya existe: ${adminEmail}`);
      return;
    }

    const adminRole = await this.roleRepository.findOne({ where: { name: UserRole.ADMIN } });
    if (!adminRole) {
      this.logger.error('No se encontró el rol ADMIN. Asegúrate de ejecutar seedRoles primero.');
      return;
    }

    // Crear usuario admin
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminUser = this.userRepository.create({
      email: adminEmail,
      password: hashedPassword,
      isActive: true,
      isVerified: true,
      role: adminRole,
    });
    await this.userRepository.save(adminUser);

    // Crear perfil del admin
    const adminProfile = this.profileRepository.create({
      firstName: 'Administrador',
      lastName: 'CIP Loreto',
      user: adminUser,
    });
    await this.profileRepository.save(adminProfile);

    this.logger.log(`Usuario admin creado: ${adminEmail}`);
  }

  // ==================== EVENT TYPES ====================
  private async seedEventTypes() {
    const types = [
      { name: 'Conferencia', description: 'Presentación formal sobre un tema específico' },
      { name: 'Seminario', description: 'Sesión educativa con participación activa' },
      { name: 'Taller', description: 'Sesión práctica con ejercicios hands-on' },
      { name: 'Congreso', description: 'Evento grande con múltiples sesiones y ponentes' },
      { name: 'Curso', description: 'Programa educativo estructurado de varias sesiones' },
      { name: 'Diplomado', description: 'Programa de especialización con certificación' },
      { name: 'Webinar', description: 'Seminario en línea en tiempo real' },
      { name: 'Foro', description: 'Espacio de debate y discusión abierta' },
      { name: 'Simposio', description: 'Reunión de expertos sobre un tema específico' },
      { name: 'Charla', description: 'Presentación informal y corta' },
      { name: 'Mesa Redonda', description: 'Discusión entre panelistas sobre un tema' },
      { name: 'Capacitación', description: 'Entrenamiento práctico para desarrollo de habilidades' },
    ];

    for (const typeData of types) {
      const exists = await this.eventTypeRepository.findOne({ where: { name: typeData.name } });
      if (!exists) {
        await this.eventTypeRepository.save(this.eventTypeRepository.create(typeData));
        this.logger.log(`Tipo de evento creado: ${typeData.name}`);
      }
    }
  }

  // ==================== EVENT CATEGORIES ====================
  private async seedEventCategories() {
    const categories = [
      { name: 'Ingeniería Civil', description: 'Eventos relacionados con ingeniería civil' },
      { name: 'Ingeniería de Sistemas', description: 'Eventos de tecnología y sistemas' },
      { name: 'Ingeniería Ambiental', description: 'Eventos sobre medio ambiente y sostenibilidad' },
      { name: 'Ingeniería Mecánica', description: 'Eventos de ingeniería mecánica' },
      { name: 'Ingeniería Eléctrica', description: 'Eventos de ingeniería eléctrica' },
      { name: 'Ingeniería Industrial', description: 'Eventos de ingeniería industrial y procesos' },
      { name: 'Ingeniería Química', description: 'Eventos de ingeniería química' },
      { name: 'Arquitectura', description: 'Eventos relacionados con arquitectura' },
      { name: 'Gestión y Liderazgo', description: 'Eventos de gestión empresarial y liderazgo' },
      { name: 'Innovación y Tecnología', description: 'Eventos sobre nuevas tecnologías' },
      { name: 'Desarrollo Profesional', description: 'Eventos para crecimiento profesional' },
      { name: 'Normativa y Legislación', description: 'Eventos sobre normas y leyes' },
      { name: 'Seguridad y Salud', description: 'Eventos de seguridad ocupacional' },
      { name: 'Multidisciplinario', description: 'Eventos que abarcan múltiples disciplinas' },
    ];

    for (const categoryData of categories) {
      const exists = await this.eventCategoryRepository.findOne({ where: { name: categoryData.name } });
      if (!exists) {
        await this.eventCategoryRepository.save(this.eventCategoryRepository.create(categoryData));
        this.logger.log(`Categoría creada: ${categoryData.name}`);
      }
    }
  }

  // ==================== EVENT MODALITIES ====================
  private async seedEventModalities() {
    const modalities = [
      { name: 'Presencial', description: 'Evento físico en una ubicación específica' },
      { name: 'Virtual', description: 'Evento 100% en línea mediante plataforma digital' },
      { name: 'Híbrido', description: 'Evento con opción presencial y virtual simultánea' },
    ];

    for (const modalityData of modalities) {
      const exists = await this.eventModalityRepository.findOne({ where: { name: modalityData.name } });
      if (!exists) {
        await this.eventModalityRepository.save(this.eventModalityRepository.create(modalityData));
        this.logger.log(`Modalidad creada: ${modalityData.name}`);
      }
    }
  }

  // ==================== ORGANIZERS ====================
  private async seedOrganizers() {
    const organizers = [
      {
        name: 'CIP - Consejo Departamental de Loreto',
        email: 'eventos@cip-loreto.org.pe',
        website: 'https://cip-loreto.org.pe',
      },
      {
        name: 'Capítulo de Ingeniería Civil',
        email: 'civil@cip-loreto.org.pe',
      },
      {
        name: 'Capítulo de Ingeniería de Sistemas',
        email: 'sistemas@cip-loreto.org.pe',
      },
      {
        name: 'Capítulo de Ingeniería Ambiental',
        email: 'ambiental@cip-loreto.org.pe',
      },
      {
        name: 'Capítulo de Ingeniería Mecánica',
        email: 'mecanica@cip-loreto.org.pe',
      },
      {
        name: 'Capítulo de Ingeniería Eléctrica',
        email: 'electrica@cip-loreto.org.pe',
      },
    ];

    for (const organizerData of organizers) {
      const exists = await this.organizerRepository.findOne({ where: { name: organizerData.name } });
      if (!exists) {
        await this.organizerRepository.save(this.organizerRepository.create(organizerData));
        this.logger.log(`Organizador creado: ${organizerData.name}`);
      }
    }
  }

  // ==================== SIGNERS ====================
  private async seedSigners() {
    const signers = [
      {
        fullName: 'Ing. Juan Pérez García',
        title: 'Decano Departamental',
        signatureUrl: '/signatures/decano.png',
      },
      {
        fullName: 'Ing. María López Ruiz',
        title: 'Director de Eventos',
        signatureUrl: '/signatures/director-eventos.png',
      },
      {
        fullName: 'Ing. Carlos Mendoza Vega',
        title: 'Secretario General',
        signatureUrl: '/signatures/secretario.png',
      },
    ];

    for (const signerData of signers) {
      const exists = await this.signerRepository.findOne({ where: { fullName: signerData.fullName } });
      if (!exists) {
        await this.signerRepository.save(this.signerRepository.create(signerData));
        this.logger.log(`Firmante creado: ${signerData.fullName}`);
      }
    }
  }

  // ==================== TEST EVENTS ====================
  private async seedTestEvents() {
    // Verificar si ya existen eventos
    const existingEvents = await this.eventRepository.count();
    if (existingEvents > 0) {
      this.logger.log(`Ya existen ${existingEvents} eventos. Saltando seed de eventos.`);
      return;
    }

    // Obtener datos necesarios
    const adminUser = await this.userRepository.findOne({
      where: { email: this.configService.get<string>('ADMIN_EMAIL') || 'admin@cip-loreto.org.pe' },
    });
    if (!adminUser) {
      this.logger.error('No se encontró el usuario admin para crear eventos de prueba');
      return;
    }

    const types = await this.eventTypeRepository.find();
    const categories = await this.eventCategoryRepository.find();
    const modalities = await this.eventModalityRepository.find();
    const organizers = await this.organizerRepository.find();

    if (!types.length || !modalities.length) {
      this.logger.error('Faltan tipos o modalidades para crear eventos de prueba');
      return;
    }

    // Helper para fechas
    const addDays = (date: Date, days: number) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    };

    const setTime = (date: Date, hours: number, minutes = 0) => {
      const result = new Date(date);
      result.setHours(hours, minutes, 0, 0);
      return result;
    };

    const now = new Date();

    // Crear ubicaciones
    const locations = await Promise.all([
      this.eventLocationRepository.save(
        this.eventLocationRepository.create({
          name: 'Auditorio Principal CIP Loreto',
          address: 'Av. Abelardo Quiñones Km 2.5',
          city: 'Iquitos',
          reference: 'Frente al aeropuerto',
          mapLink: 'https://maps.google.com/?q=-3.7847,-73.3087',
        }),
      ),
      this.eventLocationRepository.save(
        this.eventLocationRepository.create({
          name: 'Sala de Conferencias B',
          address: 'Jr. Putumayo 123',
          city: 'Iquitos',
          reference: 'A una cuadra de la Plaza de Armas',
        }),
      ),
      this.eventLocationRepository.save(
        this.eventLocationRepository.create({
          name: 'Centro de Convenciones',
          address: 'Av. La Marina 456',
          city: 'Iquitos',
        }),
      ),
    ]);

    // Definir eventos de prueba
    const testEvents = [
      {
        title: 'Congreso Internacional de Ingeniería Civil 2025',
        slug: 'congreso-ingenieria-civil-2025',
        summary: 'El evento más importante del año para ingenieros civiles de la región amazónica.',
        description:
          'Congreso que reúne a expertos nacionales e internacionales para discutir las últimas tendencias en construcción sostenible, gestión de proyectos y normativa técnica. Incluye talleres prácticos, networking y certificación.',
        startAt: setTime(addDays(now, 15), 9),
        endAt: setTime(addDays(now, 17), 18),
        status: EventStatus.PUBLISHED,
        type: types.find((t) => t.name === 'Congreso'),
        category: categories.find((c) => c.name === 'Ingeniería Civil'),
        modality: modalities.find((m) => m.name === 'Presencial'),
        location: locations[0],
        hasCertificate: true,
        certificateHours: 24,
        tickets: [
          { name: 'Colegiado Habilitado', price: 150, stock: 100, requiresCipValidation: true },
          { name: 'No Colegiado', price: 250, stock: 50, requiresCipValidation: false },
          { name: 'Estudiante', price: 80, stock: 30, requiresCipValidation: false },
        ],
      },
      {
        title: 'Webinar: Inteligencia Artificial en la Ingeniería',
        slug: 'webinar-ia-ingenieria-2025',
        summary: 'Descubre cómo la IA está transformando la práctica de la ingeniería.',
        description:
          'Webinar gratuito sobre aplicaciones prácticas de inteligencia artificial en proyectos de ingeniería. Casos de uso reales, herramientas disponibles y tendencias futuras.',
        startAt: setTime(addDays(now, 7), 19),
        endAt: setTime(addDays(now, 7), 21),
        status: EventStatus.PUBLISHED,
        type: types.find((t) => t.name === 'Webinar'),
        category: categories.find((c) => c.name === 'Innovación y Tecnología'),
        modality: modalities.find((m) => m.name === 'Virtual'),
        hasCertificate: true,
        certificateHours: 2,
        tickets: [{ name: 'Entrada General', price: 0, stock: 500, requiresCipValidation: false }],
      },
      {
        title: 'Taller de AutoCAD Avanzado',
        slug: 'taller-autocad-avanzado-2025',
        summary: 'Domina las herramientas avanzadas de AutoCAD para proyectos profesionales.',
        description:
          'Taller práctico de 3 días donde aprenderás técnicas avanzadas de modelado, renderizado y documentación en AutoCAD. Requisito: conocimientos básicos de AutoCAD.',
        startAt: setTime(addDays(now, 20), 14),
        endAt: setTime(addDays(now, 22), 18),
        status: EventStatus.PUBLISHED,
        type: types.find((t) => t.name === 'Taller'),
        category: categories.find((c) => c.name === 'Desarrollo Profesional'),
        modality: modalities.find((m) => m.name === 'Híbrido'),
        location: locations[1],
        hasCertificate: true,
        certificateHours: 12,
        tickets: [
          { name: 'Presencial', price: 180, stock: 25, requiresCipValidation: false },
          { name: 'Virtual', price: 120, stock: 50, requiresCipValidation: false },
        ],
      },
      {
        title: 'Seminario de Gestión Ambiental en Proyectos',
        slug: 'seminario-gestion-ambiental-2025',
        summary: 'Aprende sobre evaluación de impacto ambiental y normativa vigente.',
        description:
          'Seminario especializado en gestión ambiental para proyectos de ingeniería. Incluye revisión de la normativa peruana, estudios de caso y mejores prácticas.',
        startAt: setTime(addDays(now, 30), 9),
        endAt: setTime(addDays(now, 30), 17),
        status: EventStatus.DRAFT,
        type: types.find((t) => t.name === 'Seminario'),
        category: categories.find((c) => c.name === 'Ingeniería Ambiental'),
        modality: modalities.find((m) => m.name === 'Presencial'),
        location: locations[2],
        hasCertificate: true,
        certificateHours: 8,
        tickets: [
          { name: 'General', price: 100, stock: 60, requiresCipValidation: false },
        ],
      },
      {
        title: 'Conferencia: Puentes y Estructuras Especiales',
        slug: 'conferencia-puentes-estructuras-2025',
        summary: 'Expertos comparten experiencias en diseño de puentes en la Amazonía.',
        description:
          'Conferencia magistral con ingenieros especialistas en diseño y construcción de puentes en zonas tropicales. Se presentarán proyectos emblemáticos de la región.',
        startAt: setTime(addDays(now, -5), 18),
        endAt: setTime(addDays(now, -5), 21),
        status: EventStatus.COMPLETED,
        type: types.find((t) => t.name === 'Conferencia'),
        category: categories.find((c) => c.name === 'Ingeniería Civil'),
        modality: modalities.find((m) => m.name === 'Presencial'),
        location: locations[0],
        hasCertificate: true,
        certificateHours: 3,
        tickets: [
          { name: 'General', price: 50, stock: 80, requiresCipValidation: false },
        ],
      },
      {
        title: 'Curso de BIM para Ingenieros',
        slug: 'curso-bim-ingenieros-2025',
        summary: 'Introducción a la metodología BIM y software Revit.',
        description:
          'Curso intensivo de 5 días sobre Building Information Modeling. Aprenderás los fundamentos de BIM, uso de Revit y coordinación de proyectos multidisciplinarios.',
        startAt: setTime(addDays(now, 45), 9),
        endAt: setTime(addDays(now, 49), 13),
        status: EventStatus.PUBLISHED,
        type: types.find((t) => t.name === 'Curso'),
        category: categories.find((c) => c.name === 'Innovación y Tecnología'),
        modality: modalities.find((m) => m.name === 'Presencial'),
        location: locations[1],
        hasCertificate: true,
        certificateHours: 20,
        tickets: [
          { name: 'Colegiado', price: 350, stock: 20, requiresCipValidation: true },
          { name: 'No Colegiado', price: 450, stock: 10, requiresCipValidation: false },
        ],
      },
      {
        title: 'Mesa Redonda: Ética Profesional del Ingeniero',
        slug: 'mesa-redonda-etica-profesional-2025',
        summary: 'Debate sobre los desafíos éticos en la práctica de la ingeniería.',
        description:
          'Mesa redonda con destacados profesionales que discutirán casos reales y dilemas éticos en el ejercicio de la ingeniería. Evento gratuito para colegiados.',
        startAt: setTime(addDays(now, 10), 18),
        endAt: setTime(addDays(now, 10), 20),
        status: EventStatus.PUBLISHED,
        type: types.find((t) => t.name === 'Mesa Redonda'),
        category: categories.find((c) => c.name === 'Desarrollo Profesional'),
        modality: modalities.find((m) => m.name === 'Virtual'),
        hasCertificate: false,
        certificateHours: 0,
        tickets: [
          { name: 'Colegiado (Gratis)', price: 0, stock: 200, requiresCipValidation: true },
        ],
      },
      {
        title: 'Capacitación en Seguridad y Salud Ocupacional',
        slug: 'capacitacion-sso-2025',
        summary: 'Actualización en normativa de seguridad para obras de construcción.',
        description:
          'Capacitación obligatoria sobre la Ley 29783 y su reglamento. Dirigido a residentes de obra, supervisores y personal de seguridad. Incluye evaluación y certificado.',
        startAt: setTime(addDays(now, 25), 8),
        endAt: setTime(addDays(now, 26), 17),
        status: EventStatus.PUBLISHED,
        type: types.find((t) => t.name === 'Capacitación'),
        category: categories.find((c) => c.name === 'Seguridad y Salud'),
        modality: modalities.find((m) => m.name === 'Presencial'),
        location: locations[2],
        hasCertificate: true,
        certificateHours: 16,
        tickets: [
          { name: 'General', price: 200, stock: 40, requiresCipValidation: false },
          { name: 'Corporativo (min. 5)', price: 150, stock: 20, requiresCipValidation: false },
        ],
      },
    ];

    // Crear eventos
    for (const eventData of testEvents) {
      const { tickets, ...eventProps } = eventData;

      const event = this.eventRepository.create({
        ...eventProps,
        createdBy: adminUser,
        organizers: organizers.slice(0, 2), // Asignar primeros 2 organizadores
      });

      const savedEvent = await this.eventRepository.save(event);

      // Crear tickets para el evento
      for (const ticketData of tickets) {
        const ticket = this.eventTicketRepository.create({
          ...ticketData,
          event: savedEvent,
          salesStartAt: new Date(),
          salesEndAt: eventData.startAt,
        });
        await this.eventTicketRepository.save(ticket);
      }

      this.logger.log(`Evento creado: ${savedEvent.title}`);
    }

    this.logger.log(`Se crearon ${testEvents.length} eventos de prueba`);
  }
}
