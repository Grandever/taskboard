import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass, NgIf, NgForOf, DatePipe } from '@angular/common';
import { Task, User } from '../../../models/task.interfaces';
import { TaskStatus, TaskPriority } from '../../../models/task.enums';
import { StatusLabelPipe } from '../../../pipes/status-label.pipe';

@Component({
  selector: 'task-card',
  standalone: true,
  imports: [NgClass, NgIf, NgForOf, DatePipe, StatusLabelPipe],
  template: `
    <div class="task-card" 
         [ngClass]="getCardClasses()"
         (click)="onCardClick($event)"
         (keydown)="onCardKeydown($event)"
         tabindex="0"
         role="button"
         [attr.aria-label]="'Task: ' + task.title">
      
      <!-- Task Header -->
      <div class="task-header">
        <h6 class="task-title" [title]="task.title">
          {{ task.title }}
        </h6>
        <div class="task-priority">
          <span class="badge" [ngClass]="getPriorityBadgeClass()">
            <i class="bi" [ngClass]="getPriorityIcon()"></i>
            {{ task.priority }}
          </span>
        </div>
      </div>

      <!-- Task Description -->
      <div class="task-description" *ngIf="task.description">
        <p class="text-muted small">{{ task.description }}</p>
      </div>

      <!-- Task Meta -->
      <div class="task-meta">
        <!-- Assignee -->
        <div class="assignee" *ngIf="task.assignee">
          <img [src]="getAssigneeAvatar()" 
               [alt]="getAssigneeName()"
               class="assignee-avatar"
               (error)="onAvatarError($event)">
          <span class="assignee-name">{{ getAssigneeName() }}</span>
        </div>

        <!-- Tags -->
        <div class="tags" *ngIf="task.tags && task.tags.length > 0">
          <span class="tag" *ngFor="let tag of task.tags.slice(0, 2)">
            {{ tag }}
          </span>
          <span class="tag-more" *ngIf="task.tags.length > 2">
            +{{ task.tags.length - 2 }}
          </span>
        </div>

        <!-- Due Date -->
        <div class="due-date" *ngIf="task.due_date">
          <i class="bi bi-calendar"></i>
          <span [ngClass]="{'text-danger': isOverdue()}">
            {{ task.due_date | date:'shortDate' }}
          </span>
          <span class="overdue-badge" *ngIf="isOverdue()">Overdue</span>
        </div>

                 <!-- Points -->
         <div class="points" *ngIf="task.points && task.points > 0">
           <i class="bi bi-star-fill"></i>
           <span>{{ task.points }} pts</span>
         </div>

         <!-- Updated Date -->
         <div class="updated-date">
           <i class="bi bi-clock"></i>
           <span class="text-muted small">{{ task.updated_at | date:'MMM dd' }}</span>
         </div>
      </div>

      <!-- Task Actions -->
      <div class="task-actions" *ngIf="showActions">
        <button class="btn btn-sm btn-outline-primary" 
                (click)="onEdit($event)"
                title="Edit task">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" 
                (click)="onDelete($event)"
                title="Delete task">
          <i class="bi bi-trash"></i>
        </button>
      </div>

      <!-- Status Indicator -->
      <div class="status-indicator" [ngClass]="'status-' + task.status">
        <span class="status-dot"></span>
        <span class="status-label">{{ task.status | statusLabel }}</span>
      </div>
    </div>
  `,
  styleUrls: ['./task-card.css']
})
export class TaskCard {
  @Input() task!: Task;
  @Input() assignee?: User;
  @Input() showActions: boolean = true;
  @Input() compact: boolean = false;
  @Input() selectable: boolean = false;
  @Input() selected: boolean = false;

  @Output() cardClick = new EventEmitter<Task>();
  @Output() edit = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<Task>();
  @Output() statusChange = new EventEmitter<{task: Task, newStatus: TaskStatus}>();

  readonly fallbackAvatar = 'data:image/png;base64,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';

  // ===== EVENT HANDLERS =====
  
  onCardClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).closest('.btn')) {
      return; // Don't trigger card click when clicking buttons
    }
    this.cardClick.emit(this.task);
  }

  onCardKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.cardClick.emit(this.task);
    }
  }

  onEdit(event: MouseEvent): void {
    event.stopPropagation();
    this.edit.emit(this.task);
  }

  onDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.delete.emit(this.task);
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== this.fallbackAvatar) {
      img.src = this.fallbackAvatar;
    }
  }

  // ===== UTILITY METHODS =====
  
  getCardClasses(): string {
    const classes = ['task-card'];
    
    if (this.compact) classes.push('compact');
    if (this.selectable) classes.push('selectable');
    if (this.selected) classes.push('selected');
    if (this.isOverdue()) classes.push('overdue');
    
    return classes.join(' ');
  }

  getPriorityBadgeClass(): string {
    switch (this.task.priority) {
      case TaskPriority.URGENT: return 'priority-urgent';
      case TaskPriority.HIGH: return 'priority-high';
      case TaskPriority.MEDIUM: return 'priority-medium';
      case TaskPriority.LOW: return 'priority-low';
      default: return 'priority-default';
    }
  }

  getPriorityIcon(): string {
    switch (this.task.priority) {
      case TaskPriority.URGENT: return 'bi-exclamation-triangle-fill';
      case TaskPriority.HIGH: return 'bi-arrow-up-circle-fill';
      case TaskPriority.MEDIUM: return 'bi-dash-circle-fill';
      case TaskPriority.LOW: return 'bi-arrow-down-circle-fill';
      default: return 'bi-circle-fill';
    }
  }

  getAssigneeAvatar(): string {
    if (!this.task.assignee) return this.fallbackAvatar;
    
    if (this.assignee?.avatarUrl) {
      return this.assignee.avatarUrl;
    }
    
    return this.fallbackAvatar;
  }

  getAssigneeName(): string {
    if (!this.task.assignee) return 'Unassigned';
    
    if (this.assignee) {
      return `${this.assignee.firstName} ${this.assignee.lastName}`;
    }
    
    return this.task.assignee;
  }

  isOverdue(): boolean {
    if (!this.task.due_date || this.task.status === TaskStatus.FINISHED) {
      return false;
    }
    const due = new Date(this.task.due_date);
    const now = new Date();
    return due < now;
  }
}
