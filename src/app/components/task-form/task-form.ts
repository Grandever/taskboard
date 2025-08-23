import {Component, ElementRef, EventEmitter, inject, Input, OnInit, Output, ViewChild, OnChanges, SimpleChanges, OnDestroy} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { Task, User } from '../../models/task.interfaces';
import { TaskStatus, TaskPriority, TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from '../../models/task.enums';
import {NgForOf, NgIf} from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { FormValidatorDirective } from '../../directives/form-validator.directive';
import { TaskService } from '../../services/task.service';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

declare var bootstrap: any;

@Component({
  selector: 'task-form',
  standalone: true,
  templateUrl: './task-form.html',
  imports: [
    ReactiveFormsModule,
    NgForOf,
    NgIf,
    FormValidatorDirective
  ],
  styleUrls: ['./task-form.css']
})
export class TaskForm implements OnInit, OnChanges, OnDestroy {
  // ===== INPUT/OUTPUT =====
  @Input() taskToEdit: Task | null = null;
  @Output() taskAdded = new EventEmitter<Task>();
  @Output() taskUpdated = new EventEmitter<Task>();

  // ===== FORM PROPERTIES =====
  taskForm!: FormGroup;
  isSubmitting: boolean = false;
  isRouteMode: boolean = false;

  // ===== DATA =====
  users: User[] = [];

  // ===== CONSTANTS =====
  readonly fallbackAvatar: string = 'data:image/png;base64,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';
  readonly statusOptions = TASK_STATUS_OPTIONS;
  readonly priorityOptions = TASK_PRIORITY_OPTIONS;

  // ===== VIEWCHILD =====
  @ViewChild('modalElement', { static: false }) modalElement!: ElementRef;

  // ===== PRIVATE PROPERTIES =====
  private destroy$ = new Subject<void>();
  private modal: any;

  // ===== INJECTIONS =====
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);
  private taskService = inject(TaskService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit() {
    this.initializeForm();
    this.loadUsers();
    this.setupRouteParams();
    this.setupModalListeners();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['taskToEdit'] && this.taskForm) {
      this.initializeForm();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===== FORM INITIALIZATION =====
  
  private initializeForm(): void {
    this.taskForm = this.fb.group({
      id: [this.taskToEdit?.id || this.generateId(), [Validators.required]],
      title: [this.taskToEdit?.title || '', [
        Validators.required, 
        Validators.minLength(3), 
        Validators.maxLength(120)
      ]],
      description: [this.taskToEdit?.description || ''],
      status: [this.taskToEdit?.status || TaskStatus.TODO, [Validators.required]],
      priority: [this.taskToEdit?.priority || TaskPriority.MEDIUM, [Validators.required]],
      assignee: [this.taskToEdit?.assignee || ''],
      tags: [this.taskToEdit?.tags || [], [this.validateTags.bind(this)]],
      due_date: [this.taskToEdit?.due_date || ''],
      created_at: [this.taskToEdit?.created_at || new Date().toISOString(), [Validators.required]],
      updated_at: [this.taskToEdit?.updated_at || new Date().toISOString(), [Validators.required]],
      points: [this.taskToEdit?.points || 0, [Validators.min(0)]]
    });
  }

  private generateId(): string {
    return Date.now().toString();
  }

  // ===== VALIDATION =====
  
  private validateTags(control: any): {[key: string]: any} | null {
    const tags = control.value;
    if (!Array.isArray(tags)) {
      return { invalidTags: true };
    }

    // Check for duplicates
    const uniqueTags = new Set(tags);
    if (uniqueTags.size !== tags.length) {
      return { duplicateTags: true };
    }

    // Check each tag length
    for (const tag of tags) {
      if (typeof tag !== 'string' || tag.length < 2 || tag.length > 20) {
        return { invalidTagLength: true };
      }
    }

    return null;
  }

  // ===== DATA LOADING =====
  
  private loadUsers(): void {
    this.taskService.users$.pipe(takeUntil(this.destroy$)).subscribe(users => {
      this.users = users;
    });
  }

  // ===== MODAL OPERATIONS =====
  
  openModal(): void {
    this.isSubmitting = false;
    
    if (!this.taskToEdit) {
      this.initializeForm();
    }
    
    if (this.modalElement && typeof bootstrap !== 'undefined') {
      try {
        // Check if modal already exists
        let existingModal = bootstrap.Modal.getInstance(this.modalElement.nativeElement);
        if (existingModal) {
          existingModal.show();
        } else {
          this.modal = new bootstrap.Modal(this.modalElement.nativeElement, {
            backdrop: true,
            keyboard: true,
            focus: true
          });
          this.modal.show();
        }
        
        if (this.taskToEdit) {
          this.initializeForm();
        }
      } catch (error) {
        console.error('Error opening modal:', error);
        // Fallback: try to show modal without options
        try {
          this.modal = new bootstrap.Modal(this.modalElement.nativeElement);
          this.modal.show();
        } catch (fallbackError) {
          console.error('Fallback modal opening failed:', fallbackError);
        }
      }
    }
  }

  closeModal(): void {
    this.isSubmitting = false;
    if (this.modalElement && typeof bootstrap !== 'undefined') {
      try {
        const bootstrapModal = bootstrap.Modal.getInstance(this.modalElement.nativeElement);
        if (bootstrapModal) {
          bootstrapModal.hide();
        }
      } catch (error) {
        console.error('Error closing modal:', error);
      }
    }
  }

  // ===== FORM SUBMISSION =====
  
  onSubmit(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (!this.taskForm || this.isSubmitting) {
      return;
    }

    if (!this.taskForm.valid) {
      this.markFormGroupTouched();
      this.toastr.error('Please complete the form correctly.', 'Validation Error');
      return;
    }

    this.isSubmitting = true;
    const task = this.taskForm.value;

    if (!task.title || task.title.trim().length === 0) {
      this.toastr.error('Task title is required', 'Validation Error');
      this.isSubmitting = false;
      return;
    }

    try {
      if (this.taskToEdit) {
        this.updateExistingTask(task);
      } else {
        this.createNewTask(task);
      }
    } catch (error) {
      console.error('Error saving task:', error);
      this.toastr.error('Error saving task. Please try again.', 'Error');
    } finally {
      this.isSubmitting = false;
    }
  }

  private createNewTask(task: Task): void {
    this.taskService.addTask(task).subscribe(() => {
      this.taskAdded.emit(task);
      this.showSuccessToast();
      this.closeModal();
      this.resetForm();
    });
  }

  private updateExistingTask(task: Task): void {
    // Ensure updated_at is set to current time
    task.updated_at = new Date().toISOString();
    
    this.taskService.updateTask(task).subscribe(() => {
      this.taskUpdated.emit(task);
      this.showSuccessToast();
      this.closeModal();
      this.resetForm();
      // Navigate back to table if we came from there
      const returnUrl = this.route.snapshot.queryParams['returnUrl'];
      if (returnUrl) {
        this.router.navigateByUrl(returnUrl);
      } else {
        this.router.navigate(['/table']);
      }
    });
  }

  private resetForm(): void {
    this.taskForm.reset();
    this.taskToEdit = null;
  }

  private showSuccessToast(): void {
    this.toastr.success('Task saved successfully!', 'Success');
  }

  private markFormGroupTouched(): void {
    Object.keys(this.taskForm.controls).forEach(key => {
      const control = this.taskForm.get(key);
      control?.markAsTouched();
    });
  }

  // ===== UTILITY METHODS =====
  
  getAvatarForAssignee(assigneeId?: string | null): string | null {
    if (!assigneeId) return null;
    const user = this.users.find(x => x.id === assigneeId);
    return user ? user.avatarUrl : this.fallbackAvatar;
  }

  isTaskOverdue(dueDate: string, status: string = TaskStatus.TODO): boolean {
    if (!dueDate || status === TaskStatus.FINISHED) return false;
    const due = new Date(dueDate);
    const now = new Date();
    return due < now;
  }

  getOverdueStatus(dueDate: string, status: string): string {
    if (!dueDate) return '';
    return this.isTaskOverdue(dueDate, status) ? 'Overdue' : '';
  }

  goBack(): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
    } else {
      this.router.navigate(['/table']);
    }
  }

  // ===== ROUTE HANDLING =====
  
  private setupRouteParams(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const taskId = params['id'];
      if (taskId && !this.taskToEdit) {
        this.isRouteMode = true;
        this.loadTaskForEditing(taskId);
      }
    });
  }

  private loadTaskForEditing(taskId: string): void {
    this.taskService.getTaskById(taskId).subscribe({
      next: (task) => {
        if (task) {
          this.taskToEdit = task;
          this.initializeForm();
        } else {
          this.toastr.error('Task not found', 'Error');
          this.router.navigate(['/table']);
        }
      },
      error: (error) => {
        console.error('Error loading task:', error);
        this.toastr.error('Error loading task', 'Error');
        this.router.navigate(['/table']);
      }
    });
  }

  private setupModalListeners(): void {
    // Listen for Bootstrap modal events
    if (typeof document !== 'undefined') {
      document.addEventListener('DOMContentLoaded', () => {
        const modalElement = document.getElementById('exampleModalCenter');
        if (modalElement) {
          modalElement.addEventListener('show.bs.modal', () => {
            // Reset form when modal is shown
            this.taskToEdit = null;
            this.initializeForm();
          });
        }
      });
    }
  }
}
