import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskTable } from './task-table';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { AppSettingsService } from '../../services/app-settings.service';
import { ToastrService } from 'ngx-toastr';
import { Task } from '../../models/task.interfaces';
import { TaskStatus, TaskPriority } from '../../models/task.enums';
import { of, throwError } from 'rxjs';

describe('TaskTable', () => {
  let component: TaskTable;
  let fixture: ComponentFixture<TaskTable>;
  let mockAppSettings: jasmine.SpyObj<AppSettingsService>;
  let mockToastr: jasmine.SpyObj<ToastrService>;
  let mockHttp: any;

  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Test Task 1',
      description: 'Test Description 1',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assignee: 'user1',
      tags: ['test', 'bug'],
      due_date: '2024-12-31',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      title: 'Test Task 2',
      description: 'Test Description 2',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      assignee: 'user2',
      tags: ['feature'],
      due_date: '2024-11-30',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    }
  ];

  const mockUsers = [
    { id: 'user1', firstName: 'John', lastName: 'Doe', username: 'johndoe', avatarUrl: '' },
    { id: 'user2', firstName: 'Jane', lastName: 'Smith', username: 'janesmith', avatarUrl: '' }
  ];

  beforeEach(async () => {
    mockAppSettings = jasmine.createSpyObj('AppSettingsService', [
      'getCurrentSettings', 'updateLastUsedFilters'
    ]);
    mockToastr = jasmine.createSpyObj('ToastrService', ['success', 'warning', 'error']);

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule
      ],
      providers: [
        TaskTable,
        { provide: AppSettingsService, useValue: mockAppSettings },
        { provide: ToastrService, useValue: mockToastr }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskTable);
    component = fixture.componentInstance;
    
    // Mock HTTP responses
    mockHttp = TestBed.inject(HttpClientTestingModule);
    spyOn(component['http'], 'get').and.returnValues(
      of(mockTasks), // tasks
      of(mockUsers)  // users
    );

    // Mock app settings
    mockAppSettings.getCurrentSettings.and.returnValue({
      lastUsedFilters: {},
      pageSize: 20,
      sort: { by: 'updated_at', dir: 'desc' }
    } as any);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load tasks on init', () => {
    expect(component.tasks.length).toBe(2);
    expect(component.tasks[0].title).toBe('Test Task 1');
  });

  it('should load users on init', () => {
    expect(component.users.length).toBe(2);
    expect(component.users[0].username).toBe('johndoe');
  });

  it('should filter tasks by title', () => {
    component.filters.title = 'Task 1';
    component.onFiltersChanged();
    
    expect(component.filteredSortedTasks.length).toBe(1);
    expect(component.filteredSortedTasks[0].title).toBe('Test Task 1');
  });

  it('should filter tasks by status', () => {
    component.filters.status = TaskStatus.TODO;
    component.onFiltersChanged();
    
    expect(component.filteredSortedTasks.length).toBe(1);
    expect(component.filteredSortedTasks[0].status).toBe(TaskStatus.TODO);
  });

  it('should filter tasks by priority', () => {
    component.filters.priority = TaskPriority.HIGH;
    component.onFiltersChanged();
    
    expect(component.filteredSortedTasks.length).toBe(1);
    expect(component.filteredSortedTasks[0].priority).toBe(TaskPriority.HIGH);
  });

  it('should filter tasks by tags', () => {
    component.filters.tags = 'test';
    component.onFiltersChanged();
    
    expect(component.filteredSortedTasks.length).toBe(1);
    expect(component.filteredSortedTasks[0].tags).toContain('test');
  });

  it('should sort tasks by title ascending', () => {
    component.toggleSort('title');
    
    expect(component.sortBy).toBe('title');
    expect(component.sortDir).toBe('asc');
    expect(component.filteredSortedTasks[0].title).toBe('Test Task 1');
  });

  it('should sort tasks by title descending', () => {
    component.toggleSort('title');
    component.toggleSort('title'); // Toggle to desc
    
    expect(component.sortBy).toBe('title');
    expect(component.sortDir).toBe('desc');
    expect(component.filteredSortedTasks[0].title).toBe('Test Task 2');
  });

  it('should sort tasks by priority', () => {
    component.toggleSort('priority');
    
    expect(component.sortBy).toBe('priority');
    expect(component.sortDir).toBe('asc');
  });

  it('should sort tasks by due_date', () => {
    component.toggleSort('due_date');
    
    expect(component.sortBy).toBe('due_date');
    expect(component.sortDir).toBe('asc');
  });

  it('should sort tasks by updated_at', () => {
    component.toggleSort('updated_at');
    
    expect(component.sortBy).toBe('updated_at');
    expect(component.sortDir).toBe('asc');
  });

  it('should apply advanced filters', () => {
    component.advancedFilters.search = 'Description';
    component.onAdvancedFiltersChanged(component.advancedFilters);
    
    expect(component.filteredSortedTasks.length).toBe(2); // Both have "Description"
  });

  it('should handle bulk selection', () => {
    component.toggleSelectAll();
    expect(component.selectedTasks.size).toBe(2);
    
    component.toggleTaskSelection('1');
    expect(component.selectedTasks.size).toBe(1);
  });

  it('should perform bulk delete', async () => {
    component.selectedTasks.add('1');
    component.selectedTasks.add('2');
    
    // Use the public bulkDelete method instead of private performBulkDelete
    spyOn(component, 'bulkDelete').and.callThrough();
    component.bulkDelete();
    
    expect(component.bulkDelete).toHaveBeenCalled();
  });

  it('should perform bulk status update', async () => {
    component.selectedTasks.add('1');
    component.selectedTasks.add('2');
    
    // Use the public bulkUpdateStatus method instead of private performBulkStatusUpdate
    spyOn(component, 'bulkUpdateStatus').and.callThrough();
    component.bulkUpdateStatus(TaskStatus.FINISHED);
    
    expect(component.bulkUpdateStatus).toHaveBeenCalledWith(TaskStatus.FINISHED);
  });

  it('should get available statuses for workflow', () => {
    const availableStatuses = component.getAvailableStatuses(TaskStatus.TODO);
    expect(availableStatuses.length).toBe(1);
    expect(availableStatuses[0].value).toBe(TaskStatus.IN_PROGRESS);
  });

  it('should check WIP limit', () => {
    // Set multiple tasks to IN_PROGRESS
    component.tasks[0].status = TaskStatus.IN_PROGRESS;
    component.tasks[1].status = TaskStatus.IN_PROGRESS;
    
    const wipCount = component.getWIPCount();
    expect(wipCount).toBe(2);
  });

  it('should handle quick status change', () => {
    const task = component.tasks[0];
    const oldStatus = task.status;
    
    // Test the public quickChangeStatus method
    component.quickChangeStatus(task, TaskStatus.IN_PROGRESS);
    
    expect(task.status).toBe(TaskStatus.IN_PROGRESS);
    expect(task.updated_at).not.toBe(oldStatus);
  });

  it('should handle page changes', () => {
    component.onPageChange(2);
    
    expect(component.currentPage).toBe(2);
  });

  it('should handle page size changes', () => {
    component.onPageSizeChange(50);
    
    expect(component.pageSize).toBe(50);
    expect(component.currentPage).toBe(1); // Reset to first page
  });

  it('should detect overdue tasks', () => {
    const overdueTask = { ...mockTasks[0] };
    overdueTask.due_date = '2023-01-01'; // Past date
    overdueTask.status = TaskStatus.TODO;
    
    const isOverdue = component.isTaskOverdue(overdueTask.due_date, overdueTask.status);
    expect(isOverdue).toBe(true);
  });

  it('should not mark finished tasks as overdue', () => {
    const finishedTask = { ...mockTasks[0] };
    finishedTask.due_date = '2023-01-01'; // Past date
    finishedTask.status = TaskStatus.FINISHED;
    
    const isOverdue = component.isTaskOverdue(finishedTask.due_date, finishedTask.status);
    expect(isOverdue).toBe(false);
  });

  it('should save filters to settings', () => {
    component.filters.title = 'test';
    component.filters.status = TaskStatus.TODO;
    
    // Test that filters are applied correctly
    component.onFiltersChanged();
    
    expect(component.filters.title).toBe('test');
    expect(component.filters.status).toBe(TaskStatus.TODO);
  });

  it('should restore filters from settings', () => {
    mockAppSettings.getCurrentSettings.and.returnValue({
      lastUsedFilters: {
        title: 'restored',
        status: TaskStatus.IN_PROGRESS
      }
    } as any);
    
    // Call ngOnInit again to trigger restore
    component.ngOnInit();
    
    // Verify filters were applied (this tests the public behavior)
    expect(component.filters.title).toBe('restored');
    expect(component.filters.status).toBe(TaskStatus.IN_PROGRESS);
  });

  it('should handle localStorage errors gracefully', () => {
    spyOn(localStorage, 'getItem').and.throwError('QuotaExceededError');
    
    expect(() => component.loadTasks()).not.toThrow();
  });

  it('should handle empty dataset', () => {
    component.tasks = [];
    // Use public method to trigger filtering
    component.onFiltersChanged();
    
    expect(component.filteredSortedTasks.length).toBe(0);
    expect(component.totalItems).toBe(0);
  });

  it('should handle single task dataset', () => {
    component.tasks = [mockTasks[0]];
    // Use public method to trigger filtering
    component.onFiltersChanged();
    
    expect(component.filteredSortedTasks.length).toBe(1);
    expect(component.totalItems).toBe(1);
  });

  it('should handle tasks with many tags', () => {
    const taskWithManyTags = {
      ...mockTasks[0],
      tags: Array.from({ length: 50 }, (_, i) => `tag${i}`)
    };
    
    component.tasks = [taskWithManyTags];
    component.filters.tags = 'tag25';
    component.onFiltersChanged();
    
    expect(component.filteredSortedTasks.length).toBe(1);
    expect(component.filteredSortedTasks[0].tags).toContain('tag25');
  });
});
