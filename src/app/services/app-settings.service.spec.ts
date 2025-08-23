import { TestBed } from '@angular/core/testing';
import { AppSettingsService } from './app-settings.service';
import { AppSettings } from '../models/task.interfaces';
import { TaskStatus, TaskPriority } from '../models/task.enums';

describe('AppSettingsService', () => {
  let service: AppSettingsService;
  let mockLocalStorage: { [key: string]: string } = {};

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    spyOn(localStorage, 'getItem').and.callFake((key: string) => mockLocalStorage[key] || null);
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      mockLocalStorage[key] = value;
    });

    TestBed.configureTestingModule({
      providers: [AppSettingsService]
    });
    service = TestBed.inject(AppSettingsService);
  });

  afterEach(() => {
    mockLocalStorage = {};
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load default settings when no stored settings exist', () => {
    const settings = service.getCurrentSettings();
    expect(settings.pageSize).toBe(20);
    expect(settings.sort.by).toBe('updated_at');
    expect(settings.sort.dir).toBe('desc');
    expect(settings.theme).toBe('light');
    expect(settings.language).toBe('uz');
  });

  it('should save and load custom settings', () => {
    const customSettings: Partial<AppSettings> = {
      pageSize: 50,
      theme: 'dark',
      language: 'en'
    };

    service.updateSettings(customSettings);
    
    const loadedSettings = service.getCurrentSettings();
    expect(loadedSettings.pageSize).toBe(50);
    expect(loadedSettings.theme).toBe('dark');
    expect(loadedSettings.language).toBe('en');
  });

  it('should update specific settings without affecting others', () => {
    service.updatePageSize(50);
    service.updateTheme('dark');
    
    const settings = service.getCurrentSettings();
    expect(settings.pageSize).toBe(50);
    expect(settings.theme).toBe('dark');
    expect(settings.language).toBe('uz'); // Should remain default
  });

  it('should update last used filters', () => {
    const filters = {
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      search: 'test task'
    };

    service.updateLastUsedFilters(filters);
    
    const settings = service.getCurrentSettings();
    expect(settings.lastUsedFilters.status).toBe(TaskStatus.IN_PROGRESS);
    expect(settings.lastUsedFilters.priority).toBe(TaskPriority.HIGH);
    expect(settings.lastUsedFilters.search).toBe('test task');
  });

  it('should clear last used filters', () => {
    // First add some filters
    service.updateLastUsedFilters({
      status: TaskStatus.IN_PROGRESS,
      search: 'test'
    });

    // Then clear them
    service.clearLastUsedFilters();
    
    const settings = service.getCurrentSettings();
    expect(settings.lastUsedFilters.status).toBeUndefined();
    expect(settings.lastUsedFilters.search).toBeUndefined();
  });

  it('should validate settings correctly', () => {
    const validSettings = service.getCurrentSettings();
    expect(service.validateSettings(validSettings)).toBe(true);

    const invalidSettings = { ...validSettings, pageSize: 999 as any };
    expect(service.validateSettings(invalidSettings)).toBe(false);
  });

  it('should export and import settings', () => {
    const originalSettings = service.getCurrentSettings();
    const exportedJson = service.exportSettings();
    
    // Clear settings
    service.resetToDefaults();
    
    // Import back
    const importSuccess = service.importSettings(exportedJson);
    expect(importSuccess).toBe(true);
    
    const importedSettings = service.getCurrentSettings();
    expect(importedSettings.pageSize).toBe(originalSettings.pageSize);
    expect(importedSettings.theme).toBe(originalSettings.theme);
  });

  it('should handle invalid JSON import gracefully', () => {
    const invalidJson = 'invalid json string';
    const importSuccess = service.importSettings(invalidJson);
    expect(importSuccess).toBe(false);
  });

  it('should reset to default settings', () => {
    // Change some settings
    service.updatePageSize(50);
    service.updateTheme('dark');
    
    // Reset to defaults
    service.resetToDefaults();
    
    const settings = service.getCurrentSettings();
    expect(settings.pageSize).toBe(20);
    expect(settings.theme).toBe('light');
  });

  it('should handle localStorage errors gracefully', () => {
    // Simulate localStorage error
    spyOn(localStorage, 'setItem').and.throwError('QuotaExceededError');
    
    // Should not crash
    expect(() => service.updatePageSize(50)).not.toThrow();
  });
});
