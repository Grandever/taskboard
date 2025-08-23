import {Component, OnInit, ViewChild, inject} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {ActivatedRoute, Router, RouterLinkActive} from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import {TaskBoard} from './components/task-board/task-board';
import {TaskForm} from './components/task-form/task-form';
import {RouterLink, RouterOutlet} from '@angular/router';
import {ThemeToggleComponent} from './components/theme-toggle/theme-toggle';
import {
  AppSettingsService,
  RecycleBinService,
  AutoSaveService,
  StorageSyncService,
  StorageMigrationService
} from './services';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TaskBoard, TaskForm, RouterOutlet, RouterLink, FormsModule, ThemeToggleComponent, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit{

  @ViewChild(TaskForm) modal!: TaskForm;

  titleSearch: string = '';
  private titleSearchInput$ = new Subject<string>();

  // Inject services to initialize them
  private settingsService = inject(AppSettingsService);
  private recycleBinService = inject(RecycleBinService);
  private autoSaveService = inject(AutoSaveService);
  private storageSyncService = inject(StorageSyncService);
  private migrationService = inject(StorageMigrationService);
  private themeService = inject(ThemeService);

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.initializeServices();
    this.setupSearch();
    this.themeService.watchSystemTheme();
  }

  private async initializeServices(): Promise<void> {
    try {
      // Check for pending migrations
      const migrationResult = await this.migrationService.checkForMigrations();
      if (migrationResult.success && migrationResult.migratedKeys.length > 0) {
        console.log('Migrations completed:', migrationResult.migratedKeys);
      }

      // Cleanup old recycle bin items
      this.recycleBinService.cleanupOldItems();

      // Cleanup old tasks
      this.autoSaveService.cleanupOldTasks();

      console.log('All services initialized successfully');
    } catch (error) {
      console.error('Error initializing services:', error);
    }
  }

  private setupSearch(): void {
    this.route.queryParamMap.subscribe((p) => {
      const t = p.get('title');
      this.titleSearch = t ?? '';
    });

    this.titleSearchInput$
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((val) => {
        this.router.navigate([], {
          queryParams: { title: val || undefined },
          queryParamsHandling: 'merge',
        });
      });
  }

  onSearchInput(value: string) {
    this.titleSearch = value;
    this.titleSearchInput$.next(value);
    // Optionally emit an event or use a shared service to notify TaskBoard
  }
}
