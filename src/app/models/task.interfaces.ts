import { TaskStatus, TaskPriority } from './task.enums';
import { BaseEntity } from './common.interfaces';

export interface Task extends BaseEntity {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string; // user id
  tags?: string[];
  due_date?: string;
  points?: number;
  // Time tracking
  estimated_hours?: number;
  actual_hours?: number;
  time_spent?: number; // in minutes
  // Attachments and files
  attachments?: TaskAttachment[];
  // Recycle bin fields
  deleted_at?: string;
  original_id?: string;
  // Additional metadata
  sprint?: string;
  epic?: string;
  story_points?: number;
  complexity?: 'low' | 'medium' | 'high';
  // Comments and activity
  comments?: TaskComment[];
  activity_log?: TaskActivity[];
  // Dependencies
  dependencies?: string[]; // task IDs this task depends on
  blockers?: string[]; // task IDs blocking this task
  // Custom fields
  custom_fields?: Record<string, any>;
}

export interface TaskAttachment {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
  uploaded_at: string;
  uploaded_by?: string;
}

export interface TaskComment {
  id: string;
  content: string;
  author: string;
  created_at: string;
  updated_at?: string;
  edited?: boolean;
  attachments?: string[];
}

export interface TaskActivity {
  id: string;
  type: 'status_change' | 'priority_change' | 'assignment' | 'comment' | 'attachment' | 'time_log';
  description: string;
  user: string;
  timestamp: string;
  data?: Record<string, any>;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  defaultStatus: TaskStatus;
  defaultPriority: TaskPriority;
  defaultPoints?: number;
  defaultEstimatedHours?: number;
  defaultTags?: string[];
  customFields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  pageSize: 10 | 20 | 50;
  sort: {
    by: 'updated_at' | 'due_date' | 'priority' | 'title';
    dir: 'asc' | 'desc';
  };
  lastUsedFilters: {
    status?: TaskStatus;
    priority?: TaskPriority;
    assignee?: string;
    due_date_range?: { from?: string; to?: string };
    tags?: string[];
    search?: string;
    created_by?: string;
    updated_by?: string;
    estimated_hours_range?: { min: number; max: number };
    actual_hours_range?: { min: number; max: number };
    has_attachments?: boolean;
    is_overdue?: boolean;
    is_completed?: boolean;
    // Additional filter fields for table
    title?: string;
    updated_at?: string;
    due_date?: string;
    status_multi?: TaskStatus[];
    priority_multi?: TaskPriority[];
    assignee_multi?: string[];
    tags_multi?: string[];
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
    page_size?: number;
    tab?: string;
  };
  // UI Settings
  theme: 'light' | 'dark';
  language: 'uz' | 'en' | 'ru';
  compactMode: boolean;
  showCompletedTasks: boolean;
  showOverdueTasks: boolean;
  defaultView: 'board' | 'table' | 'calendar';
  
  // Notifications
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    email: boolean;
    taskDueReminder: number; // hours before due date
    dailyDigest: boolean;
    weeklyReport: boolean;
  };
  
  // Performance & Storage
  performance: {
    autoSaveDelay: number;
    maxRecycleItems: number;
    cacheExpiryHours: number;
    batchOperations: boolean;
    lazyLoading: boolean;
  };
  
  // Data Management
  dataManagement: {
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    maxBackups: number;
    exportFormat: 'json' | 'csv' | 'excel';
    importValidation: boolean;
  };
  
  // Security & Privacy
  security: {
    encryptSensitiveData: boolean;
    sessionTimeout: number; // minutes
    requireConfirmation: boolean;
    auditLog: boolean;
  };
  
  // Integration Settings
  integrations: {
    calendarSync: boolean;
    emailIntegration: boolean;
    slackNotifications: boolean;
    githubIntegration: boolean;
  };
}

export interface User extends BaseEntity {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  avatarUrl: string;
  role: UserRole;
  status: UserStatus;
  preferences?: UserPreferences;
  lastLogin?: string;
  timezone?: string;
  language?: string;
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  DEVELOPER = 'developer',
  TESTER = 'tester',
  VIEWER = 'viewer'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  display: DisplayPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  desktop: boolean;
  taskAssignments: boolean;
  dueDateReminders: boolean;
  statusChanges: boolean;
  mentions: boolean;
}

export interface DisplayPreferences {
  compactMode: boolean;
  showCompletedTasks: boolean;
  showOverdueTasks: boolean;
  defaultView: 'board' | 'table' | 'calendar';
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}
