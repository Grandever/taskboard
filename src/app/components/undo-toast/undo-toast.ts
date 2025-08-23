import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-undo-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="undo-toast" [class.expiring]="remainingTime <= 1000">
      <div class="toast-content">
        <div class="toast-message">
          <i class="bi bi-trash me-2"></i>
          <span>{{ message }}</span>
        </div>
        <div class="toast-actions">
          <button 
            class="btn btn-sm btn-outline-light undo-btn" 
            (click)="onUndo.emit()"
            [disabled]="remainingTime <= 0">
            <i class="bi bi-arrow-counterclockwise me-1"></i>
            Undo ({{ remainingSeconds }}s)
          </button>
          <button 
            class="btn btn-sm btn-outline-light close-btn" 
            (click)="onClose.emit()">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          [style.width.%]="progressPercentage">
        </div>
      </div>
    </div>
  `,
  styles: [`
    .undo-toast {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 12px 16px;
      margin-bottom: 8px;
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
      min-width: 300px;
      max-width: 400px;
    }

    .undo-toast.expiring {
      border-color: var(--warning-500);
      box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
    }

    .toast-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .toast-message {
      display: flex;
      align-items: center;
      color: var(--text-primary);
      font-size: 14px;
      flex: 1;
    }

    .toast-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .undo-btn {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .undo-btn:hover:not(:disabled) {
      background: var(--primary-500);
      border-color: var(--primary-500);
      color: white;
    }

    .undo-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .close-btn {
      font-size: 12px;
      padding: 4px 6px;
      border-radius: 4px;
      min-width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      background: var(--neutral-200);
      border-color: var(--neutral-300);
    }

    .progress-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 3px;
      background: var(--neutral-200);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary-500), var(--warning-500));
      transition: width 0.1s linear;
    }

    .expiring .progress-fill {
      background: linear-gradient(90deg, var(--warning-500), var(--danger-500));
    }

    @media (max-width: 576px) {
      .undo-toast {
        min-width: 280px;
        max-width: 320px;
      }

      .toast-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .toast-actions {
        width: 100%;
        justify-content: space-between;
      }
    }
  `]
})
export class UndoToastComponent implements OnInit, OnDestroy {
  @Input() message: string = 'Task deleted';
  @Input() duration: number = 5000; // 5 seconds
  @Output() onUndo = new EventEmitter<void>();
  @Output() onClose = new EventEmitter<void>();

  remainingTime: number = 5000;
  remainingSeconds: number = 5;
  progressPercentage: number = 100;
  private timerSubscription?: Subscription;

  ngOnInit() {
    this.startTimer();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  private startTimer() {
    const intervalMs = 100; // Update every 100ms for smooth progress
    this.timerSubscription = interval(intervalMs).subscribe(() => {
      this.remainingTime -= intervalMs;
      this.remainingSeconds = Math.ceil(this.remainingTime / 1000);
      this.progressPercentage = (this.remainingTime / this.duration) * 100;

      if (this.remainingTime <= 0) {
        this.stopTimer();
        this.onClose.emit();
      }
    });
  }

  private stopTimer() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
  }
}
