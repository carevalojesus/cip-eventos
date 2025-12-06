import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameDocumentTypeEnum1733450200000 implements MigrationInterface {
  name = 'RenameDocumentTypeEnum1733450200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si ya existe el enum con el nuevo nombre
    const newEnumExists = await queryRunner.query(`
      SELECT 1 FROM pg_type WHERE typname = 'document_type_enum'
    `);

    if (newEnumExists.length > 0) {
      console.log('Enum document_type_enum already exists, skipping rename');
      return;
    }

    // Verificar si existe el enum viejo
    const oldEnumExists = await queryRunner.query(`
      SELECT 1 FROM pg_type WHERE typname = 'attendees_documenttype_enum'
    `);

    if (oldEnumExists.length > 0) {
      // Renombrar el enum
      await queryRunner.query(`
        ALTER TYPE "attendees_documenttype_enum" RENAME TO "document_type_enum"
      `);
      console.log('Renamed attendees_documenttype_enum to document_type_enum');
    } else {
      // Crear el enum si no existe ninguno
      await queryRunner.query(`
        CREATE TYPE "document_type_enum" AS ENUM('DNI', 'CE', 'PASSPORT', 'OTHER')
      `);
      console.log('Created document_type_enum');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir el rename
    const newEnumExists = await queryRunner.query(`
      SELECT 1 FROM pg_type WHERE typname = 'document_type_enum'
    `);

    if (newEnumExists.length > 0) {
      await queryRunner.query(`
        ALTER TYPE "document_type_enum" RENAME TO "attendees_documenttype_enum"
      `);
    }
  }
}
