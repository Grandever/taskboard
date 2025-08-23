import { Injectable } from '@angular/core';
import { safeGetItem, safeSetItem, safeRemoveItem } from '../utils/storage.utils';

export interface MigrationResult {
  success: boolean;
  migratedKeys: string[];
  errors: string[];
  version: string;
}

export interface MigrationStep {
  version: string;
  description: string;
  migrate: () => Promise<boolean>;
  rollback?: () => Promise<boolean>;
}

@Injectable({
  providedIn: 'root'
})
export class StorageMigrationService {
  private readonly CURRENT_VERSION = 'v1';
  private readonly VERSION_KEY = 'taskboard:version';
  
  private migrations: MigrationStep[] = [
    {
      version: 'v1.1',
      description: 'Add new fields to Task interface',
      migrate: async () => this.migrateToV1_1(),
      rollback: async () => this.rollbackFromV1_1()
    },
    {
      version: 'v1.2',
      description: 'Restructure AppSettings format',
      migrate: async () => this.migrateToV1_2(),
      rollback: async () => this.rollbackFromV1_2()
    }
  ];

  constructor() {
    this.initializeVersion();
  }

  private initializeVersion(): void {
    const currentVersion = safeGetItem(this.VERSION_KEY);
    if (!currentVersion) {
      safeSetItem(this.VERSION_KEY, this.CURRENT_VERSION);
    }
  }

  async checkForMigrations(): Promise<MigrationResult> {
    const currentVersion = safeGetItem(this.VERSION_KEY) || 'v0';
    const pendingMigrations = this.migrations.filter(m => 
      this.compareVersions(m.version, currentVersion) > 0
    );

    if (pendingMigrations.length === 0) {
      return {
        success: true,
        migratedKeys: [],
        errors: [],
        version: currentVersion
      };
    }

    return await this.performMigrations(pendingMigrations, currentVersion);
  }

  private async performMigrations(
    pendingMigrations: MigrationStep[], 
    fromVersion: string
  ): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migratedKeys: [],
      errors: [],
      version: fromVersion
    };

    console.log(`Starting migration from ${fromVersion} to latest version`);

    for (const migration of pendingMigrations) {
      try {
        console.log(`Migrating to ${migration.version}: ${migration.description}`);
        
        const success = await migration.migrate();
        if (success) {
          result.migratedKeys.push(migration.version);
          result.version = migration.version;
          console.log(`Successfully migrated to ${migration.version}`);
        } else {
          result.success = false;
          result.errors.push(`Failed to migrate to ${migration.version}`);
          console.error(`Migration to ${migration.version} failed`);
          break;
        }
      } catch (error) {
        result.success = false;
        result.errors.push(`Error during ${migration.version} migration: ${error}`);
        console.error(`Migration to ${migration.version} error:`, error);
        break;
      }
    }

    if (result.success) {
      safeSetItem(this.VERSION_KEY, result.version);
      console.log(`Migration completed successfully. Current version: ${result.version}`);
    } else {
      console.error('Migration failed:', result.errors);
    }

    return result;
  }

  private async migrateToV1_1(): Promise<boolean> {
    try {
      // Example migration: Add new fields to existing tasks
      const tasks = safeGetItem('taskboard:v1:tasks');
      if (tasks && Array.isArray(tasks)) {
        const migratedTasks = tasks.map(task => ({
          ...task,
          estimated_hours: task.estimated_hours || 0,
          actual_hours: task.actual_hours || 0,
          tags: task.tags || [],
          attachments: task.attachments || []
        }));

        const error = safeSetItem('taskboard:v1:tasks', migratedTasks);
        if (error) {
          console.error('Failed to save migrated tasks:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('V1.1 migration error:', error);
      return false;
    }
  }

  private async rollbackFromV1_1(): Promise<boolean> {
    try {
      // Remove newly added fields
      const tasks = safeGetItem('taskboard:v1:tasks');
      if (tasks && Array.isArray(tasks)) {
        const rolledBackTasks = tasks.map(task => {
          const { estimated_hours, actual_hours, tags, attachments, ...rolledBackTask } = task;
          return rolledBackTask;
        });

        const error = safeSetItem('taskboard:v1:tasks', rolledBackTasks);
        if (error) {
          console.error('Failed to save rolled back tasks:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('V1.1 rollback error:', error);
      return false;
    }
  }

  private async migrateToV1_2(): Promise<boolean> {
    try {
      // Example migration: Restructure settings format
      const oldSettings = safeGetItem('taskboard:v1:settings');
      if (oldSettings) {
        const newSettings = {
          ...oldSettings,
          ui: {
            theme: oldSettings.theme || 'light',
            language: oldSettings.language || 'uz',
            compactMode: oldSettings.compactMode || false
          },
          performance: {
            autoSaveDelay: oldSettings.autoSaveDelay || 100,
            maxRecycleItems: oldSettings.maxRecycleItems || 100
          }
        };

        const error = safeSetItem('taskboard:v1:settings', newSettings);
        if (error) {
          console.error('Failed to save migrated settings:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('V1.2 migration error:', error);
      return false;
    }
  }

  private async rollbackFromV1_2(): Promise<boolean> {
    try {
      // Restore old settings format
      const newSettings = safeGetItem('taskboard:v1:settings');
      if (newSettings) {
        const oldSettings = {
          pageSize: newSettings.pageSize,
          sort: newSettings.sort,
          lastUsedFilters: newSettings.lastUsedFilters,
          theme: newSettings.ui?.theme || 'light',
          language: newSettings.ui?.language || 'uz',
          compactMode: newSettings.ui?.compactMode || false
        };

        const error = safeSetItem('taskboard:v1:settings', oldSettings);
        if (error) {
          console.error('Failed to save rolled back settings:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('V1.2 rollback error:', error);
      return false;
    }
  }

  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    const maxLength = Math.max(v1Parts.length, v2Parts.length);
    
    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }
    
    return 0;
  }

  // Force migration to specific version
  async forceMigration(version: string): Promise<MigrationResult> {
    const targetMigration = this.migrations.find(m => m.version === version);
    if (!targetMigration) {
      return {
        success: false,
        migratedKeys: [],
        errors: [`Migration to version ${version} not found`],
        version: safeGetItem(this.VERSION_KEY) || 'v0'
      };
    }

    const success = await targetMigration.migrate();
    if (success) {
      safeSetItem(this.VERSION_KEY, version);
    }

    return {
      success,
      migratedKeys: success ? [version] : [],
      errors: success ? [] : [`Failed to migrate to ${version}`],
      version: success ? version : (safeGetItem(this.VERSION_KEY) || 'v0')
    };
  }

  // Get current version
  getCurrentVersion(): string {
    return safeGetItem(this.VERSION_KEY) || this.CURRENT_VERSION;
  }

  // Get available migrations
  getAvailableMigrations(): MigrationStep[] {
    return [...this.migrations];
  }

  // Backup current data before migration
  async createBackup(): Promise<boolean> {
    try {
      const backupData: any = {};
      const keys = ['taskboard:v1:tasks', 'taskboard:v1:settings', 'taskboard:v1:recycle_bin'];
      
      for (const key of keys) {
        const data = safeGetItem(key);
        if (data !== null) {
          backupData[key] = data;
        }
      }

      const backupKey = `taskboard:backup:${Date.now()}`;
      const error = safeSetItem(backupKey, backupData);
      
      if (error) {
        console.error('Failed to create backup:', error);
        return false;
      }

      console.log(`Backup created: ${backupKey}`);
      return true;
    } catch (error) {
      console.error('Backup creation error:', error);
      return false;
    }
  }
}
