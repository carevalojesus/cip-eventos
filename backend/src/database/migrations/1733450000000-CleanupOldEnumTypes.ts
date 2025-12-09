import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanupOldEnumTypes1733450000000 implements MigrationInterface {
  name = 'CleanupOldEnumTypes1733450000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Buscar y eliminar tipos enum "_old" que quedaron huérfanos de sincronizaciones anteriores
    const oldEnums = await queryRunner.query(`
      SELECT typname FROM pg_type
      WHERE typname LIKE '%_enum_old%' OR typname LIKE '%_old'
    `);

    for (const { typname } of oldEnums) {
      try {
        // Primero intentar cambiar cualquier columna que use el tipo viejo
        const deps = await queryRunner.query(`
          SELECT
            c.relname as table_name,
            a.attname as column_name
          FROM pg_attribute a
          JOIN pg_type t ON a.atttypid = t.oid
          JOIN pg_class c ON a.attrelid = c.oid
          WHERE t.typname = $1
            AND c.relkind = 'r'
        `, [typname]);

        // Si hay dependencias, necesitamos migrar las columnas primero
        if (deps.length > 0) {
          // Determinar el nombre del enum nuevo (sin _old)
          const newTypeName = typname.replace('_old', '');

          // Verificar si existe el nuevo tipo
          const newTypeExists = await queryRunner.query(`
            SELECT 1 FROM pg_type WHERE typname = $1
          `, [newTypeName]);

          if (newTypeExists.length > 0) {
            // Cambiar cada columna al nuevo tipo
            for (const dep of deps) {
              await queryRunner.query(`
                ALTER TABLE "${dep.table_name}"
                ALTER COLUMN "${dep.column_name}" TYPE "${newTypeName}"
                USING "${dep.column_name}"::text::"${newTypeName}"
              `);
            }
          }
        }

        // Ahora eliminar el tipo viejo
        await queryRunner.query(`DROP TYPE IF EXISTS "${typname}" CASCADE`);
        console.log(`Cleaned up old enum type: ${typname}`);
      } catch (error) {
        console.warn(`Could not clean up ${typname}: ${error.message}`);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No se puede revertir la limpieza de tipos huérfanos
  }
}
