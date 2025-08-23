// task-table.ts
import { Component, OnInit, OnDestroy, HostListener, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task, User } from '../../models/task.interfaces';
import { TaskService } from '../../services/task.service';
import { ThemeService } from '../../services/theme.service';
import { Paginator } from '../paginator/paginator';
import { SkeletonComponent } from '../skeleton/skeleton';
import { BulkActionsComponent } from '../bulk-actions/bulk-actions';
import { WipWarningComponent } from '../wip-warning/wip-warning';
import { ControlsPanelComponent } from '../controls-panel/controls-panel';
import { TaskDetail } from '../task-detail/task-detail';
import { TaskForm } from '../task-form/task-form';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ElementRef } from '@angular/core';
import { StatusLabelPipe } from '../../pipes/status-label.pipe';
import { TaskStatus, TaskPriority, TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from '../../models/task.enums';
import { AdvancedFilters } from '../../models/filter.interfaces';
import { AppSettingsService } from '../../services/app-settings.service';
import Swal from 'sweetalert2';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-task-table',
  templateUrl: './task-table.html',
  styleUrls: ['./task-table.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Paginator,
    SkeletonComponent,
    BulkActionsComponent,
    WipWarningComponent,
    ControlsPanelComponent,
    TaskDetail,
    TaskForm,
    StatusLabelPipe
  ]
})
export class TaskTableComponent implements OnInit, OnDestroy {
  // ===== DATA PROPERTIES =====
  tasks: Task[] = [];
  pagedTasks: Task[] = [];
  filteredSortedTasks: Task[] = [];
  users: User[] = [];
  assigneeMap: Record<string, User> = {};

  // ===== UI STATE =====
  loading: boolean = false;
  showBulkActions: boolean = false;
  selectedTasks: Set<string> = new Set();
  expandedRows: Set<string> = new Set();
  selectedTask: Task | null = null;
  showTaskDetail: boolean = false;
  showAdvancedFilters: boolean = false;
  showDataGenerator: boolean = false;

  // ===== VIEWCHILD =====
  @ViewChild('taskForm', { static: false }) taskFormRef!: ElementRef;

  // ===== PAGINATION =====
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;

  // ===== FILTERS =====
  filters = {
    search: '',
    status: '',
    priority: '',
    assignee: '',
    tags: '',
    due_date: '',
    updated_at: ''
  };

  // ===== SORTING =====
  sortField: keyof Task = 'created_at';
  sortDirection: 'asc' | 'desc' = 'desc';

  // ===== ADVANCED FILTERS =====
  advancedFilters: AdvancedFilters = {};

  // ===== WIP WARNING =====
  wipCount: number = 0;
  wipLimit: number = 5;
  showWipWarning: boolean = true;

  // ===== CONSTANTS =====
  readonly statusOptions = TASK_STATUS_OPTIONS;
  readonly priorityOptions = TASK_PRIORITY_OPTIONS;

  // ===== PRIVATE PROPERTIES =====
  private destroy$ = new Subject<void>();
  private debounceTimers: Partial<Record<keyof TaskTableComponent['filters'], any>> = {};

  // ===== INJECTIONS =====
  private taskService = inject(TaskService);
  private themeService = inject(ThemeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private appSettingsService = inject(AppSettingsService);

  // ===== LIFECYCLE =====

  ngOnInit() {
    this.setupDefaultQueryParams();
    this.loadTasks();
    this.loadUsers();
    this.setupRouteParams();
    this.setupThemeSubscription();
    this.setupSettingsSubscription();
    this.setupTaskSubscription();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== DATA LOADING =====

  private loadTasks() {
    this.loading = true;
    this.taskService.loadTasks().subscribe({
      next: (tasks: Task[]) => {
      this.tasks = tasks;
        this.updateWipCount();
      this.applyFilterSortAndPaginate();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading tasks:', error);
        this.loading = false;
      }
    });
  }

  private loadUsers() {
    this.taskService.loadUsers().subscribe({
      next: (users: User[]) => {
      this.users = users;
        this.assigneeMap = users.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<string, User>);
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
      }
    });
  }

  // ===== WIP WARNING =====

  private updateWipCount() {
    this.wipCount = this.tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length;
  }

  // ===== BULK ACTIONS =====

  onBulkUpdateStatus(status: string) {
    const taskIds = Array.from(this.selectedTasks);
    this.taskService.bulkUpdateTasks(taskIds, { status: status as TaskStatus }).subscribe(() => {
      this.loadTasks();
      this.selectedTasks.clear();
      this.showBulkActions = false;
    });
  }

  onBulkUpdatePriority(priority: string) {
    const taskIds = Array.from(this.selectedTasks);
    this.taskService.bulkUpdateTasks(taskIds, { priority: priority as TaskPriority }).subscribe(() => {
      this.loadTasks();
      this.selectedTasks.clear();
      this.showBulkActions = false;
    });
  }

  onBulkDelete() {
    const taskIds = Array.from(this.selectedTasks);
    Swal.fire({
      title: 'Are you sure?',
      text: `This will delete ${taskIds.length} task(s). You can undo within 5 seconds.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete them!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // Only delete and show undo toast if user confirms
        this.taskService.bulkDeleteTasks(taskIds).subscribe(() => {
          this.loadTasks();
          this.selectedTasks.clear();
          this.showBulkActions = false;
        });
      }
      // If user cancels, do nothing - no undo toast needed
    });
  }

  onClearSelection() {
    this.selectedTasks.clear();
    this.showBulkActions = false;
  }

  // ===== TASK SELECTION =====

  toggleSelectAll(event: any) {
    if (event.target.checked) {
      this.pagedTasks.forEach(task => this.selectedTasks.add(task.id));
    } else {
      this.selectedTasks.clear();
    }
    this.showBulkActions = this.selectedTasks.size > 0;
  }

  toggleTaskSelection(taskId: string) {
    if (this.selectedTasks.has(taskId)) {
      this.selectedTasks.delete(taskId);
    } else {
      this.selectedTasks.add(taskId);
    }
    this.showBulkActions = this.selectedTasks.size > 0;
  }

  // ===== ROW EXPANSION =====

  toggleRowExpansion(taskId: string) {
    if (this.expandedRows.has(taskId)) {
      this.expandedRows.delete(taskId);
    } else {
      this.expandedRows.add(taskId);
    }
  }

  // ===== SORTING =====

  toggleSort(field: keyof Task) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilterSortAndPaginate();
  }

  // ===== ROW INTERACTIONS =====

  onRowClick(task: Task, event: Event) {
    // Don't trigger if clicking on interactive elements
    const target = event.target as HTMLElement;
    if (target.closest('button, input, a, .dropdown')) {
      return;
    }
    
    this.selectedTask = task;
    // You can add navigation logic here
  }

  onRowKeydown(event: KeyboardEvent, task: Task) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onRowClick(task, event);
    }
  }

  // ===== QUICK ACTIONS =====

  getAvailableStatuses(currentStatus: TaskStatus): any[] {
    return this.statusOptions.filter(option => option.value !== currentStatus);
  }

  quickChangeStatus(task: Task, newStatus: TaskStatus) {
    const updatedTask = { ...task, status: newStatus };
    this.taskService.updateTask(updatedTask).subscribe(() => {
      this.loadTasks();
    });
  }

  viewTaskDetails(task: Task) {
    this.selectedTask = task;
    this.showTaskDetail = true;
  }

  closeTaskDetail() {
    this.showTaskDetail = false;
    this.selectedTask = null;
  }

  onTaskUpdated(task: Task) {
    // Update the task in the list
    const index = this.tasks.findIndex(t => t.id === task.id);
    if (index !== -1) {
      this.tasks[index] = task;
      this.applyFilterSortAndPaginate();
    }
    this.closeTaskDetail();
  }

  onTaskAdded(task: Task): void {
    // Add the new task to the list
    this.tasks.unshift(task);
    this.applyFilterSortAndPaginate();
    this.selectedTask = null; // Clear selected task
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

  // ===== FILTERING & SORTING =====

  applyFilterSortAndPaginate() {
    let filtered = [...this.tasks];

    // Apply basic filters
    if (this.filters.search) {
      const searchTerm = this.filters.search.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm) ||
        (task.description?.toLowerCase() || '').includes(searchTerm) ||
        (task.tags || []).some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    if (this.filters.status) {
      filtered = filtered.filter(task => task.status === this.filters.status);
    }

    if (this.filters.priority) {
      filtered = filtered.filter(task => task.priority === this.filters.priority);
    }

    if (this.filters.assignee) {
      filtered = filtered.filter(task => task.assignee === this.filters.assignee);
    }

    if (this.filters.tags) {
      const tagFilter = this.filters.tags.toLowerCase();
      filtered = filtered.filter(task =>
        (task.tags || []).some(tag => tag.toLowerCase().includes(tagFilter))
      );
    }

    if (this.filters.due_date) {
      filtered = filtered.filter(task => 
        task.due_date && task.due_date.includes(this.filters.due_date)
      );
    }

    if (this.filters.updated_at) {
      const updateFilter = this.filters.updated_at.toLowerCase();
      filtered = filtered.filter(task =>
        task.updated_at.toLowerCase().includes(updateFilter)
      );
    }

    // Apply advanced filters
    if (this.advancedFilters.due_date_range) {
      filtered = filtered.filter(task => {
        if (!task.due_date) return false;
        const taskDate = new Date(task.due_date);
        const range = this.advancedFilters.due_date_range!;
        return (!range.from || taskDate >= new Date(range.from)) &&
               (!range.to || taskDate <= new Date(range.to));
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[this.sortField];
      const bValue = b[this.sortField];
      
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;
      
      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredSortedTasks = filtered;
    this.totalItems = filtered.length;
    this.applyPagination();
  }

  private applyPagination() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.pagedTasks = this.filteredSortedTasks.slice(startIndex, endIndex);
  }

  // ===== PAGINATION EVENTS =====

  onPageChange(page: number) {
    this.currentPage = page;
    this.updateUrlParams();
    this.applyPagination();
  }

  onPageSizeChange(size: number) {
    this.itemsPerPage = size;
    this.currentPage = 1;
    this.updateUrlParams();
    this.applyPagination();
  }

  private updateUrlParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: this.currentPage,
        size: this.itemsPerPage
      },
      queryParamsHandling: 'merge'
    });
  }

  // ===== FILTER EVENTS =====

  onFiltersChanged(filters?: AdvancedFilters) {
    if (filters) {
      this.advancedFilters = filters;
    }
    this.currentPage = 1;
    this.applyFilterSortAndPaginate();
  }

  onClearFilters() {
    this.advancedFilters = {};
    this.filters = {
      search: '',
      status: '',
      priority: '',
      assignee: '',
      tags: '',
      due_date: '',
      updated_at: ''
    };
    this.currentPage = 1;
    this.applyFilterSortAndPaginate();
  }

  // ===== UTILITY METHODS =====
  
  getAssignee(task: Task): User | undefined {
    return this.taskService.getUserById(task.assignee || '');
  }

  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }

  getStatusBadgeClass(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.TODO:
        return 'bg-secondary';
      case TaskStatus.IN_PROGRESS:
        return 'bg-primary';
      case TaskStatus.CODE_REVIEW:
        return 'bg-info';
      case TaskStatus.TEST_READY:
        return 'bg-warning';
      case TaskStatus.FINISHED:
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }

  getPriorityBadgeClass(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.URGENT:
        return 'priority-urgent';
      case TaskPriority.HIGH:
        return 'priority-high';
      case TaskPriority.MEDIUM:
        return 'priority-medium';
      case TaskPriority.LOW:
        return 'priority-low';
      default:
        return 'priority-default';
    }
  }

  getPriorityIcon(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.URGENT:
        return 'bi-exclamation-triangle-fill';
      case TaskPriority.HIGH:
        return 'bi-arrow-up-circle-fill';
      case TaskPriority.MEDIUM:
        return 'bi-dash-circle-fill';
      case TaskPriority.LOW:
        return 'bi-arrow-down-circle-fill';
      default:
        return 'bi-circle-fill';
    }
  }

  isTaskOverdue(dueDate: string | undefined, status: TaskStatus): boolean {
    if (!dueDate || status === TaskStatus.FINISHED) return false;
    const due = new Date(dueDate);
    const now = new Date();
    return due < now;
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'data:image/png;base64,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';
  }

  editTask(task: Task): void {
    // Navigate to edit page or open edit modal
    this.router.navigate(['/edit-task', task.id], { 
      queryParams: { 
        returnUrl: this.router.url 
      } 
    });
  }
  
  deleteTask(task: Task): void {
    Swal.fire({
      title: 'Are you sure?',
      text: `You won't be able to revert this! Task: "${task.title}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // Only delete and show undo toast if user confirms
        this.taskService.deleteTask(task.id).subscribe(() => {
          this.loadTasks();
        });
      }
      // If user cancels, do nothing - no undo toast needed
    });
  }

  // ===== ROUTE & THEME SETUP =====

  private setupDefaultQueryParams() {
    this.route.data.subscribe(data => {
      if (data['defaultQueryParams'] && !this.route.snapshot.queryParams['sort']) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            sort: 'updated_at,desc',
            page: 1,
            size: 10
          },
          replaceUrl: true
        });
      }
    });
  }

  private setupRouteParams() {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params: Params) => {
      let shouldUpdate = false;
      
      if (params['page']) {
        this.currentPage = parseInt(params['page']);
        shouldUpdate = true;
      }
      if (params['size']) {
        this.itemsPerPage = parseInt(params['size']);
        shouldUpdate = true;
      }
      
      if (shouldUpdate) {
        this.applyFilterSortAndPaginate();
      }
    });
  }

  private setupThemeSubscription() {
    // Theme changes are handled by CSS
  }

  private setupSettingsSubscription() {
    // Settings are handled by CSS variables
  }

  private setupTaskSubscription() {
    // Subscribe to task changes to automatically update the table
    this.taskService.tasks$.pipe(takeUntil(this.destroy$)).subscribe(tasks => {
      this.tasks = tasks;
      this.updateWipCount();
      this.applyFilterSortAndPaginate();
    });
  }

  // ===== HOST LISTENERS =====

  @HostListener('window:resize')
  onResize() {
    // Handle responsive behavior
  }
}
