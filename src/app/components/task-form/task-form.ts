import {Component, ElementRef, EventEmitter, inject, Input, OnInit, Output, ViewChild} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { Task, User } from '../../models/task.interfaces';
import {NgClass, NgForOf} from '@angular/common';

declare var bootstrap: any; // Bootstrap's JavaScript dependency

@Component({
  selector: 'task-form',
  templateUrl: './task-form.html',
  imports: [
    ReactiveFormsModule,
    NgClass,
    NgForOf
  ],
  styleUrls: ['./task-form.css']
})
export class TaskForm implements OnInit {
  modal!: any;

  @Input() taskToEdit: Task | null = null; // Input for task to edit
  @Output() taskAdded = new EventEmitter<Task>(); // Event to emit after adding/updating a task
  @Output() taskUpdated = new EventEmitter<Task>(); // New event for task update

  taskForm!: FormGroup;
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  users: User[] = [];
  readonly fallbackAvatar: string = 'data:image/png;base64,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';

  @ViewChild('modalElement', { static: false }) modalElement!: ElementRef;

  toastVisible: boolean = false;

  ngOnInit() {
    this.initializeForm();
    this.loadUsers();
  }

  private initializeForm() {
    this.taskForm = this.fb.group({
      id: [this.taskToEdit?.id || Date.now().toString(), [Validators.required]], // Auto-generate or use existing ID
      title: [this.taskToEdit?.title || '', [Validators.required]],
      description: [this.taskToEdit?.description || ''],
      status: [this.taskToEdit?.status || 'todo', [Validators.required]], // Default to 'todo'
      priority: [this.taskToEdit?.priority || 'medium', [Validators.required]], // Default priority
      assignee: [this.taskToEdit?.assignee || ''],
      tags: [this.taskToEdit?.tags || []],
      due_date: [this.taskToEdit?.due_date || ''],
      created_at: [this.taskToEdit?.created_at || new Date().toISOString(), [Validators.required]],
      updated_at: [this.taskToEdit?.updated_at || new Date().toISOString(), [Validators.required]],
      points: [this.taskToEdit?.points || 0, [Validators.min(0)]]
    });
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
    this.initializeForm();
    if (this.modalElement) {
      const bootstrapModal = new bootstrap.Modal(this.modalElement.nativeElement);
      bootstrapModal.show(); // Show modal
    }
  }

  closeModal() {
    if (this.modalElement) {
      const bootstrapModal = bootstrap.Modal.getInstance(this.modalElement.nativeElement);
      bootstrapModal.hide(); // Close modal
    }
  }

  onSubmit() {
    if (this.taskForm.valid) {
      const task = this.taskForm.value;

      // LocalStorage uchun
      let tasks: Task[] = JSON.parse(localStorage.getItem('taskboard/v1/tasks') || '[]');
      if (this.taskToEdit) {
        // Update
        tasks = tasks.map(t => t.id === task.id ? task : t);
        this.taskUpdated.emit(task);
      } else {
        // Add
        tasks.push(task);
        this.taskAdded.emit(task);
      }
      localStorage.setItem('taskboard/v1/tasks', JSON.stringify(tasks));

      this.showToast();
      this.closeModal();

      // Formani tozalash
      this.taskForm.reset();
      this.taskToEdit = null;
    } else {
      alert('Please complete the form correctly.');
    }
  }

  showToast() {
    this.toastVisible = true;
    setTimeout(() => this.hideToast(), 3000);
  }

  hideToast() {
    this.toastVisible = false;
  }
}
