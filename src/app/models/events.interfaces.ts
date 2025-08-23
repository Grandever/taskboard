// Event-related interfaces

export interface TaskEvent {
  type: 'created' | 'updated' | 'deleted' | 'restored' | 'moved' | 'assigned' | 'status_changed' | 'priority_changed';
  taskId: string;
  userId?: string;
  timestamp: Date;
  data?: any;
  metadata?: Record<string, any>;
}

export interface UserEvent {
  type: 'login' | 'logout' | 'session_expired' | 'settings_changed' | 'profile_updated';
  userId: string;
  timestamp: Date;
  data?: any;
  metadata?: Record<string, any>;
}

export interface SystemEvent {
  type: 'backup_created' | 'data_exported' | 'data_imported' | 'migration_completed' | 'error_occurred';
  timestamp: Date;
  data?: any;
  metadata?: Record<string, any>;
}

export interface DragDropEvent {
  type: 'drag_start' | 'drag_over' | 'drop' | 'drag_end';
  taskId: string;
  sourceColumn?: string;
  targetColumn?: string;
  position?: number;
  timestamp: Date;
}

export interface FilterEvent {
  type: 'filter_applied' | 'filter_cleared' | 'filter_changed';
  filters: any;
  timestamp: Date;
  userId?: string;
}

export interface SearchEvent {
  type: 'search_performed' | 'search_cleared';
  query: string;
  results: number;
  timestamp: Date;
  userId?: string;
}

export interface PaginationEvent {
  type: 'page_changed' | 'page_size_changed';
  page: number;
  pageSize: number;
  totalItems: number;
  timestamp: Date;
  userId?: string;
}

export interface SortEvent {
  type: 'sort_changed';
  field: string;
  direction: 'asc' | 'desc';
  timestamp: Date;
  userId?: string;
}

export interface BulkActionEvent {
  type: 'bulk_select' | 'bulk_update' | 'bulk_delete' | 'bulk_restore';
  taskIds: string[];
  action: string;
  timestamp: Date;
  userId?: string;
  result?: any;
}

export interface UndoEvent {
  type: 'undo_available' | 'undo_used' | 'undo_expired';
  taskId: string;
  timestamp: Date;
  userId?: string;
  timeRemaining?: number;
}

export interface NotificationEvent {
  type: 'notification_sent' | 'notification_read' | 'notification_dismissed';
  notificationId: string;
  userId: string;
  timestamp: Date;
  data?: any;
}

export interface ThemeEvent {
  type: 'theme_changed';
  theme: 'light' | 'dark';
  timestamp: Date;
  userId?: string;
  source: 'manual' | 'system' | 'auto';
}

export interface PerformanceEvent {
  type: 'page_load' | 'component_render' | 'api_call' | 'memory_usage';
  duration: number;
  timestamp: Date;
  component?: string;
  metadata?: Record<string, any>;
}

export interface ErrorEvent {
  type: 'error_occurred' | 'error_recovered';
  error: Error;
  component?: string;
  timestamp: Date;
  userId?: string;
  context?: Record<string, any>;
}

export interface ExportEvent {
  type: 'export_started' | 'export_completed' | 'export_failed';
  format: string;
  taskCount: number;
  timestamp: Date;
  userId?: string;
  error?: string;
}

export interface ImportEvent {
  type: 'import_started' | 'import_completed' | 'import_failed';
  format: string;
  fileSize: number;
  importedCount: number;
  timestamp: Date;
  userId?: string;
  error?: string;
}

export interface BackupEvent {
  type: 'backup_created' | 'backup_restored' | 'backup_failed';
  backupId: string;
  size: number;
  timestamp: Date;
  userId?: string;
  error?: string;
}

// Event handler interfaces
export interface EventHandler<T> {
  handle(event: T): void;
}

export interface EventListener<T> {
  on(event: T): void;
}

export interface EventEmitter<T> {
  emit(event: T): void;
  subscribe(handler: EventHandler<T>): void;
  unsubscribe(handler: EventHandler<T>): void;
}
