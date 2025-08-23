import {Component, inject, OnInit, OnDestroy} from '@angular/core';
import {NgClass, NgForOf, NgIf, TitleCasePipe} from '@angular/common';
import {TaskForm} from '../task-form/task-form';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import { Task } from '../../models/task.interfaces';
import { TaskStatus, TaskPriority, getTaskStatusLabel, getTaskStatusIcon } from '../../models/task.enums';
import { TaskDetail } from '../task-detail/task-detail';
import { SkeletonComponent } from '../skeleton/skeleton';
import { TaskTableComponent } from '../task-table/task-table';
import { Paginator } from '../paginator/paginator';
import { ToastrService } from 'ngx-toastr';
import { TaskService } from '../../services/task.service';
import { Subject, takeUntil } from 'rxjs';

interface Column {
  name: string;
  title: string;
  icon: string;
  tasks: Task[];
}

@Component({
  selector: 'task-board',
  standalone: true,
  templateUrl: './task-board.html',
  imports: [
    TitleCasePipe,
    NgForOf,
    NgIf,
    NgClass,
    TaskForm,
    TaskDetail,
    Paginator
  ],
  styleUrls: ['./task-board.css']
})
export class TaskBoard implements OnInit, OnDestroy {
  // ===== DATA PROPERTIES =====
  columns: Column[] = [];
  tasks: Task[] = [];
  draggedTask: Task | null = null;
  selectedTask: Task | null = null;
  detailOpen: boolean = false;
  loading: boolean = false; // Default holatda false qilamiz

  // ===== PAGINATION =====
  currentPage: number = 1;
  itemsPerPage: number = 20;
  totalItems: number = 0;
  paginatedTasks: Task[] = [];

  // ===== CONSTANTS =====
  Math = Math;

  // ===== PRIVATE PROPERTIES =====
  private destroy$ = new Subject<void>();

  // ===== INJECTIONS =====
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastr = inject(ToastrService);
  private taskService = inject(TaskService);

  ngOnInit(): void {
    this.initializeComponent();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== INITIALIZATION =====
  
  private initializeComponent(): void {
    this.setupDefaultQueryParams();
    this.loadData();
  }

  private setupSubscriptions(): void {
    // Subscribe to tasks
    this.taskService.tasks$.pipe(takeUntil(this.destroy$)).subscribe(tasks => {
      this.tasks = tasks;
      this.applyPagination();
      this.generateColumns();
      // Agar ma'lumotlar kelgan bo'lsa, loading ni o'chirish
      if (tasks.length > 0) {
        this.loading = false;
      }
    });

    // Subscribe to loading state
    this.taskService.loading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
      // Faqat agar ma'lumotlar yo'q bo'lsa loading ko'rsatish
      if (this.tasks.length === 0) {
        this.loading = loading;
      }
    });

    // Subscribe to route query params for filtering and pagination
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((p) => {
      // Handle pagination params
      const page = p.get('page');
      const size = p.get('size');
      
      if (page) {
        this.currentPage = parseInt(page, 10);
      }
      if (size) {
        this.itemsPerPage = parseInt(size, 10);
      }

      // Handle filtering
      const title = (p.get('title') || '').toLowerCase();
      if (title) {
        this.tasks = this.taskService.filterTasks({ title });
      } else {
        this.tasks = this.taskService.getCurrentTasks();
      }
      
      this.applyPagination();
      this.generateColumns();
    });
  }

  private setupDefaultQueryParams(): void {
    this.route.data.subscribe(data => {
      if (data['defaultQueryParams'] && !this.route.snapshot.queryParams['sort']) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            sort: 'updated_at,desc',
            page: 1,
            size: 20
          },
          replaceUrl: true
        });
      }
    });
  }

  private loadData(): void {
    // Agar localStorage da ma'lumotlar mavjud bo'lsa, loading ko'rsatmaslik
    const currentTasks = this.taskService.getCurrentTasks();
    if (currentTasks.length > 0) {
      // Ma'lumotlar mavjud, loading ko'rsatmaslik
      this.loading = false;
      this.tasks = currentTasks;
      this.applyPagination();
      this.generateColumns();
    } else {
      // Ma'lumotlar yo'q, loading ko'rsatish
      this.loading = true;
      this.taskService.loadTasks();
    }
  }

  // ===== COLUMN GENERATION =====
  
  private generateColumns(): void {
    const initialColumns = [
      { name: TaskStatus.TODO, title: getTaskStatusLabel(TaskStatus.TODO), icon: getTaskStatusIcon(TaskStatus.TODO) },
      { name: TaskStatus.IN_PROGRESS, title: getTaskStatusLabel(TaskStatus.IN_PROGRESS), icon: getTaskStatusIcon(TaskStatus.IN_PROGRESS) },
      { name: TaskStatus.CODE_REVIEW, title: getTaskStatusLabel(TaskStatus.CODE_REVIEW), icon: getTaskStatusIcon(TaskStatus.CODE_REVIEW) },
      { name: TaskStatus.TEST_READY, title: getTaskStatusLabel(TaskStatus.TEST_READY), icon: getTaskStatusIcon(TaskStatus.TEST_READY) },
      { name: TaskStatus.FINISHED, title: getTaskStatusLabel(TaskStatus.FINISHED), icon: getTaskStatusIcon(TaskStatus.FINISHED) },
    ];

    this.columns = initialColumns.map((col) => ({
      ...col,
      tasks: this.paginatedTasks.filter((task) => task.status === col.name)
    }));
  }

  // ===== PAGINATION =====
  
  private applyPagination(): void {
    this.totalItems = this.tasks.length;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedTasks = this.tasks.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updateUrlParams();
    this.applyPagination();
    this.generateColumns();
  }

  onPageSizeChange(size: number): void {
    this.itemsPerPage = size;
    this.currentPage = 1;
    this.updateUrlParams();
    this.applyPagination();
    this.generateColumns();
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

  // ===== DRAG AND DROP =====
  
  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(columnName: string, event: DragEvent): void {
    event.preventDefault();
    if (this.draggedTask) {
      const oldStatus = this.draggedTask.status;
      const newStatus = columnName as Task['status'];

      const updatedTask = { ...this.draggedTask, status: newStatus };
      this.taskService.updateTask(updatedTask).subscribe(() => {
        this.applyPagination();
        this.generateColumns();

        const oldLabel = getTaskStatusLabel(oldStatus as TaskStatus);
        const newLabel = getTaskStatusLabel(newStatus as TaskStatus);

        this.toastr.success(
          `Task "${this.draggedTask!.title}" moved from ${oldLabel} to ${newLabel}`,
          'Status Updated'
        );

        this.draggedTask = null;
      });
    }
  }

  onDragStart(task: Task): void {
    this.draggedTask = task;
  }

  onDragEnd(): void {
    this.draggedTask = null;
  }

  // ===== TASK DETAILS =====
  
  openTaskDetail(task: Task): void {
    console.log('Task board: Opening task detail for task', task);
    this.selectedTask = task;
    this.detailOpen = true;
  }

  closeTaskDetail(): void {
    this.detailOpen = false;
    this.selectedTask = null;
  }

  onPrev(): void {
    if (!this.selectedTask) return;
    const flat = this.columns.flatMap(c => c.tasks);
    const idx = flat.findIndex(t => t.id === this.selectedTask!.id);
    const prev = idx > 0 ? flat[idx - 1] : flat[flat.length - 1];
    this.selectedTask = prev;
  }

  onNext(): void {
    if (!this.selectedTask) return;
    const flat = this.columns.flatMap(c => c.tasks);
    const idx = flat.findIndex(t => t.id === this.selectedTask!.id);
    const next = idx < flat.length - 1 ? flat[idx + 1] : flat[0];
    this.selectedTask = next;
  }

  // ===== TASK OPERATIONS =====
  
  addTask(): void {
    const taskTitle = prompt('Enter task title:');
    if (taskTitle && taskTitle.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        title: taskTitle.trim(),
        description: '',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        assignee: '',
        tags: [],
        due_date: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        points: 0
      };

      this.taskService.addTask(newTask).subscribe(() => {
        this.applyPagination();
        this.generateColumns();
      });
    }
  }

  editTask(task: Task): void {
    const newTitle = prompt('Edit task title:', task.title);
    if (newTitle !== null && newTitle.trim() !== '') {
      const updatedTask = { ...task, title: newTitle.trim() };
      this.taskService.updateTask(updatedTask).subscribe(() => {
        this.applyPagination();
        this.generateColumns();
      });
    }
  }

  clearData(): void {
    this.taskService.clearAllTasks();
    this.applyPagination();
    this.generateColumns();
  }

  // ===== TASK FORM EVENTS =====
  
  onTaskAdded(task: Task): void {
    this.taskService.addTask(task).subscribe(() => {
      this.applyPagination();
      this.generateColumns();
    });
  }

  onTaskUpdated(task: Task): void {
    this.taskService.updateTask(task).subscribe(() => {
      this.applyPagination();
      this.generateColumns();
    });
  }

  onTaskDeleted(taskId: string): void {
    this.taskService.deleteTask(taskId).subscribe(() => {
      this.applyPagination();
      this.generateColumns();
    });
  }

  // ===== BULK ACTIONS =====
  
  onBulkTasksDeleted(taskIds: string[]): void {
    this.taskService.bulkDeleteTasks(taskIds).subscribe(() => {
      this.applyPagination();
      this.generateColumns();
    });
  }

  onBulkTasksUpdated(updatedTasks: Task[]): void {
    // This would need to be implemented in TaskService if needed
    this.applyPagination();
    this.generateColumns();
  }

  // ===== UTILITY METHODS =====
  
  getPriorityClass(priority: Task['priority']): string {
    switch (priority) {
      case TaskPriority.URGENT:
      case TaskPriority.HIGH:
        return 'high';
      case TaskPriority.MEDIUM:
        return 'medium';
      case TaskPriority.LOW:
      default:
        return 'low';
    }
  }
}
