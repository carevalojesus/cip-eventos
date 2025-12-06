import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, UserRole } from './entities/role.entity';

@Injectable()
export class RolesSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RolesSeedService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async onApplicationBootstrap() {
    const bootstrapRoles: { name: UserRole; description: string }[] = [
      { name: UserRole.SUPER_ADMIN, description: 'Super administrador de la plataforma' },
      { name: UserRole.ORG_ADMIN, description: 'Administrador de organizador' },
      { name: UserRole.ORG_STAFF_ACCESO, description: 'Staff de acreditación/puerta' },
      { name: UserRole.ORG_STAFF_ACADEMICO, description: 'Staff académico (asistencias/notas)' },
      { name: UserRole.ORG_FINANZAS, description: 'Gestión financiera y comprobantes' },
      { name: UserRole.PONENTE, description: 'Ponente con acceso a sus sesiones' },
      { name: UserRole.PARTICIPANTE, description: 'Participante con panel personal' },
      { name: UserRole.ADMIN, description: 'Administrador del sistema (compatibilidad)' },
      { name: UserRole.USER, description: 'Usuario regular (compatibilidad)' },
    ];

    for (const role of bootstrapRoles) {
      await this.ensureRoleExists(role.name, role.description);
    }
  }

  private async ensureRoleExists(name: string, description?: string) {
    const exists = await this.roleRepository.findOne({ where: { name } });
    if (exists) return;

    await this.roleRepository.save(
      this.roleRepository.create({
        name,
        description,
      }),
    );

    this.logger.log(`Rol inicial creado: ${name}`);
  }
}
