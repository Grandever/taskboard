import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Task } from '../../models/task.interfaces';
import { TaskStatus } from '../../models/task.enums';

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  color: string;
  maxTasks?: number;
}

@Component({
  selector: 'kanban-view',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
    <div class="kanban-container">
      <!-- View Toggle -->
      <div class="view-toggle mb-3">
        <div class="btn-group" role="group">
          <button 
            type="button" 
            class="btn btn-outline-primary"
            [class.active]="viewMode === 'kanban'"
            (click)="setViewMode('kanban')">
            <i class="bi bi-kanban"></i> Kanban
          </button>
          <button 
            type="button" 
            class="btn btn-outline-primary"
            [class.active]="viewMode === 'table'"
            (click)="setViewMode('table')">
            <i class="bi bi-table"></i> Table
          </button>
        </div>
      </div>

      <!-- Kanban Board -->
      <div class="kanban-board" *ngIf="viewMode === 'kanban'">
        <div class="row">
          <div class="col-md-2" *ngFor="let column of kanbanColumns">
            <div class="kanban-column" [style.border-color]="column.color">
              <div class="column-header" [style.background-color]="column.color + '20'">
                <h6 class="column-title">{{ column.title }}</h6>
                <span class="task-count badge bg-secondary">{{ column.tasks.length }}</span>
                <span class="max-tasks" *ngIf="column.maxTasks">
                  / {{ column.maxTasks }}
                </span>
              </div>
              
              <!-- WIP Limit Warning -->
              <div class="wip-warning alert alert-warning alert-sm" 
                   *ngIf="column.maxTasks && column.tasks.length > column.maxTasks">
                <i class="bi bi-exclamation-triangle"></i>
                WIP Limit Exceeded ({{ column.tasks.length }}/{{ column.maxTasks }})
              </div>

              <div class="column-content"
                   cdkDropList
                   [cdkDropListData]="column.tasks"
                   [cdkDropListConnectedTo]="dropLists"
                   (cdkDropListDropped)="onDrop($event)">
                
                <div class="kanban-task" 
                     *ngFor="let task of column.tasks; let i = index"
                     cdkDrag
                     [cdkDragData]="task">
                  
                  <div class="task-header">
                    <span class="task-priority priority-{{ task.priority }}">{{ task.priority }}</span>
                    <div class="task-actions">
                      <button class="btn btn-sm btn-outline-secondary" 
                              (click)="editTask(task)"
                              title="Edit Task">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger" 
                              (click)="deleteTask(task)"
                              title="Delete Task">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                  
                  <div class="task-title">{{ task.title }}</div>
                  
                  <div class="task-meta">
                    <div class="assignee" *ngIf="task.assignee">
                      <i class="bi bi-person"></i> {{ task.assignee }}
                    </div>
                    <div class="due-date" *ngIf="task.due_date">
                      <i class="bi bi-calendar"></i> {{ formatDate(task.due_date) }}
                    </div>
                  </div>
                  
                  <div class="task-tags" *ngIf="task.tags && task.tags.length > 0">
                    <span class="badge bg-light text-dark me-1" 
                          *ngFor="let tag of task.tags">
                      {{ tag }}
                    </span>
                  </div>
                  
                  <!-- Overdue Warning -->
                  <div class="overdue-warning alert alert-danger alert-sm" 
                       *ngIf="isTaskOverdue(task.due_date, task.status)">
                    <i class="bi bi-exclamation-circle"></i> Overdue
                  </div>
                </div>
                
                <!-- Empty State -->
                <div class="empty-column" *ngIf="column.tasks.length === 0">
                  <i class="bi bi-inbox"></i>
                  <p>No tasks</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Table View -->
      <div class="table-view" *ngIf="viewMode === 'table'">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .kanban-container {
      padding: 1rem;
    }

    .view-toggle {
      text-align: center;
    }

    .btn-group .btn.active {
      background-color: #007bff;
      color: white;
    }

    .kanban-board {
      overflow-x: auto;
    }

    .kanban-column {
      border: 2px solid #e9ecef;
      border-radius: 8px;
      margin-bottom: 1rem;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .column-header {
      padding: 0.75rem;
      border-bottom: 1px solid #e9ecef;
      border-radius: 6px 6px 0 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .column-title {
      margin: 0;
      font-weight: 600;
      color: #495057;
    }

    .task-count {
      font-size: 0.75rem;
    }

    .max-tasks {
      color: #6c757d;
      font-size: 0.75rem;
    }

    .wip-warning {
      margin: 0.5rem;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }

    .column-content {
      min-height: 200px;
      padding: 0.5rem;
    }

    .kanban-task {
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      cursor: move;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .kanban-task:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      transform: translateY(-1px);
    }

    .kanban-task.cdk-drag-preview {
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
      transform: rotate(5deg);
    }

    .kanban-task.cdk-drag-placeholder {
      opacity: 0.3;
      border: 2px dashed #007bff;
    }

    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .task-priority {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .priority-low { background-color: #d4edda; color: #155724; }
    .priority-medium { background-color: #cce7ff; color: #004085; }
    .priority-high { background-color: #fff3cd; color: #856404; }
    .priority-urgent { background-color: #f8d7da; color: #721c24; }

    .task-actions {
      display: flex;
      gap: 0.25rem;
    }

    .task-actions .btn {
      padding: 0.125rem 0.25rem;
      font-size: 0.75rem;
    }

    .task-title {
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #212529;
      line-height: 1.3;
    }

    .task-meta {
      font-size: 0.75rem;
      color: #6c757d;
      margin-bottom: 0.5rem;
    }

    .task-meta > div {
      margin-bottom: 0.25rem;
    }

    .task-tags {
      margin-bottom: 0.5rem;
    }

    .task-tags .badge {
      font-size: 0.625rem;
    }

    .overdue-warning {
      margin: 0;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }

    .empty-column {
      text-align: center;
      color: #6c757d;
      padding: 2rem 1rem;
    }

    .empty-column i {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .empty-column p {
      margin: 0;
      font-size: 0.875rem;
    }

    .table-view {
      display: none;
    }

    /* Drag and Drop Styles */
    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .column-content.cdk-drop-list-dragging .kanban-task:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .kanban-column {
        margin-bottom: 0.5rem;
      }
      
      .column-content {
        min-height: 150px;
      }
      
      .kanban-task {
        padding: 0.5rem;
      }
    }
  `]
})
export class KanbanViewComponent implements OnInit, OnDestroy {
  @Input() tasks: Task[] = [];
  @Input() viewMode: 'kanban' | 'table' = 'kanban';
  @Output() viewModeChange = new EventEmitter<'kanban' | 'table'>();
  @Output() taskEdit = new EventEmitter<Task>();
  @Output() taskDelete = new EventEmitter<Task>();
  @Output() taskStatusChange = new EventEmitter<{task: Task, newStatus: TaskStatus}>();

  kanbanColumns: KanbanColumn[] = [];
  dropLists: any[] = [];

  ngOnInit(): void {
    this.initializeKanbanColumns();
    this.updateKanbanColumns();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  setViewMode(mode: 'kanban' | 'table'): void {
    this.viewMode = mode;
    this.viewModeChange.emit(mode);
  }

  initializeKanbanColumns(): void {
    this.kanbanColumns = [
              {
          id: TaskStatus.TODO,
        title: 'To Do',
        tasks: [],
        color: '#6c757d',
        maxTasks: undefined
      },
              {
          id: TaskStatus.IN_PROGRESS,
        title: 'In Progress',
        tasks: [],
        color: '#007bff',
        maxTasks: 5 // WIP limit
      },
              {
          id: TaskStatus.CODE_REVIEW,
        title: 'Code Review',
        tasks: [],
        color: '#ffc107',
        maxTasks: 3
      },
              {
          id: TaskStatus.TEST_READY,
        title: 'Test Ready',
        tasks: [],
        color: '#17a2b8',
        maxTasks: undefined
      },
      {
        id: TaskStatus.FINISHED,
        title: 'Finished',
        tasks: [],
        color: '#28a745',
        maxTasks: undefined
      }
    ];

    // Create drop list references
    this.dropLists = this.kanbanColumns.map(col => col.id);
  }

  updateKanbanColumns(): void {
    this.kanbanColumns.forEach(column => {
      column.tasks = this.tasks.filter(task => task.status === column.id);
    });
  }

  onDrop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      // Same column - reorder
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Different column - transfer
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Update task status
      const task = event.container.data[event.currentIndex];
      const newStatus = this.getStatusFromContainerId(event.container.id);
      
      if (newStatus && task.status !== newStatus) {
        this.taskStatusChange.emit({ task, newStatus });
      }
    }
  }

  getStatusFromContainerId(containerId: any): TaskStatus | null {
    const column = this.kanbanColumns.find(col => col.id === containerId);
    return column ? column.id : null;
  }

  editTask(task: Task): void {
    this.taskEdit.emit(task);
  }

  deleteTask(task: Task): void {
    this.taskDelete.emit(task);
  }

  isTaskOverdue(dueDate: string | undefined, status: TaskStatus): boolean {
    if (!dueDate || status === TaskStatus.FINISHED) {
      return false;
    }
    
    const due = new Date(dueDate);
    const now = new Date();
    return due < now;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  // Public method to refresh columns (called when tasks change)
  refreshColumns(): void {
    this.updateKanbanColumns();
  }

  // Get column statistics
  getColumnStats(): { [key: string]: { total: number; overdue: number; wipLimit: number | undefined } } {
    const stats: { [key: string]: { total: number; overdue: number; wipLimit: number | undefined } } = {};
    
    this.kanbanColumns.forEach(column => {
      const overdue = column.tasks.filter(task => 
        this.isTaskOverdue(task.due_date, task.status)
      ).length;
      
      stats[column.id] = {
        total: column.tasks.length,
        overdue,
        wipLimit: column.maxTasks
      };
    });
    
    return stats;
  }
}
