// ========================================
// MARKETBOT - DATABASE MIGRATION SYSTEM
// Execução automática de migrações na inicialização
// ========================================

import fs from 'fs/promises';
import path from 'path';
import { Pool } from 'pg';

interface Migration {
  id: string;
  filename: string;
  executed_at?: Date;
  sql: string;
}

export class MigrationManager {
  private database: Pool;
  private migrationsPath: string;

  constructor(database: Pool, migrationsPath: string = './migrations') {
    this.database = database;
    this.migrationsPath = path.resolve(migrationsPath);
  }

  /**
   * Inicializa o sistema de migração criando a tabela de controle
   */
  private async initializeMigrationTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id VARCHAR(255) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        checksum VARCHAR(64),
        execution_time_ms INTEGER
      );
      
      CREATE INDEX IF NOT EXISTS idx_schema_migrations_executed_at 
      ON schema_migrations(executed_at);
    `;

    await this.database.query(sql);
    console.log('✅ Migration table initialized');
  }

  /**
   * Lista todos os arquivos de migração disponíveis
   */
  private async getAvailableMigrations(): Promise<Migration[]> {
    try {
      const files = await fs.readdir(this.migrationsPath);
      const migrationFiles = files
        .filter(file => file.endsWith('.sql'))
        .sort(); // Ordenação alfabética/numérica

      const migrations: Migration[] = [];

      for (const filename of migrationFiles) {
        const filePath = path.join(this.migrationsPath, filename);
        const sql = await fs.readFile(filePath, 'utf-8');
        const id = filename.replace('.sql', '');

        migrations.push({
          id,
          filename,
          sql,
        });
      }

      return migrations;
    } catch (error) {
      console.error('❌ Error reading migration files:', error);
      throw error;
    }
  }

  /**
   * Lista migrações já executadas
   */
  private async getExecutedMigrations(): Promise<Set<string>> {
    const result = await this.database.query(
      'SELECT id FROM schema_migrations ORDER BY executed_at'
    );

    return new Set(result.rows.map(row => row.id));
  }

  /**
   * Executa uma migração específica
   */
  private async executeMigration(migration: Migration): Promise<void> {
    const startTime = Date.now();
    const client = await this.database.connect();

    try {
      await client.query('BEGIN');

      // Executa a migração
      await client.query(migration.sql);

      // Registra a execução
      const executionTime = Date.now() - startTime;
      await client.query(
        `INSERT INTO schema_migrations (id, filename, execution_time_ms) 
         VALUES ($1, $2, $3)`,
        [migration.id, migration.filename, executionTime]
      );

      await client.query('COMMIT');
      
      console.log(`✅ Migration ${migration.filename} executed successfully (${executionTime}ms)`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Migration ${migration.filename} failed:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Executa todas as migrações pendentes
   */
  public async runMigrations(): Promise<void> {
    try {
      console.log('🔄 Starting database migration process...');

      // Inicializa tabela de controle
      await this.initializeMigrationTable();

      // Busca migrações disponíveis e executadas
      const availableMigrations = await this.getAvailableMigrations();
      const executedMigrations = await this.getExecutedMigrations();

      // Filtra migrações pendentes
      const pendingMigrations = availableMigrations.filter(
        migration => !executedMigrations.has(migration.id)
      );

      if (pendingMigrations.length === 0) {
        console.log('✅ Database is up to date. No migrations to run.');
        return;
      }

      console.log(`📋 Found ${pendingMigrations.length} pending migrations:`);
      pendingMigrations.forEach(migration => {
        console.log(`   • ${migration.filename}`);
      });

      // Executa migrações uma por vez
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }

      console.log(`🎉 Successfully executed ${pendingMigrations.length} migrations!`);
    } catch (error) {
      console.error('❌ Migration process failed:', error);
      throw error;
    }
  }

  /**
   * Verifica o status das migrações
   */
  public async getMigrationStatus(): Promise<{
    total: number;
    executed: number;
    pending: string[];
  }> {
    await this.initializeMigrationTable();

    const availableMigrations = await this.getAvailableMigrations();
    const executedMigrations = await this.getExecutedMigrations();

    const pendingMigrations = availableMigrations
      .filter(migration => !executedMigrations.has(migration.id))
      .map(migration => migration.filename);

    return {
      total: availableMigrations.length,
      executed: executedMigrations.size,
      pending: pendingMigrations,
    };
  }

  /**
   * Força re-execução de uma migração específica (cuidado!)
   */
  public async rerunMigration(migrationId: string): Promise<void> {
    console.log(`⚠️  Force re-running migration: ${migrationId}`);

    const availableMigrations = await this.getAvailableMigrations();
    const migration = availableMigrations.find(m => m.id === migrationId);

    if (!migration) {
      throw new Error(`Migration ${migrationId} not found`);
    }

    // Remove da tabela de controle
    await this.database.query(
      'DELETE FROM schema_migrations WHERE id = $1',
      [migrationId]
    );

    // Re-executa
    await this.executeMigration(migration);
  }
}

// ========================================
// UTILITÁRIO PARA EXECUÇÃO AUTOMÁTICA
// ========================================

/**
 * Executa migrações automaticamente na inicialização da aplicação
 */
export const runDatabaseMigrations = async (database: Pool): Promise<void> => {
  const migrationManager = new MigrationManager(database, './migrations');
  
  try {
    await migrationManager.runMigrations();
  } catch (error) {
    console.error('❌ Failed to run database migrations:', error);
    throw error;
  }
};

/**
 * Verifica status das migrações (útil para health checks)
 */
export const checkMigrationStatus = async (database: Pool): Promise<boolean> => {
  const migrationManager = new MigrationManager(database, './migrations');
  
  try {
    const status = await migrationManager.getMigrationStatus();
    const isUpToDate = status.pending.length === 0;
    
    if (!isUpToDate) {
      console.warn(`⚠️  Database has ${status.pending.length} pending migrations:`, status.pending);
    }
    
    return isUpToDate;
  } catch (error) {
    console.error('❌ Failed to check migration status:', error);
    return false;
  }
};

export default MigrationManager;
