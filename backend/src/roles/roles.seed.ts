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
    await this.ensureRoleExists(UserRole.ADMIN, 'Administrador del sistema');
    await this.ensureRoleExists(UserRole.USER, 'Usuario regular');
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
