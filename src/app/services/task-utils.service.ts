import { Injectable } from '@angular/core';
import { Task, User } from '../models/task.interfaces';
import { TaskStatus, TaskPriority } from '../models/task.enums';

@Injectable({
  providedIn: 'root'
})
export class TaskUtilsService {

  // ===== TASK VALIDATION =====
  
  validateTask(task: Partial<Task>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!task.title || task.title.trim().length === 0) {
      errors.push('Task title is required');
    } else if (task.title.length < 3) {
      errors.push('Task title must be at least 3 characters long');
    } else if (task.title.length > 120) {
      errors.push('Task title must be less than 120 characters');
    }

    if (task.points && task.points < 0) {
      errors.push('Task points cannot be negative');
    }

    if (task.tags) {
      const tagErrors = this.validateTags(task.tags);
      errors.push(...tagErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateTags(tags: string[]): string[] {
    const errors: string[] = [];

    if (!Array.isArray(tags)) {
      errors.push('Tags must be an array');
      return errors;
    }

    // Check for duplicates
    const uniqueTags = new Set(tags);
    if (uniqueTags.size !== tags.length) {
      errors.push('Tags must be unique');
    }

    // Check each tag
    tags.forEach((tag, index) => {
      if (typeof tag !== 'string') {
        errors.push(`Tag at index ${index} must be a string`);
      } else if (tag.length < 2) {
        errors.push(`Tag "${tag}" must be at least 2 characters long`);
      } else if (tag.length > 20) {
        errors.push(`Tag "${tag}" must be less than 20 characters`);
      }
    });

    return errors;
  }

  // ===== TASK STATUS UTILITIES =====
  
  isTaskOverdue(task: Task): boolean {
    if (!task.due_date || task.status === TaskStatus.FINISHED) {
      return false;
    }
    const due = new Date(task.due_date);
    const now = new Date();
    return due < now;
  }

  getDaysUntilDue(task: Task): number | null {
    if (!task.due_date) return null;
    
    const due = new Date(task.due_date);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  getStatusTransitions(currentStatus: TaskStatus): TaskStatus[] {
    const transitions: Record<TaskStatus, TaskStatus[]> = {
      [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS],
      [TaskStatus.IN_PROGRESS]: [TaskStatus.CODE_REVIEW, TaskStatus.TODO],
      [TaskStatus.CODE_REVIEW]: [TaskStatus.TEST_READY, TaskStatus.IN_PROGRESS],
      [TaskStatus.TEST_READY]: [TaskStatus.FINISHED, TaskStatus.CODE_REVIEW],
      [TaskStatus.FINISHED]: [TaskStatus.TEST_READY]
    };

    return transitions[currentStatus] || [];
  }

  canTransitionTo(fromStatus: TaskStatus, toStatus: TaskStatus): boolean {
    const transitions = this.getStatusTransitions(fromStatus);
    return transitions.includes(toStatus);
  }

  // ===== TASK FILTERING =====
  
  filterTasksByStatus(tasks: Task[], status: TaskStatus): Task[] {
    return tasks.filter(task => task.status === status);
  }

  filterTasksByAssignee(tasks: Task[], assigneeId: string): Task[] {
    return tasks.filter(task => task.assignee === assigneeId);
  }

  filterTasksByPriority(tasks: Task[], priority: TaskPriority): Task[] {
    return tasks.filter(task => task.priority === priority);
  }

  filterOverdueTasks(tasks: Task[]): Task[] {
    return tasks.filter(task => this.isTaskOverdue(task));
  }

  filterTasksByDateRange(tasks: Task[], fromDate: Date, toDate: Date): Task[] {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return taskDate >= fromDate && taskDate <= toDate;
    });
  }

  searchTasks(tasks: Task[], searchTerm: string): Task[] {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return tasks;

    return tasks.filter(task => {
      const titleMatch = task.title.toLowerCase().includes(term);
      const descriptionMatch = task.description?.toLowerCase().includes(term) || false;
      const tagMatch = task.tags?.some(tag => tag.toLowerCase().includes(term)) || false;
      
      return titleMatch || descriptionMatch || tagMatch;
    });
  }

  // ===== TASK SORTING =====
  
  sortTasks(tasks: Task[], sortBy: keyof Task, sortDir: 'asc' | 'desc' = 'asc'): Task[] {
    return [...tasks].sort((a, b) => {
      const aValue = a[sortBy] ?? '';
      const bValue = b[sortBy] ?? '';
      
      if (aValue < bValue) return sortDir === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  sortTasksByPriority(tasks: Task[], sortDir: 'asc' | 'desc' = 'desc'): Task[] {
    const priorityOrder = {
      [TaskPriority.URGENT]: 4,
      [TaskPriority.HIGH]: 3,
      [TaskPriority.MEDIUM]: 2,
      [TaskPriority.LOW]: 1
    };

    return [...tasks].sort((a, b) => {
      const aPriority = priorityOrder[a.priority] || 0;
      const bPriority = priorityOrder[b.priority] || 0;
      
      if (sortDir === 'desc') {
        return bPriority - aPriority;
      }
      return aPriority - bPriority;
    });
  }

  sortTasksByDueDate(tasks: Task[], sortDir: 'asc' | 'desc' = 'asc'): Task[] {
    return [...tasks].sort((a, b) => {
      const aDate = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
      const bDate = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
      
      if (sortDir === 'desc') {
        return bDate - aDate;
      }
      return aDate - bDate;
    });
  }

  // ===== TASK STATISTICS =====
  
  getTaskStatistics(tasks: Task[]) {
    const total = tasks.length;
    const byStatus = this.groupTasksByStatus(tasks);
    const byPriority = this.groupTasksByPriority(tasks);
    const overdue = this.filterOverdueTasks(tasks).length;
    const completed = byStatus[TaskStatus.FINISHED]?.length || 0;
    const inProgress = byStatus[TaskStatus.IN_PROGRESS]?.length || 0;

    return {
      total,
      byStatus,
      byPriority,
      overdue,
      completed,
      inProgress,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      overdueRate: total > 0 ? (overdue / total) * 100 : 0
    };
  }

  groupTasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
    return tasks.reduce((acc, task) => {
      if (!acc[task.status]) {
        acc[task.status] = [];
      }
      acc[task.status].push(task);
      return acc;
    }, {} as Record<TaskStatus, Task[]>);
  }

  groupTasksByPriority(tasks: Task[]): Record<TaskPriority, Task[]> {
    return tasks.reduce((acc, task) => {
      if (!acc[task.priority]) {
        acc[task.priority] = [];
      }
      acc[task.priority].push(task);
      return acc;
    }, {} as Record<TaskPriority, Task[]>);
  }

  groupTasksByAssignee(tasks: Task[]): Record<string, Task[]> {
    return tasks.reduce((acc, task) => {
      const assignee = task.assignee || 'unassigned';
      if (!acc[assignee]) {
        acc[assignee] = [];
      }
      acc[assignee].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
  }

  // ===== TASK GENERATION =====
  
  generateTaskId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  createEmptyTask(): Task {
    return {
      id: this.generateTaskId(),
      title: '',
      description: '',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      assignee: '',
      tags: [],
      due_date: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      points: 0
    };
  }

  // ===== USER UTILITIES =====
  
  getUserDisplayName(user: User): string {
    if (!user) return 'Unknown User';
    return `${user.firstName} ${user.lastName}`.trim() || user.username || 'Unknown User';
  }

  getUserInitials(user: User): string {
    if (!user) return '?';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || '?';
  }

  // ===== DATE UTILITIES =====
  
  formatRelativeDate(date: string | Date): string {
    const now = new Date();
    const targetDate = new Date(date);
    const diffTime = now.getTime() - targetDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays === -1) return 'Tomorrow';
    if (diffDays > 0) return `${diffDays} days ago`;
    if (diffDays < 0) return `In ${Math.abs(diffDays)} days`;

    return targetDate.toLocaleDateString();
  }

  isToday(date: string | Date): boolean {
    const today = new Date();
    const targetDate = new Date(date);
    return today.toDateString() === targetDate.toDateString();
  }

  isThisWeek(date: string | Date): boolean {
    const today = new Date();
    const targetDate = new Date(date);
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    
    return targetDate >= startOfWeek && targetDate <= endOfWeek;
  }

  // ===== PERFORMANCE UTILITIES =====
  
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: any;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}
