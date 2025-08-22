import {Component, ElementRef, EventEmitter, inject, Input, OnInit, Output, ViewChild, OnChanges, SimpleChanges} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { Task, User } from '../../models/task.interfaces';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import { ToastrService } from 'ngx-toastr';

declare var bootstrap: any; // Bootstrap's JavaScript dependency

@Component({
  selector: 'task-form',
  standalone: true,
  templateUrl: './task-form.html',
  imports: [
    ReactiveFormsModule,
    NgClass,
    NgForOf,
    NgIf
  ],
  styleUrls: ['./task-form.css']
})
export class TaskForm implements OnInit, OnChanges {
  modal!: any;

  @Input() taskToEdit: Task | null = null; // Input for task to edit
  @Output() taskAdded = new EventEmitter<Task>(); // Event to emit after adding/updating a task
  @Output() taskUpdated = new EventEmitter<Task>(); // New event for task update

  taskForm!: FormGroup;
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);

  users: User[] = [];
  readonly fallbackAvatar: string = 'data:image/png;base64,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';

  @ViewChild('modalElement', { static: false }) modalElement!: ElementRef;

  isSubmitting: boolean = false;

  ngOnInit() {
    this.initializeForm();
    this.loadUsers();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['taskToEdit'] && this.taskForm) {
      this.initializeForm();
    }
  }

  private initializeForm() {
    console.log('Initializing form, taskToEdit:', this.taskToEdit);
    
    this.taskForm = this.fb.group({
      id: [this.taskToEdit?.id || Date.now().toString(), [Validators.required]], // Auto-generate or use existing ID
      title: [this.taskToEdit?.title || '', [
        Validators.required, 
        Validators.minLength(3), 
        Validators.maxLength(120)
      ]],
      description: [this.taskToEdit?.description || ''],
      status: [this.taskToEdit?.status || 'todo', [Validators.required]], // Default to 'todo'
      priority: [this.taskToEdit?.priority || 'medium', [Validators.required]], // Default priority
      assignee: [this.taskToEdit?.assignee || ''],
      tags: [this.taskToEdit?.tags || [], [this.validateTags.bind(this)]],
      due_date: [this.taskToEdit?.due_date || ''],
      created_at: [this.taskToEdit?.created_at || new Date().toISOString(), [Validators.required]],
      updated_at: [this.taskToEdit?.updated_at || new Date().toISOString(), [Validators.required]],
      points: [this.taskToEdit?.points || 0, [Validators.min(0)]]
    });
    
    console.log('Form initialized, valid:', this.taskForm.valid);
    console.log('Form value:', this.taskForm.value);
  }

  // Tags validation - noyob va 2-20 belgilar
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

  // Check if task is overdue (only for non-finished tasks)
  isTaskOverdue(dueDate: string, status: string = 'todo'): boolean {
    if (!dueDate || status === 'finished') return false;
    const due = new Date(dueDate);
    const now = new Date();
    return due < now;
  }

  // Get overdue status for display
  getOverdueStatus(dueDate: string, status: string): string {
    if (!dueDate) return '';
    if (this.isTaskOverdue(dueDate, status)) {
      return 'Overdue';
    }
    return '';
  }

  private loadUsers() {
    this.http.get<User[]>('/taskboard/v1/users').subscribe((data) => {
      this.users = Array.isArray(data) ? data : [];
    });
  }

  getAvatarForAssignee(assigneeId?: string | null): string | null {
    if (!assigneeId) return null;
    const u = this.users.find(x => x.id === assigneeId);
    return u ? u.avatarUrl : this.fallbackAvatar;
  }

  openModal(): void {
    console.log('Opening modal');
    this.isSubmitting = false; // Reset submitting state
    
    // If editing, don't reset taskToEdit
    if (!this.taskToEdit) {
      this.initializeForm();
    }
    
    if (this.modalElement) {
      this.modal = new bootstrap.Modal(this.modalElement.nativeElement);
      this.modal.show();
      
      // If editing, initialize form with task data
      if (this.taskToEdit) {
        this.initializeForm();
      }
    }
  }

  closeModal() {
    this.isSubmitting = false; // Reset submitting state
    if (this.modalElement) {
      const bootstrapModal = bootstrap.Modal.getInstance(this.modalElement.nativeElement);
      bootstrapModal.hide(); // Close modal
    }
  }

  onSubmit(event?: Event) {
    // Prevent default form submission
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('onSubmit called, isSubmitting:', this.isSubmitting);
    
    // Additional safety check
    if (!this.taskForm) {
      console.error('Form not initialized');
      return false;
    }
    
    // Prevent multiple submissions
    if (this.isSubmitting) {
      console.log('Already submitting, returning early');
      return false;
    }

    // Double-check form validity
    if (!this.taskForm.valid) {
      console.log('Form is invalid, marking fields as touched');
      this.markFormGroupTouched();
      this.toastr.error('Please complete the form correctly.', 'Validation Error');
      return false;
    }

    console.log('Form is valid, starting submission');
    this.isSubmitting = true;
    
    const task = this.taskForm.value;
    console.log('Task data:', task);

    // Validate task data
    if (!task.title || task.title.trim().length === 0) {
      console.error('Task title is empty');
      this.toastr.error('Task title is required', 'Validation Error');
      this.isSubmitting = false;
      return false;
    }

    try {
      // LocalStorage uchun
      let tasks: Task[] = JSON.parse(localStorage.getItem('taskboard/v1/tasks') || '[]');
      
      if (this.taskToEdit) {
        console.log('Updating existing task');
        // Update - set updated_at to current timestamp
        task.updated_at = new Date().toISOString();
        tasks = tasks.map(t => t.id === task.id ? task : t);
        this.taskUpdated.emit(task);
      } else {
        console.log('Adding new task');
        // Add - new task to beginning
        tasks.unshift(task);
        this.taskAdded.emit(task);
      }
      
      localStorage.setItem('taskboard/v1/tasks', JSON.stringify(tasks));
      console.log('Task saved to localStorage');

      this.showToast();
      this.closeModal();

      // Formani tozalash
      this.taskForm.reset();
      this.taskToEdit = null;
      
      // console.log('Form submission completed successfully'); // Commented out to reduce console spam
          } catch (error) {
        console.error('Error saving task:', error);
        this.toastr.error('Error saving task. Please try again.', 'Error');
      } finally {
      console.log('Setting isSubmitting to false');
      this.isSubmitting = false;
    }
    
    return false; // Prevent form from submitting again
  }

  showToast() {
    this.toastr.success('Task saved successfully!', 'Success');
  }

  // hideToast() method removed - using toastr instead

  // Mark all form fields as touched to show validation errors
  private markFormGroupTouched() {
    Object.keys(this.taskForm.controls).forEach(key => {
      const control = this.taskForm.get(key);
      control?.markAsTouched();
    });
  }

}
