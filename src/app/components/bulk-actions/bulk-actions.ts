import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.interfaces';

@Component({
  selector: 'app-bulk-actions',
  templateUrl: './bulk-actions.html',
  styleUrls: ['./bulk-actions.css'],
  standalone: true,
  imports: [CommonModule]
})
export class BulkActionsComponent {
  @Input() selectedTasks: Set<string> = new Set();
  @Input() statusOptions: any[] = [];
  @Input() priorityOptions: any[] = [];
  @Input() showBulkActions: boolean = false;

  @Output() clearSelection = new EventEmitter<void>();
  @Output() bulkUpdateStatus = new EventEmitter<string>();
  @Output() bulkUpdatePriority = new EventEmitter<string>();
  @Output() bulkDelete = new EventEmitter<void>();

  onClearSelection(): void {
    this.clearSelection.emit();
  }

  onBulkUpdateStatus(status: string): void {
    this.bulkUpdateStatus.emit(status);
  }

  onBulkUpdatePriority(priority: string): void {
    this.bulkUpdatePriority.emit(priority);
  }

  onBulkDelete(): void {
    this.bulkDelete.emit();
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-danger';
      case 'high':
        return 'bg-warning';
      case 'medium':
        return 'bg-info';
      case 'low':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }
}
