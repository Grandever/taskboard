import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, takeUntil } from 'rxjs';
import { Task } from '../models/task.interfaces';
import { AppSettings } from '../models/task.interfaces';
import { safeGetItem } from '../utils/storage.utils';

export interface StorageChangeEvent {
  key: string;
  newValue: any;
  oldValue: any;
  timestamp: Date;
  source: 'local' | 'external';
}

@Injectable({
  providedIn: 'root'
})
export class StorageSyncService implements OnDestroy {
  private storageChangeSubject = new BehaviorSubject<StorageChangeEvent | null>(null);
  private destroy$ = new Subject<void>();
  
  public storageChanges$ = this.storageChangeSubject.asObservable();
  
  // Track if changes are from local operations
  private isLocalChange = false;
  private sessionId = this.generateSessionId();

  constructor() {
    this.setupStorageListener();
    this.broadcastPresence();
  }

  private setupStorageListener(): void {
    // Listen for storage changes from other tabs
    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key && !this.isLocalChange) {
        this.handleExternalChange(event);
      }
    });

    // Listen for custom storage events (for same-origin)
    window.addEventListener('storage-change', ((event: Event) => {
      if (!this.isLocalChange) {
        this.handleCustomStorageEvent(event as CustomEvent);
      }
    }) as EventListener);
  }

  private handleExternalChange(event: StorageEvent): void {
    const storageEvent: StorageChangeEvent = {
      key: event.key!,
      newValue: event.newValue ? JSON.parse(event.newValue) : null,
      oldValue: event.oldValue ? JSON.parse(event.oldValue) : null,
      timestamp: new Date(),
      source: 'external'
    };

    this.storageChangeSubject.next(storageEvent);
    this.handleStorageUpdate(storageEvent);
  }

  private handleCustomStorageEvent(event: CustomEvent): void {
    const storageEvent: StorageChangeEvent = {
      key: event.detail.key,
      newValue: event.detail.newValue,
      oldValue: event.detail.oldValue,
      timestamp: new Date(),
      source: 'external'
    };

    this.storageChangeSubject.next(storageEvent);
    this.handleStorageUpdate(storageEvent);
  }

  private handleStorageUpdate(event: StorageChangeEvent): void {
    switch (event.key) {
      case 'taskboard:v1:tasks':
        this.syncTasks(event.newValue);
        break;
      case 'taskboard:v1:settings':
        this.syncSettings(event.newValue);
        break;
      case 'taskboard:v1:recycle_bin':
        this.syncRecycleBin(event.newValue);
        break;
      default:
        // Handle other keys if needed
        break;
    }
  }

  private syncTasks(newTasks: Task[]): void {
    // Emit event for task components to handle
    window.dispatchEvent(new CustomEvent('tasks-synced', {
      detail: { tasks: newTasks, source: 'storage-sync' }
    }));
  }

  private syncSettings(newSettings: AppSettings): void {
    // Emit event for settings components to handle
    window.dispatchEvent(new CustomEvent('settings-synced', {
      detail: { settings: newSettings, source: 'storage-sync' }
    }));
  }

  private syncRecycleBin(newRecycleBin: Task[]): void {
    // Emit event for recycle bin components to handle
    window.dispatchEvent(new CustomEvent('recycle-bin-synced', {
      detail: { recycleBin: newRecycleBin, source: 'storage-sync' }
    }));
  }

  // Notify other tabs about local changes
  notifyChange(key: string, newValue: any, oldValue: any): void {
    this.isLocalChange = true;
    
    // Dispatch custom event for same-origin tabs
    window.dispatchEvent(new CustomEvent('storage-change', {
      detail: { key, newValue, oldValue, timestamp: new Date() }
    }));

    // Reset flag after a short delay
    setTimeout(() => {
      this.isLocalChange = false;
    }, 100);
  }

  // Broadcast presence to other tabs
  private broadcastPresence(): void {
    const presenceKey = `taskboard:v1:presence:${this.sessionId}`;
    const presence = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    try {
      localStorage.setItem(presenceKey, JSON.stringify(presence));
      
      // Clean up old presence entries
      this.cleanupOldPresence();
    } catch (error) {
      console.warn('Could not broadcast presence:', error);
    }
  }

  // Get active tabs
  getActiveTabs(): Array<{ sessionId: string; timestamp: Date; url: string }> {
    const activeTabs: Array<{ sessionId: string; timestamp: Date; url: string }> = [];
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('taskboard:v1:presence:')) {
          const presence = safeGetItem(key);
          if (presence && new Date(presence.timestamp) > fiveMinutesAgo) {
            activeTabs.push({
              sessionId: presence.sessionId,
              timestamp: new Date(presence.timestamp),
              url: presence.url
            });
          }
        }
      }
    } catch (error) {
      console.warn('Could not get active tabs:', error);
    }

    return activeTabs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private cleanupOldPresence(): void {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('taskboard:v1:presence:')) {
          const presence = safeGetItem(key);
          if (presence && new Date(presence.timestamp) < fiveMinutesAgo) {
            localStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.warn('Could not cleanup old presence:', error);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Check if this is the only active tab
  isOnlyActiveTab(): boolean {
    const activeTabs = this.getActiveTabs();
    return activeTabs.length === 1 && activeTabs[0].sessionId === this.sessionId;
  }

  ngOnDestroy(): void {
    // Clean up presence when tab closes
    const presenceKey = `taskboard:v1:presence:${this.sessionId}`;
    try {
      localStorage.removeItem(presenceKey);
    } catch (error) {
      console.warn('Could not cleanup presence on destroy:', error);
    }

    this.destroy$.next();
    this.destroy$.complete();
  }
}
