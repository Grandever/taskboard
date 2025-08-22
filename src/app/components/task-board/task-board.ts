import {Component, inject, OnInit, ViewChild} from '@angular/core';
import {NgClass, NgForOf, NgIf, TitleCasePipe} from '@angular/common';
import {TaskForm} from '../task-form/task-form';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import { Task } from '../../models/task.interfaces'; // Qo'shildi
import { TaskDetail } from '../task-detail/task-detail';
import { SkeletonComponent } from '../skeleton/skeleton';
import { TaskTable } from '../task-table/task-table';
import { Paginator } from '../paginator/paginator';
import { ToastrService } from 'ngx-toastr';



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
    RouterLink,
    TaskDetail,
    SkeletonComponent,
    TaskTable,
    Paginator
  ],
  styleUrls: ['./task-board.css']
})
export class TaskBoard implements OnInit {
  columns: Column[] = []; // Dynamically constructed columns
  tasks: Task[] = []; // Flat list of tasks
  draggedTask: Task | null = null;
  selectedTask: Task | null = null;
  detailOpen: boolean = false;
  loading: boolean = true;
  
  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 20;
  totalItems: number = 0;
  paginatedTasks: Task[] = [];
  
  // Make Math available in template
  Math = Math;
  
  @ViewChild(TaskTable) taskTableComponent!: TaskTable;

  private router= inject(Router)
  private route = inject(ActivatedRoute)
  private toastr = inject(ToastrService)

  ngOnInit(): void {
    // Check if we need to apply default query params
    this.route.data.subscribe(data => {
      if (data['defaultQueryParams'] && !this.route.snapshot.queryParams['sort']) {
        // Apply default query params if no query params are present
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

    this.loading = true;
    // Load tasks from LocalStorage
    const storedTasks = localStorage.getItem('taskboard/v1/tasks');
    if (storedTasks) {
      this.tasks = JSON.parse(storedTasks);
    }

    // Apply pagination and generate columns
    this.applyPagination();
    this.generateColumns();
    // Add delay to show skeleton for 500ms
    setTimeout(() => {
      this.loading = false;
    }, 500);

    // react to title query param for filtering
    this.route.queryParamMap.subscribe((p) => {
      this.loading = true;
      const title = (p.get('title') || '').toLowerCase();
      const all = localStorage.getItem('taskboard/v1/tasks');
      this.tasks = all ? JSON.parse(all) : [];
      if (title) {
        this.tasks = this.tasks.filter(t => (t.title || '').toLowerCase().includes(title));
      }
      this.applyPagination();
      this.generateColumns();
      // Add delay to show skeleton for 500ms
      setTimeout(() => {
        this.loading = false;
      }, 500);
    });
  }

  // Group tasks by status and generate columns dynamically
  private generateColumns(): void {
    const initialColumns = [
      { name: 'todo', title: 'To Do', icon: 'clipboard-list' },
      { name: 'in_progress', title: 'In Progress', icon: 'spinner' },
      { name: 'code_review', title: 'Code Review', icon: 'code' },
      { name: 'test_ready', title: 'Test Ready', icon: 'check-circle' },
      { name: 'finished', title: 'Finished', icon: 'check-circle' },
    ];

    this.columns = initialColumns.map((col) => ({
      ...col,
      tasks: this.paginatedTasks.filter((task) => task.status === col.name) // Filter paginated tasks by status
    }));
  }

  // Save tasks to localStorage
  private saveTasksToLocalStorage(): void {
    localStorage.setItem('taskboard/v1/tasks', JSON.stringify(this.tasks));
  }

  // Apply pagination to tasks
  private applyPagination(): void {
    this.totalItems = this.tasks.length;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedTasks = this.tasks.slice(startIndex, endIndex);
  }

  

  onDragOver(event: DragEvent): void {
    event.preventDefault(); // Allow dropping
  }

  openTaskDetail(task: Task): void {
    console.log('Opening task detail:', task);
    this.selectedTask = task;
    this.detailOpen = true;
  }

  closeTaskDetail(): void {
    console.log('Closing task detail');
    this.detailOpen = false;
    this.selectedTask = null;
  }

  onPrev() {
    if (!this.selectedTask) return;
    const flat = this.columns.flatMap(c => c.tasks);
    const idx = flat.findIndex(t => t.id === this.selectedTask!.id);
    const prev = idx > 0 ? flat[idx - 1] : flat[flat.length - 1];
    this.selectedTask = prev;
  }

  onNext() {
    if (!this.selectedTask) return;
    const flat = this.columns.flatMap(c => c.tasks);
    const idx = flat.findIndex(t => t.id === this.selectedTask!.id);
    const next = idx < flat.length - 1 ? flat[idx + 1] : flat[0];
    this.selectedTask = next;
  }


  onDrop(columnName: string, event: DragEvent): void {
  event.preventDefault();
  if (this.draggedTask) {
    const oldStatus = this.draggedTask.status;
    const newStatus = columnName as Task['status'];
    
    // Update task status
    this.draggedTask.status = newStatus;
    this.draggedTask.updated_at = new Date().toISOString();

    // Update tasks in LocalStorage
    this.saveTasksToLocalStorage();

    // Apply pagination and regenerate columns to reflect the updated tasks
    this.applyPagination();
    this.generateColumns();
    
    // Show toastr notification
    const statusLabels: Record<string, string> = {
      'todo': 'To Do',
      'in_progress': 'In Progress', 
      'code_review': 'Code Review',
      'test_ready': 'Test Ready',
      'finished': 'Finished'
    };
    
    const oldLabel = statusLabels[oldStatus] || oldStatus;
    const newLabel = statusLabels[newStatus] || newStatus;
    
    this.toastr.success(
      `Task "${this.draggedTask.title}" moved from ${oldLabel} to ${newLabel}`,
      'Status Updated'
    );
    
    this.draggedTask = null;
  }
}

  addTask(): void {
    const taskTitle = prompt('Enter task title:');
    if (taskTitle && taskTitle.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        title: taskTitle.trim(),
        description: '',
        status: 'todo',
        priority: 'medium',
        assignee: '',
        tags: [],
        due_date: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        points: 0
      };

      this.tasks.push(newTask); // Add the new task
      this.saveTasksToLocalStorage(); // Save to LocalStorage
      this.applyPagination(); // Apply pagination
      this.generateColumns(); // Regenerate columns
      
      // Show toastr notification
      this.toastr.success(`Task "${newTask.title}" created successfully`, 'Task Added');
    }
  }

  onDragStart(task: Task): void {
    this.draggedTask = task; // Start dragging the selected task
  }

  onDragEnd(): void {
    this.draggedTask = null; // Reset dragged task
  }

  // Pagination event handlers
  onPageChange(page: number): void {
    this.currentPage = page;
    this.applyPagination();
    this.generateColumns();
  }

  onPageSizeChange(): void {
    this.currentPage = 1; // Reset to first page when changing page size
    this.applyPagination();
    this.generateColumns();
  }

  editTask(task: Task): void {
    const newTitle = prompt('Edit task title:', task.title);
    if (newTitle !== null && newTitle.trim() !== '') {
      const oldTitle = task.title;
      task.title = newTitle.trim();
      task.updated_at = new Date().toISOString();
      this.saveTasksToLocalStorage();
      this.applyPagination(); // Apply pagination
      this.generateColumns(); // Update displayed columns
      
      // Show toastr notification
      this.toastr.success(`Task title updated from "${oldTitle}" to "${task.title}"`, 'Task Updated');
    }
  }

  getPriorityClass(priority: Task['priority']): string {
    switch (priority) {
      case 'urgent':
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
      default:
        return 'low';
    }
  }

  clearData(): void {
    // Clear localStorage and reset state
    localStorage.removeItem('taskboard/v1/tasks');
    this.tasks = [];
    this.applyPagination(); // Apply pagination
    this.generateColumns();
    
    // Show toastr notification
    this.toastr.info('All tasks have been cleared', 'Data Cleared');
  }

  onTaskAdded(task: Task): void {
    // Add task to local array immediately
    this.tasks.unshift(task);
    // Apply pagination and regenerate columns to show new task
    this.applyPagination();
    this.generateColumns();
    
    // Show toastr notification
    this.toastr.success(`Task "${task.title}" added to board`, 'Task Added');
    
    // Don't call taskTableComponent.addTask here to avoid duplicate calls
    // The task is already added to localStorage by TaskForm
  }

  onTaskUpdated(task: Task): void {
    // LocalStorage dan qayta o'qish
    const storedTasks = localStorage.getItem('taskboard/v1/tasks');
    this.tasks = storedTasks ? JSON.parse(storedTasks) : [];
    this.applyPagination();
    this.generateColumns();
    
    // Show toastr notification
    this.toastr.success(`Task "${task.title}" updated successfully`, 'Task Updated');
  }

  onTaskDeleted(taskId: string): void {
    // LocalStorage dan qayta o'qish
    const storedTasks = localStorage.getItem('taskboard/v1/tasks');
    this.tasks = storedTasks ? JSON.parse(storedTasks) : [];
    this.applyPagination();
    this.generateColumns();
    
    // Show toastr notification
    this.toastr.info('Task deleted successfully', 'Task Deleted');
  }
}
