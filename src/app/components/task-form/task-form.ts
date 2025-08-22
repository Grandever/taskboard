import {Component, ElementRef, EventEmitter, inject, Input, OnInit, Output, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { Task } from '../../models/task.interfaces';
import {NgClass} from '@angular/common';

declare var bootstrap: any; // Bootstrap's JavaScript dependency

@Component({
  selector: 'task-form',
  templateUrl: './task-form.html',
  imports: [
    ReactiveFormsModule,
    NgClass
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

  @ViewChild('modalElement', { static: false }) modalElement!: ElementRef;

  toastVisible: boolean = false;

  ngOnInit() {
    this.initializeForm();
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
