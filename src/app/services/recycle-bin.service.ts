import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Task } from '../models/task.interfaces';
import { safeGetItem, safeSetItem } from '../utils/storage.utils';

export interface RecycleItem {
  id: string;
  task: Task;
  deletedAt: Date;
  deletedBy?: string;
  undoAvailable: boolean;
  undoTimer?: number;
}

const RECYCLE_BIN_KEY = 'taskboard:v1:recycle-bin';
const MAX_RECYCLE_ITEMS = 100;
const UNDO_TIMEOUT = 5000; // 5 seconds

@Injectable({
  providedIn: 'root'
})
export class RecycleBinService {
  private recycleBinSubject = new BehaviorSubject<RecycleItem[]>([]);
  public recycleBin$ = this.recycleBinSubject.asObservable();

  constructor() {
    this.loadRecycleBin();
  }

  /**
   * Move task to recycle bin
   */
  moveToRecycleBin(task: Task, deletedBy?: string): void {
    const recycleItem: RecycleItem = {
      id: task.id,
      task: { ...task },
      deletedAt: new Date(),
      deletedBy,
      undoAvailable: true,
      undoTimer: UNDO_TIMEOUT
    };

    const currentBin = this.recycleBinSubject.value;
    
    // Remove if already exists
    const filteredBin = currentBin.filter(item => item.id !== task.id);
    
    // Add new item
    const newBin = [recycleItem, ...filteredBin];
    
    // Limit size
    if (newBin.length > MAX_RECYCLE_ITEMS) {
      newBin.splice(MAX_RECYCLE_ITEMS);
    }

    this.recycleBinSubject.next(newBin);
    this.saveRecycleBin(newBin);

    // Start undo timer
    this.startUndoTimer(recycleItem.id);
  }

  /**
   * Restore task from recycle bin
   */
  restoreTask(taskId: string): Task | null {
    const currentBin = this.recycleBinSubject.value;
    const itemIndex = currentBin.findIndex(item => item.id === taskId);
    
    if (itemIndex === -1) return null;

    const item = currentBin[itemIndex];
    const restoredTask = { ...item.task };

    // Remove from recycle bin
    currentBin.splice(itemIndex, 1);
    this.recycleBinSubject.next(currentBin);
    this.saveRecycleBin(currentBin);

    return restoredTask;
  }

  /**
   * Permanently delete task from recycle bin
   */
  permanentlyDelete(taskId: string): boolean {
    const currentBin = this.recycleBinSubject.value;
    const itemIndex = currentBin.findIndex(item => item.id === taskId);
    
    if (itemIndex === -1) return false;

    currentBin.splice(itemIndex, 1);
    this.recycleBinSubject.next(currentBin);
    this.saveRecycleBin(currentBin);

    return true;
  }

  /**
   * Clear entire recycle bin
   */
  clearRecycleBin(): void {
    this.recycleBinSubject.next([]);
    this.saveRecycleBin([]);
  }

  /**
   * Get recycle bin items
   */
  getRecycleBinItems(): RecycleItem[] {
    return this.recycleBinSubject.value;
  }

  /**
   * Get recycle bin count
   */
  getRecycleBinCount(): number {
    return this.recycleBinSubject.value.length;
  }

  /**
   * Check if task is in recycle bin
   */
  isTaskInRecycleBin(taskId: string): boolean {
    return this.recycleBinSubject.value.some(item => item.id === taskId);
  }

  /**
   * Get undo available items
   */
  getUndoAvailableItems(): RecycleItem[] {
    return this.recycleBinSubject.value.filter(item => item.undoAvailable);
  }

  /**
   * Start undo timer for an item
   */
  private startUndoTimer(taskId: string): void {
    timer(UNDO_TIMEOUT).subscribe(() => {
      const currentBin = this.recycleBinSubject.value;
      const itemIndex = currentBin.findIndex(item => item.id === taskId);
      
      if (itemIndex !== -1) {
        currentBin[itemIndex].undoAvailable = false;
        currentBin[itemIndex].undoTimer = 0;
        this.recycleBinSubject.next([...currentBin]);
        this.saveRecycleBin(currentBin);
      }
    });
  }

  /**
   * Extend undo timer for an item
   */
  extendUndoTimer(taskId: string, additionalTime: number = UNDO_TIMEOUT): void {
    const currentBin = this.recycleBinSubject.value;
    const itemIndex = currentBin.findIndex(item => item.id === taskId);
    
    if (itemIndex !== -1) {
      currentBin[itemIndex].undoAvailable = true;
      currentBin[itemIndex].undoTimer = additionalTime;
      this.recycleBinSubject.next([...currentBin]);
      this.saveRecycleBin(currentBin);
      
      // Restart timer
      this.startUndoTimer(taskId);
    }
  }

  /**
   * Get remaining undo time for an item
   */
  getRemainingUndoTime(taskId: string): number {
    const item = this.recycleBinSubject.value.find(item => item.id === taskId);
    return item?.undoTimer || 0;
  }

  /**
   * Export recycle bin to JSON
   */
  exportRecycleBin(): string {
    const recycleBin = this.getRecycleBinItems();
    return JSON.stringify(recycleBin, null, 2);
  }

  /**
   * Import recycle bin from JSON
   */
  importRecycleBin(jsonString: string): boolean {
    try {
      const imported = JSON.parse(jsonString);
      if (Array.isArray(imported)) {
        // Validate structure
        const isValid = imported.every(item => 
          item.id && item.task && item.deletedAt
        );
        
        if (isValid) {
          this.recycleBinSubject.next(imported);
          this.saveRecycleBin(imported);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to import recycle bin:', error);
      return false;
    }
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
    const items = this.getRecycleBinItems();
    const now = new Date();
    
    return {
      totalItems: items.length,
      undoAvailable: items.filter(item => item.undoAvailable).length,
      expiredItems: items.filter(item => !item.undoAvailable).length,
      oldestItem: items.length > 0 ? new Date(Math.min(...items.map(item => new Date(item.deletedAt).getTime()))) : null,
      newestItem: items.length > 0 ? new Date(Math.max(...items.map(item => new Date(item.deletedAt).getTime()))) : null
    };
  }

  /**
   * Auto-cleanup expired items
   */
  autoCleanup(): void {
    const currentBin = this.recycleBinSubject.value;
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // 24 hours ago
    
    const cleanedBin = currentBin.filter(item => {
      const deletedTime = new Date(item.deletedAt);
      return deletedTime > cutoffTime || item.undoAvailable;
    });

    if (cleanedBin.length !== currentBin.length) {
      this.recycleBinSubject.next(cleanedBin);
      this.saveRecycleBin(cleanedBin);
    }
  }

  /**
   * Cleanup old items (alias for autoCleanup)
   */
  cleanupOldItems(): void {
    this.autoCleanup();
  }

  /**
   * Get deleted tasks observable
   */
  get deletedTasks$(): Observable<Task[]> {
    return this.recycleBin$.pipe(
      map(items => items.map(item => item.task))
    );
  }

  private loadRecycleBin(): void {
    try {
      const stored = safeGetItem(RECYCLE_BIN_KEY);
      if (stored) {
        const recycleBin = JSON.parse(stored);
        this.recycleBinSubject.next(recycleBin);
      }
    } catch (error) {
      console.error('Error loading recycle bin:', error);
      this.recycleBinSubject.next([]);
    }
  }

  private saveRecycleBin(recycleBin: RecycleItem[]): void {
    try {
      safeSetItem(RECYCLE_BIN_KEY, JSON.stringify(recycleBin));
    } catch (error) {
      console.error('Error saving recycle bin:', error);
    }
  }
}
