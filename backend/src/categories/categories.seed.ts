import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CategoriesSeedService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async onApplicationBootstrap() {
    await this.ensureExists('Conferencia', 'Eventos magistrales o plenarias');
    await this.ensureExists('Taller', 'Sesiones prácticas o formativas');
    await this.ensureExists('Webinar', 'Sesiones virtuales en línea');
  }

  private async ensureExists(name: string, description?: string) {
    const exists = await this.categoryRepository.findOne({ where: { name } });
    if (exists) return;

    await this.categoryRepository.save(
      this.categoryRepository.create({ name, description }),
    );
    this.logger.log(`Categoría inicial creada: ${name}`);
  }
}
