# TaskBoard Application

A modern task management application built with Angular, featuring both table and board views for managing tasks.

## Features

- **Dual View Modes**: Table view and Kanban board view
- **Universal Form Validation**: Custom directive for consistent form validation across the application
- **Drag & Drop**: Move tasks between columns in board view
- **Real-time Filtering**: Advanced filtering and sorting capabilities
- **Responsive Design**: Works on desktop and mobile devices
- **Enhanced Local Storage**: Advanced data persistence with versioning, auto-save, and multi-tab sync

## Enhanced LocalStorage Features

The application now includes advanced LocalStorage functionality for better data management and user experience.

### Storage Structure

```
taskboard:v1:tasks          → Task[] (Main task data)
taskboard:v1:settings       → AppSettings (User preferences)
taskboard:v1:recycle_bin    → Task[] (Deleted tasks)
taskboard:v1:users          → User[] (User data)
taskboard:version           → Current storage version
```

### Key Features

#### 1. **Versioning & Migration**
- Current version: `v1`
- Automatic migration system for future format changes
- Backup creation before migrations
- Rollback capability for failed migrations

#### 2. **Auto-save with Debounce**
- Configurable debounce time (default: 100ms)
- Prevents excessive localStorage writes
- Real-time save status indicators
- Immediate save option for critical operations

#### 3. **Multi-tab Synchronization**
- Automatic sync between multiple open tabs
- Storage event listeners for cross-tab communication
- Session tracking and presence detection
- Conflict resolution for concurrent changes

#### 4. **Recycle Bin**
- Soft delete functionality
- Automatic cleanup of old items (30+ days)
- Task restoration capability
- Configurable maximum items limit

#### 5. **Advanced Settings Management**
- User preferences persistence with comprehensive options
- Theme, language, and UI customization
- Performance tuning and storage optimization
- Advanced notification and reminder settings
- Data management and backup configuration
- Security and privacy controls
- Third-party integrations
- Export/Import settings functionality

### Usage Examples

#### Auto-save Service
```typescript
import { AutoSaveService } from './services/auto-save.service';

constructor(private autoSave: AutoSaveService) {}

// Queue tasks for auto-save (with debounce)
this.autoSave.queueSave(updatedTasks);

// Immediate save (bypasses debounce)
this.autoSave.saveImmediately(criticalTasks);
```

#### AppSettings Service
```typescript
import { AppSettingsService } from './services/app-settings.service';

constructor(private settingsService: AppSettingsService) {}

// Basic settings
this.settingsService.updatePageSize(50);
this.settingsService.updateTheme('dark');
this.settingsService.updateLanguage('en');

// UI settings
this.settingsService.updateCompactMode(true);
this.settingsService.updateDefaultView('table');
this.settingsService.updateShowCompletedTasks(false);

// Notification settings
this.settingsService.updateNotificationSettings({
  taskDueReminder: 48,
  dailyDigest: true,
  weeklyReport: true
});

// Performance settings
this.settingsService.updatePerformanceSettings({
  autoSaveDelay: 150,
  maxRecycleItems: 200,
  batchOperations: true
});

// Data management
this.settingsService.updateDataManagementSettings({
  autoBackup: true,
  backupFrequency: 'daily',
  maxBackups: 30
});

// Export/Import settings
const settingsJson = this.settingsService.exportSettings();
this.settingsService.importSettings(settingsJson);

// Filter management
this.settingsService.updateLastUsedFilters({
  status: 'in_progress',
  priority: 'high',
  search: 'urgent'
});
```

#### Recycle Bin Service
```typescript
import { RecycleBinService } from './services/recycle-bin.service';

constructor(private recycleBin: RecycleBinService) {}

// Move task to recycle bin
this.recycleBin.addToRecycleBin(task);

// Restore deleted task
const restoredTask = this.recycleBin.restoreTask(deletedTask);
```

#### Storage Sync Service
```typescript
import { StorageSyncService } from './services/storage-sync.service';

constructor(private storageSync: StorageSyncService) {}

// Listen for external changes
this.storageSync.storageChanges$.subscribe(change => {
  console.log('Storage changed:', change);
});

// Get active tabs
const activeTabs = this.storageSync.getActiveTabs();
```

#### Migration Service
```typescript
import { StorageMigrationService } from './services/storage-migration.service';

constructor(private migration: StorageMigrationService) {}

// Check for pending migrations
const result = await this.migration.checkForMigrations();

// Force migration to specific version
const result = await this.migration.forceMigration('v1.2');
```

## Universal Form Validator Directive

The application includes a universal `FormValidatorDirective` that provides consistent form validation across all components.

### Usage

```html
<ng-template appFormValidator [appFormValidator]="formControl" [fieldName]="'Field Name'" let-errors>
  <div class="invalid-feedback" *ngFor="let error of errors">
    {{ error }}
  </div>
</ng-template>
```

### Features

- **Automatic Error Detection**: Shows errors when field is invalid and touched
- **Custom Messages**: Support for custom error messages
- **Field Name Integration**: Automatic field name in error messages
- **Multiple Error Types**: Supports all common validation types:
  - `required`
  - `minlength` / `maxlength`
  - `min` / `max`
  - `email`
  - `pattern`
  - `unique`
  - `passwordMismatch`
  - `invalidDate`
  - `futureDate`
  - `pastDate`

### Example Implementation

```typescript
// In your component
import { FormValidatorDirective } from '../directives/form-validator.directive';

@Component({
  imports: [FormValidatorDirective],
  // ... other component configuration
})
```

```html
<!-- In your template -->
<input 
  type="text" 
  formControlName="title"
  [class.is-invalid]="form.get('title')?.invalid && form.get('title')?.touched"/>

<ng-template appFormValidator [appFormValidator]="form.get('title')" [fieldName]="'Title'" let-errors>
  <div class="invalid-feedback" *ngFor="let error of errors">
    {{ error }}
  </div>
</ng-template>
```

### Custom Error Messages

```html
<ng-template 
  appFormValidator 
  [appFormValidator]="form.get('email')" 
  [fieldName]="'Email'"
  [customMessages]="{'required': 'Email address is mandatory'}"
  let-errors>
  <div class="invalid-feedback" *ngFor="let error of errors">
    {{ error }}
  </div>
</ng-template>
```

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm start
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── task-board/          # Kanban board view
│   │   ├── task-table/          # Table view
│   │   ├── task-form/           # Task creation/editing form
│   │   ├── task-detail/         # Task detail panel
│   │   ├── skeleton/            # Loading skeleton component
│   │   └── paginator/           # Pagination component
│   ├── directives/
│   │   └── form-validator.directive.ts  # Universal form validator
│   ├── models/
│   │   └── task.interfaces.ts   # TypeScript interfaces
│   ├── pipes/
│   │   └── status-label.pipe.ts # Status formatting pipe
│   ├── services/                 # Enhanced LocalStorage services
│   │   ├── app-settings.service.ts      # Application settings management
│   │   ├── recycle-bin.service.ts       # Deleted tasks management
│   │   ├── auto-save.service.ts         # Debounced auto-save
│   │   ├── storage-sync.service.ts      # Multi-tab synchronization
│   │   ├── storage-migration.service.ts # Data format migrations
│   │   └── index.ts                     # Service exports
│   └── utils/
│       ├── generate-sample-data.ts
│       └── storage.utils.ts
```

## Technologies Used

- **Angular 17** - Frontend framework
- **Bootstrap 5** - UI components and styling
- **TypeScript** - Type safety
- **RxJS** - Reactive programming
- **ngx-toastr** - Toast notifications

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
