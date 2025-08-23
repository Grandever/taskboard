import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { Task } from '../models/task.interfaces';

export interface DeletedTask {
  task: Task;
  deletedAt: Date;
  timer: any;
}

@Injectable({
  providedIn: 'root'
})
export class RecycleBinService {
  private deletedTasksSubject = new BehaviorSubject<DeletedTask[]>([]);
  public deletedTasks$ = this.deletedTasksSubject.asObservable();

  private readonly UNDO_WINDOW_MS = 5000; // 5 seconds

  constructor() {}

  /**
   * Add a task to the recycle bin with a 5-second undo window
   */
  addToRecycleBin(task: Task): Observable<boolean> {
    return new Observable(observer => {
      const deletedTask: DeletedTask = {
        task,
        deletedAt: new Date(),
        timer: null
      };

      // Add to deleted tasks list
      const currentDeletedTasks = this.deletedTasksSubject.value;
      this.deletedTasksSubject.next([...currentDeletedTasks, deletedTask]);

      // Set timer to permanently delete after 5 seconds
      deletedTask.timer = setTimeout(() => {
        this.permanentlyDelete(task.id);
      }, this.UNDO_WINDOW_MS);

      observer.next(true);
      observer.complete();
    });
  }

  /**
   * Restore a task from the recycle bin
   */
  restoreTask(taskId: string): Observable<Task | null> {
    return new Observable(observer => {
      const currentDeletedTasks = this.deletedTasksSubject.value;
      const deletedTaskIndex = currentDeletedTasks.findIndex(dt => dt.task.id === taskId);

      if (deletedTaskIndex !== -1) {
        const deletedTask = currentDeletedTasks[deletedTaskIndex];
        
        // Clear the timer
        if (deletedTask.timer) {
          clearTimeout(deletedTask.timer);
        }

        // Remove from deleted tasks
        const updatedDeletedTasks = currentDeletedTasks.filter(dt => dt.task.id !== taskId);
        this.deletedTasksSubject.next(updatedDeletedTasks);

        observer.next(deletedTask.task);
      } else {
        observer.next(null);
      }
      
      observer.complete();
    });
  }

  /**
   * Permanently delete a task from the recycle bin
   */
  private permanentlyDelete(taskId: string): void {
    const currentDeletedTasks = this.deletedTasksSubject.value;
    const updatedDeletedTasks = currentDeletedTasks.filter(dt => dt.task.id !== taskId);
    this.deletedTasksSubject.next(updatedDeletedTasks);
  }

  /**
   * Get all currently deleted tasks
   */
  getDeletedTasks(): DeletedTask[] {
    return this.deletedTasksSubject.value;
  }

  /**
   * Check if a task is in the recycle bin
   */
  isTaskDeleted(taskId: string): boolean {
    return this.deletedTasksSubject.value.some(dt => dt.task.id === taskId);
  }

  /**
   * Get remaining time for undo (in milliseconds)
   */
  getRemainingTime(taskId: string): number {
    const deletedTask = this.deletedTasksSubject.value.find(dt => dt.task.id === taskId);
    if (!deletedTask) return 0;

    const elapsed = Date.now() - deletedTask.deletedAt.getTime();
    return Math.max(0, this.UNDO_WINDOW_MS - elapsed);
  }

  /**
   * Clear all deleted tasks
   */
  clearAll(): void {
    const currentDeletedTasks = this.deletedTasksSubject.value;
    
    // Clear all timers
    currentDeletedTasks.forEach(dt => {
      if (dt.timer) {
        clearTimeout(dt.timer);
      }
    });

    this.deletedTasksSubject.next([]);
  }

  /**
   * Clear recycle bin (alias for clearAll)
   */
  clearRecycleBin(): void {
    this.clearAll();
  }

  /**
   * Cleanup old items (compatibility method)
   */
  cleanupOldItems(): void {
    // This method is called for compatibility but not needed in the new implementation
    // since items are automatically cleaned up after 5 seconds
  }

  /**
   * Get recycle bin statistics
   */
  getRecycleBinStats(): {
    totalItems: number;
    undoAvailable: number;
    expiredItems: number;
    oldestItem: Date | null;
    newestItem: Date | null;
  } {
    const items = this.getDeletedTasks();
    const now = new Date();
    
    return {
      totalItems: items.length,
      undoAvailable: items.length, // All items in new implementation are undo-available
      expiredItems: 0, // No expired items in new implementation
      oldestItem: items.length > 0 ? new Date(Math.min(...items.map(item => new Date(item.deletedAt).getTime()))) : null,
      newestItem: items.length > 0 ? new Date(Math.max(...items.map(item => new Date(item.deletedAt).getTime()))) : null
    };
  }
}
