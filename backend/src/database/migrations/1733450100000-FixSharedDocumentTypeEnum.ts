import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixSharedDocumentTypeEnum1733450100000
  implements MigrationInterface
{
  name = 'FixSharedDocumentTypeEnum1733450100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Verificar si existe el tipo _old y eliminarlo si es posible
    const oldTypeExists = await queryRunner.query(`
      SELECT 1 FROM pg_type WHERE typname = 'attendees_documenttype_enum_old'
    `);

    if (oldTypeExists.length > 0) {
      // Verificar qué columnas usan el tipo viejo
      const depsOld = await queryRunner.query(`
        SELECT
          c.relname as table_name,
          a.attname as column_name
        FROM pg_attribute a
        JOIN pg_type t ON a.atttypid = t.oid
        JOIN pg_class c ON a.attrelid = c.oid
        WHERE t.typname = 'attendees_documenttype_enum_old'
          AND c.relkind = 'r'
      `);

      console.log('Columns using _old enum:', depsOld);

      // Si hay dependencias, migrarlas al tipo nuevo
      if (depsOld.length > 0) {
        for (const dep of depsOld) {
          // Cambiar la columna para usar el enum actual
          await queryRunner.query(`
            ALTER TABLE "${dep.table_name}"
            ALTER COLUMN "${dep.column_name}" TYPE "attendees_documenttype_enum"
            USING "${dep.column_name}"::text::"attendees_documenttype_enum"
          `);
        }
      }

      // Ahora eliminar el tipo viejo
      await queryRunner.query(`
        DROP TYPE IF EXISTS "attendees_documenttype_enum_old" CASCADE
      `);
    }

    // 2. Verificar si persons usa un tipo diferente de enum
    const personsEnumType = await queryRunner.query(`
      SELECT
        t.typname
      FROM pg_attribute a
      JOIN pg_type t ON a.atttypid = t.oid
      JOIN pg_class c ON a.attrelid = c.oid
      WHERE c.relname = 'persons'
        AND a.attname = 'documentType'
    `);

    console.log('Persons documentType enum type:', personsEnumType);

    // Si persons usa un tipo diferente, unificarlo
    if (
      personsEnumType.length > 0 &&
      personsEnumType[0].typname !== 'attendees_documenttype_enum'
    ) {
      // Cambiar persons para usar el mismo enum que attendees
      await queryRunner.query(`
        ALTER TABLE "persons"
        ALTER COLUMN "documentType" TYPE "attendees_documenttype_enum"
        USING "documentType"::text::"attendees_documenttype_enum"
      `);

      // Eliminar el enum viejo de persons si existe
      if (personsEnumType[0].typname.includes('persons')) {
        await queryRunner.query(`
          DROP TYPE IF EXISTS "${personsEnumType[0].typname}" CASCADE
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No se revierte esta migración de limpieza
  }
}
