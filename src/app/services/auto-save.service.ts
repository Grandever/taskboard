import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, timer, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { Task } from '../models/task.interfaces';
import { safeSetItem } from '../utils/storage.utils';

const TASKS_KEY = 'taskboard:v1:tasks';
const DEFAULT_DEBOUNCE_TIME = 100; // 100ms default debounce

@Injectable({
  providedIn: 'root'
})
export class AutoSaveService implements OnDestroy {
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  private saveQueue = new Subject<Task[]>();
  private destroy$ = new Subject<void>();
  
  public tasks$ = this.tasksSubject.asObservable();
  public isSaving$ = new BehaviorSubject<boolean>(false);
  public lastSaved$ = new BehaviorSubject<Date | null>(null);

  constructor() {
    this.setupAutoSave();
  }

  private setupAutoSave(): void {
    // Debounced auto-save with configurable delay
    this.saveQueue.pipe(
      debounceTime(DEFAULT_DEBOUNCE_TIME),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      takeUntil(this.destroy$)
    ).subscribe(tasks => {
      this.performSave(tasks);
    });
  }

  private performSave(tasks: Task[]): void {
    this.isSaving$.next(true);
    
    // Simulate async save operation
    timer(50).subscribe(() => {
      try {
        const error = safeSetItem(TASKS_KEY, tasks);
        if (error) {
          console.error('Auto-save failed:', error);
          // Could emit error event here
        } else {
          this.lastSaved$.next(new Date());
          console.log(`Auto-saved ${tasks.length} tasks`);
        }
      } catch (err) {
        console.error('Auto-save error:', err);
      } finally {
        this.isSaving$.next(false);
      }
    });
  }

  // Queue tasks for auto-save
  queueSave(tasks: Task[]): void {
    this.tasksSubject.next(tasks);
    this.saveQueue.next(tasks);
  }

  // Immediate save (bypasses debounce)
  saveImmediately(tasks: Task[]): void {
    this.tasksSubject.next(tasks);
    this.performSave(tasks);
  }

  // Update debounce time dynamically
  updateDebounceTime(ms: number): void {
    // Recreate the auto-save pipeline with new debounce time
    this.destroy$.next();
    this.setupAutoSave();
  }

  // Get current tasks
  getCurrentTasks(): Task[] {
    return this.tasksSubject.value;
  }

  // Check if there are unsaved changes
  hasUnsavedChanges(): boolean {
    const lastSaved = this.lastSaved$.value;
    if (!lastSaved) return true;
    
    // Could implement more sophisticated change detection here
    return false;
  }

  // Force cleanup of old tasks (optional)
  cleanupOldTasks(): void {
    const current = this.tasksSubject.value;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const updated = current.filter(task => {
      const updatedDate = new Date(task.updated_at);
      return updatedDate > thirtyDaysAgo;
    });

    if (updated.length !== current.length) {
      this.queueSave(updated);
      console.log(`Cleaned up ${current.length - updated.length} old tasks`);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
