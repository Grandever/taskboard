import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppSettings } from '../models/task.interfaces';
import { safeGetItem, safeSetItem } from '../utils/storage.utils';

const SETTINGS_KEY = 'taskboard:v1:settings';

@Injectable({
  providedIn: 'root'
})
export class AppSettingsService {
  private readonly defaultSettings: AppSettings = {
    pageSize: 20,
    sort: {
      by: 'updated_at',
      dir: 'desc'
    },
    lastUsedFilters: {},
    // UI Settings
    theme: 'light',
    language: 'uz',
    compactMode: false,
    showCompletedTasks: true,
    showOverdueTasks: true,
    defaultView: 'board',
    
    // Notifications
    notifications: {
      enabled: true,
      sound: true,
      desktop: false,
      email: false,
      taskDueReminder: 24, // 24 hours before due date
      dailyDigest: false,
      weeklyReport: false
    },
    
    // Performance & Storage
    performance: {
      autoSaveDelay: 100,
      maxRecycleItems: 100,
      cacheExpiryHours: 24,
      batchOperations: true,
      lazyLoading: true
    },
    
    // Data Management
    dataManagement: {
      autoBackup: true,
      backupFrequency: 'weekly',
      maxBackups: 10,
      exportFormat: 'json',
      importValidation: true
    },
    
    // Security & Privacy
    security: {
      encryptSensitiveData: false,
      sessionTimeout: 480, // 8 hours
      requireConfirmation: true,
      auditLog: false
    },
    
    // Integration Settings
    integrations: {
      calendarSync: false,
      emailIntegration: false,
      slackNotifications: false,
      githubIntegration: false
    }
  };

  private settingsSubject = new BehaviorSubject<AppSettings>(this.defaultSettings);
  public settings$ = this.settingsSubject.asObservable();

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    try {
      const stored = safeGetItem(SETTINGS_KEY);
      if (stored) {
        // Merge with defaults to handle missing properties
        const merged = this.mergeWithDefaults(stored);
        this.settingsSubject.next(merged);
      } else {
        // Save default settings
        this.saveSettings(this.defaultSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settingsSubject.next(this.defaultSettings);
    }
  }

  private mergeWithDefaults(stored: any): AppSettings {
    return {
      ...this.defaultSettings,
      ...stored,
      sort: {
        ...this.defaultSettings.sort,
        ...stored.sort
      },
      notifications: {
        ...this.defaultSettings.notifications,
        ...stored.notifications
      }
    };
  }

  private saveSettings(settings: AppSettings): void {
    const error = safeSetItem(SETTINGS_KEY, settings);
    if (error) {
      console.error('Failed to save settings:', error);
    }
  }

  updateSettings(updates: Partial<AppSettings>): void {
    const current = this.settingsSubject.value;
    const updated = { ...current, ...updates };
    
    this.settingsSubject.next(updated);
    this.saveSettings(updated);
  }

  updatePageSize(pageSize: 10 | 20 | 50): void {
    this.updateSettings({ pageSize });
  }

  updateSort(sort: AppSettings['sort']): void {
    this.updateSettings({ sort });
  }

  updateFilters(filters: AppSettings['lastUsedFilters']): void {
    this.updateSettings({ lastUsedFilters: filters });
  }

  updateTheme(theme: 'light' | 'dark'): void {
    this.updateSettings({ theme });
  }

  updateLanguage(language: 'uz' | 'en' | 'ru'): void {
    this.updateSettings({ language });
  }

  updateCompactMode(compactMode: boolean): void {
    this.updateSettings({ compactMode });
  }

  updateDefaultView(defaultView: 'board' | 'table' | 'calendar'): void {
    this.updateSettings({ defaultView });
  }

  updateShowCompletedTasks(show: boolean): void {
    this.updateSettings({ showCompletedTasks: show });
  }

  updateShowOverdueTasks(show: boolean): void {
    this.updateSettings({ showOverdueTasks: show });
  }

  updateNotificationSettings(notifications: Partial<AppSettings['notifications']>): void {
    const current = this.settingsSubject.value;
    const updated = {
      ...current,
      notifications: { 
        ...this.defaultSettings.notifications, 
        ...current.notifications, 
        ...notifications 
      }
    };
    this.updateSettings(updated);
  }

  updatePerformanceSettings(performance: Partial<AppSettings['performance']>): void {
    const current = this.settingsSubject.value;
    const updated = {
      ...current,
      performance: { 
        ...this.defaultSettings.performance, 
        ...current.performance, 
        ...performance 
      }
    };
    this.updateSettings(updated);
  }

  updateDataManagementSettings(dataManagement: Partial<AppSettings['dataManagement']>): void {
    const current = this.settingsSubject.value;
    const updated = {
      ...current,
      dataManagement: { 
        ...this.defaultSettings.dataManagement, 
        ...current.dataManagement, 
        ...dataManagement 
      }
    };
    this.updateSettings(updated);
  }

  updateSecuritySettings(security: Partial<AppSettings['security']>): void {
    const current = this.settingsSubject.value;
    const updated = {
      ...current,
      security: { 
        ...this.defaultSettings.security, 
        ...current.security, 
        ...security 
      }
    };
    this.updateSettings(updated);
  }

  updateIntegrationSettings(integrations: Partial<AppSettings['integrations']>): void {
    const current = this.settingsSubject.value;
    const updated = {
      ...current,
      integrations: { 
        ...this.defaultSettings.integrations, 
        ...current.integrations, 
        ...integrations 
      }
    };
    this.updateSettings(updated);
  }

  // Filter management
  updateLastUsedFilters(filters: Partial<AppSettings['lastUsedFilters']>): void {
    const current = this.settingsSubject.value;
    const updated = {
      ...current,
      lastUsedFilters: { ...current.lastUsedFilters, ...filters }
    };
    this.updateSettings(updated);
  }

  clearLastUsedFilters(): void {
    this.updateLastUsedFilters({});
  }

  // Settings validation
  validateSettings(settings: AppSettings): boolean {
    // Basic validation
    if (settings.pageSize && ![10, 20, 50].includes(settings.pageSize)) {
      return false;
    }
    
    if (settings.performance?.autoSaveDelay && settings.performance.autoSaveDelay < 50) {
      return false;
    }
    
    if (settings.performance?.maxRecycleItems && settings.performance.maxRecycleItems > 1000) {
      return false;
    }
    
    return true;
  }

  // Export/Import settings
  exportSettings(): string {
    const settings = this.getCurrentSettings();
    return JSON.stringify(settings, null, 2);
  }

  importSettings(jsonString: string): boolean {
    try {
      const imported = JSON.parse(jsonString);
      if (this.validateSettings(imported)) {
        this.updateSettings(imported);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }

  resetToDefaults(): void {
    this.settingsSubject.next(this.defaultSettings);
    this.saveSettings(this.defaultSettings);
  }

  getCurrentSettings(): AppSettings {
    return this.settingsSubject.value;
  }

  // Get specific setting values
  getPageSize(): number {
    return this.settingsSubject.value.pageSize;
  }

  getSortSettings(): AppSettings['sort'] {
    return this.settingsSubject.value.sort;
  }

  getTheme(): string {
    return this.settingsSubject.value.theme || 'light';
  }

  getLanguage(): string {
    return this.settingsSubject.value.language || 'uz';
  }

  getAutoSaveDelay(): number {
    return this.settingsSubject.value.performance?.autoSaveDelay || 100;
  }

  getMaxRecycleItems(): number {
    return this.settingsSubject.value.performance?.maxRecycleItems || 100;
  }
}
