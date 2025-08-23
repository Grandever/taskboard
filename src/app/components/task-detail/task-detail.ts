import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import { Task, User } from '../../models/task.interfaces';
import { HttpClient } from '@angular/common/http';
import {NgIf, TitleCasePipe, DatePipe, NgClass} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TaskForm} from '../task-form/task-form';
import { StatusLabelPipe } from '../../pipes/status-label.pipe';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  templateUrl: './task-detail.html',
  imports: [
    RouterLink,
    NgIf,
    TitleCasePipe,
    DatePipe,
    StatusLabelPipe,
    TaskForm,
    FormsModule,
    NgClass
  ],
  styleUrls: ['./task-detail.css']
})
export class TaskDetail implements OnInit {
  @Input() taskInput: Task | null = null; // optional, for embedded usage
  @Output() close = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() taskUpdated = new EventEmitter<Task>();
  taskId!: string | null;
  taskDetails: Task | null = null;

  @ViewChild(TaskForm) taskFormComponent!: TaskForm; // Reference to the TaskForm component

  users: User[] = [];
  readonly fallbackAvatar: string = 'data:image/png;base64,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';

  // Inline editing properties
  editingStatus: boolean = false;
  editingPriority: boolean = false;
  editingTitle: boolean = false;
  editingPoints: boolean = false;
  editingDescription: boolean = false;
  editingDueDate: boolean = false;

  editingStatusValue: string = '';
  editingPriorityValue: string = '';
  editingTitleValue: string = '';
  editingPointsValue: number = 0;
  editingDescriptionValue: string = '';
  editingDueDateValue: string = '';

  constructor(private route: ActivatedRoute, private router: Router, private toastr: ToastrService, private http: HttpClient) {}

  ngOnInit(): void {
    // If embedded with direct input, prefer that; otherwise fall back to route param
    if (this.taskInput) {
      console.log('Task detail: Using taskInput', this.taskInput);
      this.taskDetails = this.taskInput;
      this.initializeEditingValues();
    } else {
      this.route.paramMap.subscribe((paramMap) => {
        this.taskId = paramMap.get('id');
        console.log('Task detail: Loading from route, taskId:', this.taskId);
        if (this.taskId) {
          const storedTasks = localStorage.getItem('taskboard/v1/tasks');
          if (storedTasks) {
            const tasks: Task[] = JSON.parse(storedTasks);
            this.taskDetails = tasks.find(task => task.id === this.taskId) || null;
            console.log('Task detail: Found task', this.taskDetails);
            if (this.taskDetails) {
              this.initializeEditingValues();
            }
          }
        }
      });
    }
  }

  get assigneeUser(): User | undefined {
    if (!this.taskDetails || !this.taskDetails.assignee) return undefined;
    return this.users.find(u => u.id === this.taskDetails!.assignee);
  }

  ngAfterViewInit(): void {
    // Load users for name/avatar resolution
    this.http.get<User[]>('/taskboard/v1/users').subscribe((u) => {
      this.users = Array.isArray(u) ? u : [];
    });
  }

  onAvatarError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== this.fallbackAvatar) {
      img.src = this.fallbackAvatar;
    }
  }

  onClose() {
    this.close.emit();
  }

  private initializeEditingValues(): void {
    if (this.taskDetails) {
      this.editingStatusValue = this.taskDetails.status || '';
      this.editingPriorityValue = this.taskDetails.priority || '';
      this.editingTitleValue = this.taskDetails.title || '';
      this.editingPointsValue = this.taskDetails.points || 0;
      this.editingDescriptionValue = this.taskDetails.description || '';
      this.editingDueDateValue = this.taskDetails.due_date || '';
    }
  }

  // Open the TaskForm component in edit mode
  editTask(): void {
    if (this.taskFormComponent) {
      this.taskFormComponent.taskToEdit = this.taskDetails; // Set the task to edit
      this.taskFormComponent.openModal(); // Open the modal
    }
  }

  onTaskUpdated(task: Task): void {
    // Update the task in localStorage
    const storedTasks = localStorage.getItem('taskboard/v1/tasks');
    if (storedTasks) {
      const tasks: Task[] = JSON.parse(storedTasks);
      const taskIndex = tasks.findIndex(t => t.id === task.id);
      if (taskIndex > -1) {
        // Yangilashdan oldin updated_at ni o'zgartiring
        const updatedTask = { ...tasks[taskIndex], ...task, updated_at: new Date().toISOString() };
        tasks[taskIndex] = updatedTask;
        localStorage.setItem('taskboard/v1/tasks', JSON.stringify(tasks));

        // Provide feedback to the user
        this.toastr.success(`Task "${task.title}" updated successfully!`, 'Success');
        this.taskDetails = updatedTask;
      }
    }
  }

  // Assign task to current user (simulated)
  assignToMe(): void {
    if (!this.taskDetails) return;

    // Simulate current user (in real app, this would come from auth service)
    const currentUserId = 'user_1'; // Default user for demo

    // Update task assignee
    const updatedTask = {
      ...this.taskDetails,
      assignee: currentUserId,
      updated_at: new Date().toISOString()
    };

    // Update in localStorage
    const storedTasks = localStorage.getItem('taskboard/v1/tasks');
    if (storedTasks) {
      const tasks: Task[] = JSON.parse(storedTasks);
      const taskIndex = tasks.findIndex(t => t.id === this.taskDetails!.id);
      if (taskIndex > -1) {
        tasks[taskIndex] = updatedTask;
        localStorage.setItem('taskboard/v1/tasks', JSON.stringify(tasks));

        // Update local reference
        this.taskDetails = updatedTask;

        // Show success message
        this.toastr.success('Task assigned to you successfully!', 'Assigned');
      }
    }
  }

  // Inline editing methods
  startEditStatus(): void {
    this.editingStatus = true;
    this.editingStatusValue = this.taskDetails?.status || '';
  }

  saveStatus(): void {
    if (this.taskDetails && this.editingStatusValue) {
      const updatedTask = {
        ...this.taskDetails,
        status: this.editingStatusValue as Task['status'],
        updated_at: new Date().toISOString()
      };
      this.updateTaskInStorage(updatedTask);
      this.editingStatus = false;
      this.toastr.success('Status updated successfully!', 'Updated');
    }
  }

  cancelEditStatus(): void {
    this.editingStatus = false;
    this.editingStatusValue = '';
  }

  startEditPriority(): void {
    this.editingPriority = true;
    this.editingPriorityValue = this.taskDetails?.priority || '';
  }

  savePriority(): void {
    if (this.taskDetails && this.editingPriorityValue) {
      const updatedTask = {
        ...this.taskDetails,
        priority: this.editingPriorityValue as Task['priority'],
        updated_at: new Date().toISOString()
      };
      this.updateTaskInStorage(updatedTask);
      this.editingPriority = false;
      this.toastr.success('Priority updated successfully!', 'Updated');
    }
  }

  cancelEditPriority(): void {
    this.editingPriority = false;
    this.editingPriorityValue = '';
  }

  startEditTitle(): void {
    this.editingTitle = true;
    this.editingTitleValue = this.taskDetails?.title || '';
  }

  saveTitle(): void {
    if (this.taskDetails && this.editingTitleValue.trim()) {
      const updatedTask = {
        ...this.taskDetails,
        title: this.editingTitleValue.trim(),
        updated_at: new Date().toISOString()
      };
      this.updateTaskInStorage(updatedTask);
      this.editingTitle = false;
      this.toastr.success('Title updated successfully!', 'Updated');
    }
  }

  cancelEditTitle(): void {
    this.editingTitle = false;
    this.editingTitleValue = '';
  }

  startEditPoints(): void {
    this.editingPoints = true;
    this.editingPointsValue = this.taskDetails?.points || 0;
  }

  savePoints(): void {
    if (this.taskDetails) {
      const updatedTask = {
        ...this.taskDetails,
        points: this.editingPointsValue,
        updated_at: new Date().toISOString()
      };
      this.updateTaskInStorage(updatedTask);
      this.editingPoints = false;
      this.toastr.success('Story points updated successfully!', 'Updated');
    }
  }

  cancelEditPoints(): void {
    this.editingPoints = false;
    this.editingPointsValue = 0;
  }

  startEditDescription(): void {
    this.editingDescription = true;
    this.editingDescriptionValue = this.taskDetails?.description || '';
  }

  saveDescription(): void {
    if (this.taskDetails) {
      const updatedTask = {
        ...this.taskDetails,
        description: this.editingDescriptionValue,
        updated_at: new Date().toISOString()
      };
      this.updateTaskInStorage(updatedTask);
      this.editingDescription = false;
      this.toastr.success('Description updated successfully!', 'Updated');
    }
  }

  cancelEditDescription(): void {
    this.editingDescription = false;
    this.editingDescriptionValue = '';
  }

  startEditDueDate(): void {
    this.editingDueDate = true;
    this.editingDueDateValue = this.taskDetails?.due_date || '';
  }

  saveDueDate(): void {
    if (this.taskDetails) {
      const updatedTask = {
        ...this.taskDetails,
        due_date: this.editingDueDateValue,
        updated_at: new Date().toISOString()
      };
      this.updateTaskInStorage(updatedTask);
      this.editingDueDate = false;
      this.toastr.success('Due date updated successfully!', 'Updated');
    }
  }

  cancelEditDueDate(): void {
    this.editingDueDate = false;
    this.editingDueDateValue = '';
  }

  isTaskOverdue(dueDate: string, status: string): boolean {
    if (!dueDate || status === 'finished') return false;
    const due = new Date(dueDate);
    const now = new Date();
    return due < now;
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'urgent':
        return 'priority-urgent';
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return 'priority-default';
    }
  }

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'urgent':
        return 'bi-exclamation-triangle-fill';
      case 'high':
        return 'bi-arrow-up-circle-fill';
      case 'medium':
        return 'bi-dash-circle-fill';
      case 'low':
        return 'bi-arrow-down-circle-fill';
      default:
        return 'bi-circle-fill';
    }
  }

  private updateTaskInStorage(updatedTask: Task): void {
    const storedTasks = localStorage.getItem('taskboard/v1/tasks');
    if (storedTasks) {
      const tasks: Task[] = JSON.parse(storedTasks);
      const taskIndex = tasks.findIndex(t => t.id === this.taskDetails!.id);
      if (taskIndex > -1) {
        tasks[taskIndex] = updatedTask;
        localStorage.setItem('taskboard/v1/tasks', JSON.stringify(tasks));
        this.taskDetails = updatedTask;
        // Emit the updated task for parent components
        this.taskUpdated.emit(updatedTask);
      }
    }
  }

  deleteTask(): void {
    if (!this.taskId) return;

    Swal.fire({
      title: 'Are you sure?',
      text: 'You won\'t be able to revert this!',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // Remove task from localStorage
        const storedTasks = localStorage.getItem('taskboard/v1/tasks');
        if (storedTasks) {
          const tasks: Task[] = JSON.parse(storedTasks);
          const updatedTasks = tasks.filter(task => task.id !== this.taskId);

          // Update localStorage
          localStorage.setItem('taskboard/v1/tasks', JSON.stringify(updatedTasks));
        }

        // Navigate back to the task board
        this.router.navigate(['/board']);
        Swal.fire('Deleted!', 'Task deleted successfully!', 'success');
      }
    });
  }

}
