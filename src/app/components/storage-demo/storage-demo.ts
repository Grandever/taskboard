import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  AppSettingsService, 
  RecycleBinService, 
  AutoSaveService, 
  StorageSyncService, 
  StorageMigrationService 
} from '../../services';
import { Task } from '../../models/task.interfaces';
import { TaskForm } from '../task-form/task-form';

@Component({
  selector: 'storage-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, TaskForm],
  template: `
    <!-- Task Form for Add/Edit -->
    <task-form
      #taskForm
      [taskToEdit]="selectedTask"
      (taskAdded)="onTaskAdded($event)"
      (taskUpdated)="onTaskUpdated($event)"
    ></task-form>

    <div class="container mt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="mb-0">LocalStorage Funksionalligi Demo</h2>
        <button class="btn btn-primary" (click)="addNewTask()">
          <i class="bi bi-plus-circle me-2"></i>
          Add New Task
        </button>
      </div>
      
             <!-- App Settings -->
       <div class="card mb-4">
         <div class="card-header">
           <h5>App Settings</h5>
         </div>
         <div class="card-body">
           <div class="row">
             <div class="col-md-4">
               <label class="form-label">Sahifa hajmi:</label>
               <select class="form-select" 
                       [value]="currentSettings.pageSize"
                       (change)="updatePageSize($event)">
                 <option value="10">10</option>
                 <option value="20">20</option>
                 <option value="50">50</option>
               </select>
             </div>
             <div class="col-md-4">
               <label class="form-label">Tema:</label>
               <select class="form-select" 
                       [value]="currentSettings.theme || 'light'"
                       (change)="updateTheme($event)">
                 <option value="light">Yorug'</option>
                 <option value="dark">Qorong'i</option>
               </select>
             </div>
             <div class="col-md-4">
               <label class="form-label">Til:</label>
               <select class="form-select" 
                       [value]="currentSettings.language || 'uz'"
                       (change)="updateLanguage($event)">
                 <option value="uz">O'zbekcha</option>
                 <option value="en">English</option>
                 <option value="ru">Русский</option>
               </select>
             </div>
           </div>
           
           <div class="row mt-3">
             <div class="col-md-4">
               <label class="form-label">Default View:</label>
               <select class="form-select" 
                       [value]="currentSettings.defaultView || 'board'"
                       (change)="updateDefaultView($event)">
                 <option value="board">Board</option>
                 <option value="table">Table</option>
                 <option value="calendar">Calendar</option>
               </select>
             </div>
             <div class="col-md-4">
               <div class="form-check mt-4">
                 <input class="form-check-input" type="checkbox" 
                        [checked]="currentSettings.compactMode || false"
                        (change)="updateCompactMode($event.target.checked)">
                 <label class="form-check-label">Compact Mode</label>
               </div>
             </div>
             <div class="col-md-4">
               <div class="form-check mt-4">
                 <input class="form-check-input" type="checkbox" 
                        [checked]="currentSettings.showCompletedTasks || true"
                        (change)="updateShowCompletedTasks($event.target.checked)">
                 <label class="form-check-label">Show Completed Tasks</label>
               </div>
             </div>
           </div>
           
           <div class="row mt-3">
             <div class="col-md-6">
               <button class="btn btn-secondary me-2" (click)="resetSettings()">
                 Sozlamalarni tiklash
               </button>
               <button class="btn btn-info me-2" (click)="exportSettings()">
                 Export Settings
               </button>
               <button class="btn btn-warning" (click)="showImportDialog()">
                 Import Settings
               </button>
             </div>
             <div class="col-md-6">
               <input type="file" class="form-control" 
                      accept=".json" 
                      (change)="importSettingsFromFile($event)"
                      style="display: none;"
                      #fileInput>
               <button class="btn btn-outline-primary" (click)="fileInput.click()">
                 Import from File
               </button>
             </div>
           </div>
         </div>
       </div>

      <!-- Auto-save Status -->
      <div class="card mb-4">
        <div class="card-header">
          <h5>Auto-save Holati</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <p><strong>Saqlash holati:</strong> 
                <span [class]="isSaving ? 'text-warning' : 'text-success'">
                  {{ isSaving ? 'Saqlanmoqda...' : 'Saqlangan' }}
                </span>
              </p>
              <p><strong>Oxirgi saqlash:</strong> 
                {{ lastSaved ? (lastSaved | date:'medium') : 'Hali saqlanmagan' }}
              </p>
            </div>
            <div class="col-md-6">
              <label class="form-label">Debounce vaqti (ms):</label>
              <input type="number" class="form-control" 
                     [value]="debounceTime"
                     (change)="updateDebounceTime($event)">
            </div>
          </div>
          <button class="btn btn-primary" (click)="testAutoSave()">
            Test Auto-save
          </button>
        </div>
      </div>

      <!-- Recycle Bin -->
      <div class="card mb-4">
        <div class="card-header">
          <h5>Recycle Bin</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <p><strong>O'chirilgan vazifalar:</strong> {{ deletedTasksCount }}</p>
              <p><strong>Eng eski:</strong> {{ oldestDeleted || 'Yo\'q' }}</p>
              <p><strong>Eng yangi:</strong> {{ newestDeleted || 'Yo\'q' }}</p>
            </div>
            <div class="col-md-6">
              <button class="btn btn-warning me-2" (click)="cleanupOldItems()">
                Eski elementlarni tozalash
              </button>
              <button class="btn btn-danger" (click)="clearRecycleBin()">
                Recycle Bin ni tozalash
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Multi-tab Sync -->
      <div class="card mb-4">
        <div class="card-header">
          <h5>Multi-tab Sinxronlash</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <p><strong>Faol tablar:</strong> {{ activeTabsCount }}</p>
              <p><strong>Bu tab yagona:</strong> {{ isOnlyTab ? 'Ha' : 'Yo\'q' }}</p>
            </div>
            <div class="col-md-6">
              <button class="btn btn-info" (click)="refreshTabInfo()">
                Tab ma'lumotlarini yangilash
              </button>
            </div>
          </div>
          <div *ngIf="activeTabs.length > 0" class="mt-3">
            <h6>Faol tablar:</h6>
            <ul class="list-group">
              <li *ngFor="let tab of activeTabs" class="list-group-item">
                {{ tab.url }} - {{ tab.timestamp | date:'short' }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Migration -->
      <div class="card mb-4">
        <div class="card-header">
          <h5>Migratsiya</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6">
              <p><strong>Joriy versiya:</strong> {{ currentVersion }}</p>
              <p><strong>Mavjud migratsiyalar:</strong> {{ availableMigrations.length }}</p>
            </div>
            <div class="col-md-6">
              <button class="btn btn-success me-2" (click)="checkMigrations()">
                Migratsiyalarni tekshirish
              </button>
              <button class="btn btn-warning" (click)="createBackup()">
                Backup yaratish
              </button>
            </div>
          </div>
          <div *ngIf="migrationResult" class="mt-3">
            <div [class]="migrationResult.success ? 'alert alert-success' : 'alert alert-danger'">
              <h6>Migratsiya natijasi:</h6>
              <p><strong>Holat:</strong> {{ migrationResult.success ? 'Muvaffaqiyatli' : 'Xatolik' }}</p>
              <p><strong>Versiya:</strong> {{ migrationResult.version }}</p>
              <p *ngIf="migrationResult.migratedKeys.length > 0">
                <strong>Migratsiya qilingan:</strong> {{ migrationResult.migratedKeys.join(', ') }}
              </p>
              <p *ngIf="migrationResult.errors.length > 0">
                <strong>Xatolar:</strong> {{ migrationResult.errors.join(', ') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Storage Info -->
      <div class="card mb-4">
        <div class="card-header">
          <h5>Storage Ma'lumotlari</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-4">
              <p><strong>Ishlatilgan:</strong> {{ storageInfo.used | number:'1.0-0' }} bytes</p>
            </div>
            <div class="col-md-4">
              <p><strong>Mavjud:</strong> {{ storageInfo.available | number:'1.0-0' }} bytes</p>
            </div>
            <div class="col-md-4">
              <p><strong>Foiz:</strong> {{ storageInfo.percentage | number:'1.0-1' }}%</p>
            </div>
          </div>
          <div class="progress">
            <div class="progress-bar" 
                 [style.width.%]="storageInfo.percentage"
                 [class]="storageInfo.percentage > 80 ? 'bg-danger' : storageInfo.percentage > 60 ? 'bg-warning' : 'bg-success'">
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .progress {
      height: 20px;
    }
  `]
})
export class StorageDemoComponent implements OnInit, OnDestroy {
  currentSettings: any = {};
  isSaving = false;
  lastSaved: Date | null = null;
  debounceTime = 100;
  
  deletedTasksCount = 0;
  oldestDeleted: string | null = null;
  newestDeleted: string | null = null;
  
  activeTabsCount = 0;
  isOnlyTab = false;
  activeTabs: any[] = [];
  
  currentVersion = 'v1';
  availableMigrations: any[] = [];
  migrationResult: any = null;
  
  storageInfo = { used: 0, available: 0, percentage: 0 };

  // TaskForm state
  selectedTask: Task | null = null;

  // ===== VIEWCHILD =====
  @ViewChild('taskForm', { static: false }) taskFormRef!: ElementRef;

  constructor(
    private settingsService: AppSettingsService,
    private recycleBinService: RecycleBinService,
    private autoSaveService: AutoSaveService,
    private storageSyncService: StorageSyncService,
    private migrationService: StorageMigrationService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions if needed
  }

  private loadData(): void {
    this.currentSettings = this.settingsService.getCurrentSettings();
    this.currentVersion = this.migrationService.getCurrentVersion();
    this.availableMigrations = this.migrationService.getAvailableMigrations();
    this.updateStorageInfo();
    this.updateRecycleBinInfo();
    this.updateTabInfo();
  }

  private setupSubscriptions(): void {
    this.settingsService.settings$.subscribe(settings => {
      this.currentSettings = settings;
    });

    this.autoSaveService.isSaving$.subscribe(isSaving => {
      this.isSaving = isSaving;
    });

    this.autoSaveService.lastSaved$.subscribe(lastSaved => {
      this.lastSaved = lastSaved;
    });

    this.recycleBinService.deletedTasks$.subscribe(tasks => {
      this.updateRecycleBinInfo();
    });
  }

  // App Settings methods
  updatePageSize(event: any): void {
    const pageSize = parseInt(event.target.value) as 10 | 20 | 50;
    this.settingsService.updatePageSize(pageSize);
  }

  updateTheme(event: any): void {
    const theme = event.target.value as 'light' | 'dark';
    this.settingsService.updateSettings({ theme });
  }

  updateLanguage(event: any): void {
    const language = event.target.value as 'uz' | 'en' | 'ru';
    this.settingsService.updateLanguage(language);
  }

  updateDefaultView(event: any): void {
    const defaultView = event.target.value as 'board' | 'table' | 'calendar';
    this.settingsService.updateDefaultView(defaultView);
  }

  updateCompactMode(compactMode: boolean): void {
    this.settingsService.updateCompactMode(compactMode);
  }

  updateShowCompletedTasks(show: boolean): void {
    this.settingsService.updateShowCompletedTasks(show);
  }

  exportSettings(): void {
    const settingsJson = this.settingsService.exportSettings();
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskboard-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  showImportDialog(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const success = this.settingsService.importSettings(e.target.result);
          if (success) {
            alert('Settings imported successfully!');
          } else {
            alert('Failed to import settings. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  importSettingsFromFile(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const success = this.settingsService.importSettings(e.target.result);
        if (success) {
          alert('Settings imported successfully!');
        } else {
          alert('Failed to import settings. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  }

  resetSettings(): void {
    this.settingsService.resetToDefaults();
  }

  // Auto-save methods
  updateDebounceTime(event: any): void {
    const time = parseInt(event.target.value);
    this.debounceTime = time;
    this.autoSaveService.updateDebounceTime(time);
  }

  testAutoSave(): void {
    const testTasks: Task[] = [
      { 
        id: 'test-1', 
        title: 'Test Task 1', 
        status: 'todo' as any, 
        priority: 'medium' as any, 
        created_at: new Date().toISOString(), 
        updated_at: new Date().toISOString() 
      },
      { 
        id: 'test-2', 
        title: 'Test Task 2', 
        status: 'in_progress' as any, 
        priority: 'high' as any, 
        created_at: new Date().toISOString(), 
        updated_at: new Date().toISOString() 
      }
    ];
    this.autoSaveService.queueSave(testTasks);
  }

  // Recycle Bin methods
  private updateRecycleBinInfo(): void {
    const stats = this.recycleBinService.getRecycleBinStats();
    this.deletedTasksCount = stats.totalItems;
    this.oldestDeleted = stats.oldestItem ? stats.oldestItem.toLocaleDateString() : null;
    this.newestDeleted = stats.newestItem ? stats.newestItem.toLocaleDateString() : null;
  }

  cleanupOldItems(): void {
    this.recycleBinService.cleanupOldItems();
  }

  clearRecycleBin(): void {
    this.recycleBinService.clearRecycleBin();
  }

  // Multi-tab methods
  private updateTabInfo(): void {
    this.activeTabs = this.storageSyncService.getActiveTabs();
    this.activeTabsCount = this.activeTabs.length;
    this.isOnlyTab = this.storageSyncService.isOnlyActiveTab();
  }

  refreshTabInfo(): void {
    this.updateTabInfo();
  }

  // Migration methods
  async checkMigrations(): Promise<void> {
    this.migrationResult = await this.migrationService.checkForMigrations();
  }

  async createBackup(): Promise<void> {
    const success = await this.migrationService.createBackup();
    if (success) {
      alert('Backup muvaffaqiyatli yaratildi!');
    } else {
      alert('Backup yaratishda xatolik yuz berdi!');
    }
  }

  // Storage info
  private updateStorageInfo(): void {
    // This would need to be implemented in storage.utils.ts
    // For now, we'll use a placeholder
    this.storageInfo = { used: 1024 * 1024, available: 4 * 1024 * 1024, percentage: 20 };
  }

  // TaskForm methods
  onTaskAdded(task: Task): void {
    // Task added successfully
    console.log('New task added:', task);
  }

  onTaskUpdated(task: Task): void {
    // Task updated successfully
    console.log('Task updated:', task);
  }

  addNewTask(): void {
    this.selectedTask = null; // Clear any selected task to show add form
    // Open the modal
    setTimeout(() => {
      if (this.taskFormRef) {
        const taskFormComponent = this.taskFormRef as any;
        if (taskFormComponent.openModal) {
          taskFormComponent.openModal();
        }
      }
    }, 100);
  }
}
