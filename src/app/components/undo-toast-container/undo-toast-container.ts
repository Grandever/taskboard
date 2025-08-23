import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UndoToastComponent } from '../undo-toast/undo-toast';
import { RecycleBinService, DeletedTask } from '../../services/recycle-bin.service';
import { TaskService } from '../../services/task.service';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';

interface ToastItem {
  id: string;
  task: DeletedTask;
  message: string;
}

@Component({
  selector: 'app-undo-toast-container',
  standalone: true,
  imports: [CommonModule, UndoToastComponent],
  template: `
    <div class="undo-toast-container" *ngIf="toasts.length > 0">
      <app-undo-toast
        *ngFor="let toast of toasts"
        [message]="toast.message"
        [duration]="5000"
        (onUndo)="undoTask(toast.id)"
        (onClose)="removeToast(toast.id)">
      </app-undo-toast>
    </div>
  `,
  styles: [`
    .undo-toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 400px;
    }

    @media (max-width: 576px) {
      .undo-toast-container {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
      }
    }
  `]
})
export class UndoToastContainerComponent implements OnInit, OnDestroy {
  toasts: ToastItem[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private recycleBinService: RecycleBinService,
    private taskService: TaskService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    // Listen for new deleted tasks
    this.recycleBinService.deletedTasks$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(deletedTasks => {
      // Find new tasks that aren't in our toasts yet
      deletedTasks.forEach(deletedTask => {
        if (!this.toasts.find(t => t.id === deletedTask.task.id)) {
          this.addToast(deletedTask);
        }
      });

      // Remove toasts for tasks that are no longer in recycle bin
      this.toasts = this.toasts.filter(toast => 
        deletedTasks.some(dt => dt.task.id === toast.id)
      );
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private addToast(deletedTask: DeletedTask) {
    const toast: ToastItem = {
      id: deletedTask.task.id,
      task: deletedTask,
      message: `"${deletedTask.task.title}" deleted - Click undo to restore`
    };

    this.toasts.push(toast);
  }

  undoTask(taskId: string) {
    this.recycleBinService.restoreTask(taskId).subscribe(restoredTask => {
      if (restoredTask) {
        // Add the task back to the task service
        this.taskService.addTask(restoredTask).subscribe(() => {
          this.toastr.success(
            `"${restoredTask.title}" restored successfully`,
            'Task Restored'
          );
        });
      }
    });
  }

  removeToast(taskId: string) {
    this.toasts = this.toasts.filter(t => t.id !== taskId);
  }
}
