import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Task, User } from '../models/task.interfaces';
import { TaskStatus, TaskPriority } from '../models/task.enums';
import { ToastrService } from 'ngx-toastr';
import { catchError, tap } from 'rxjs/operators';

const TASKS_KEY = 'taskboard/v1/tasks';
const USERS_KEY = 'taskboard/v1/users';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  private usersSubject = new BehaviorSubject<User[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public tasks$ = this.tasksSubject.asObservable();
  public users$ = this.usersSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  private http = inject(HttpClient);
  private toastr = inject(ToastrService);

  constructor() {
    // Initial loading holatini false qilamiz, chunki localStorage dan ma'lumotlar mavjud
    this.loadingSubject.next(false);
    this.loadTasksFromStorage();
    this.loadUsersFromStorage();
  }

  // ===== TASK OPERATIONS =====
  
  loadTasks(): Observable<Task[]> {
    // Agar localStorage da ma'lumotlar mavjud bo'lsa, loading ko'rsatmaslik
    const storedTasks = this.getTasksFromStorage();
    if (storedTasks.length > 0) {
      // Ma'lumotlar mavjud, loading ko'rsatmaslik
      this.tasksSubject.next(storedTasks);
      this.loadingSubject.next(false);
      return of(storedTasks);
    }
    
    // Ma'lumotlar yo'q, loading ko'rsatish
    this.loadingSubject.next(true);
    
    return this.http.get<Task[]>('/taskboard/v1/tasks').pipe(
      tap(tasks => {
        this.tasksSubject.next(Array.isArray(tasks) ? tasks : []);
        this.saveTasksToStorage(tasks);
        // Loading holatini darhol tugatish
        this.loadingSubject.next(false);
      }),
      catchError(() => {
        const storedTasks = this.getTasksFromStorage();
        this.tasksSubject.next(storedTasks);
        // Error holatida ham loading darhol tugatish
        this.loadingSubject.next(false);
        return of(storedTasks);
      })
    );
  }

  addTask(task: Task): Observable<Task> {
    const currentTasks = this.tasksSubject.value;
    const newTasks = [task, ...currentTasks];
    
    this.tasksSubject.next(newTasks);
    this.saveTasksToStorage(newTasks);
    
    this.toastr.success(`Task "${task.title}" added successfully`, 'Task Added');
    return of(task);
  }

  updateTask(updatedTask: Task): Observable<Task> {
    const currentTasks = this.tasksSubject.value;
    const newTasks = currentTasks.map(task => 
      task.id === updatedTask.id ? { ...task, ...updatedTask, updated_at: new Date().toISOString() } : task
    );
    
    this.tasksSubject.next(newTasks);
    this.saveTasksToStorage(newTasks);
    
    this.toastr.success(`Task "${updatedTask.title}" updated successfully`, 'Task Updated');
    return of(updatedTask);
  }

  deleteTask(taskId: string): Observable<string> {
    const currentTasks = this.tasksSubject.value;
    const taskToDelete = currentTasks.find(t => t.id === taskId);
    const newTasks = currentTasks.filter(task => task.id !== taskId);
    
    this.tasksSubject.next(newTasks);
    this.saveTasksToStorage(newTasks);
    
    if (taskToDelete) {
      this.toastr.success(`Task "${taskToDelete.title}" deleted successfully`, 'Task Deleted');
    }
    return of(taskId);
  }

  bulkDeleteTasks(taskIds: string[]): Observable<string[]> {
    const currentTasks = this.tasksSubject.value;
    const newTasks = currentTasks.filter(task => !taskIds.includes(task.id));
    
    this.tasksSubject.next(newTasks);
    this.saveTasksToStorage(newTasks);
    
    this.toastr.success(`${taskIds.length} tasks deleted successfully`, 'Bulk Delete');
    return of(taskIds);
  }

  bulkUpdateTasks(taskIds: string[], updates: Partial<Task>): Observable<Task[]> {
    const currentTasks = this.tasksSubject.value;
    const updatedTasks = currentTasks.map(task => 
      taskIds.includes(task.id) 
        ? { ...task, ...updates, updated_at: new Date().toISOString() }
        : task
    );
    
    this.tasksSubject.next(updatedTasks);
    this.saveTasksToStorage(updatedTasks);
    
    const changedTasks = updatedTasks.filter(task => taskIds.includes(task.id));
    this.toastr.success(`${taskIds.length} tasks updated successfully`, 'Bulk Update');
    return of(changedTasks);
  }

  // ===== USER OPERATIONS =====
  
  loadUsers(): Observable<User[]> {
    return this.http.get<User[]>('/taskboard/v1/users').pipe(
      tap(users => {
        this.usersSubject.next(Array.isArray(users) ? users : []);
        this.saveUsersToStorage(users);
      }),
      catchError(() => {
        const storedUsers = this.getUsersFromStorage();
        this.usersSubject.next(storedUsers);
        return of(storedUsers);
      })
    );
  }

  getUserById(userId: string): User | undefined {
    return this.usersSubject.value.find(user => user.id === userId);
  }

  // ===== STORAGE OPERATIONS =====
  
  private loadTasksFromStorage(): void {
    const tasks = this.getTasksFromStorage();
    this.tasksSubject.next(tasks);
  }

  private loadUsersFromStorage(): void {
    const users = this.getUsersFromStorage();
    this.usersSubject.next(users);
  }

  private getTasksFromStorage(): Task[] {
    try {
      const stored = localStorage.getItem(TASKS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading tasks from storage:', error);
      return [];
    }
  }

  private getUsersFromStorage(): User[] {
    try {
      const stored = localStorage.getItem(USERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading users from storage:', error);
      return [];
    }
  }

  private saveTasksToStorage(tasks: Task[]): void {
    try {
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks to storage:', error);
      this.toastr.error('Failed to save tasks to storage', 'Storage Error');
    }
  }

  private saveUsersToStorage(users: User[]): void {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Error saving users to storage:', error);
    }
  }

  // ===== UTILITY METHODS =====
  
  getTasksByStatus(status: TaskStatus): Task[] {
    return this.tasksSubject.value.filter(task => task.status === status);
  }

  getTasksByAssignee(assigneeId: string): Task[] {
    return this.tasksSubject.value.filter(task => task.assignee === assigneeId);
  }

  getTaskById(taskId: string): Observable<Task | null> {
    const task = this.tasksSubject.value.find(t => t.id === taskId);
    return of(task || null);
  }

  getOverdueTasks(): Task[] {
    const now = new Date();
    return this.tasksSubject.value.filter(task => {
      if (!task.due_date || task.status === TaskStatus.FINISHED) return false;
      return new Date(task.due_date) < now;
    });
  }

  getWIPCount(): number {
    return this.getTasksByStatus(TaskStatus.IN_PROGRESS).length;
  }

  clearAllTasks(): void {
    this.tasksSubject.next([]);
    localStorage.removeItem(TASKS_KEY);
    this.toastr.info('All tasks have been cleared', 'Data Cleared');
  }

  // ===== FILTERING AND SORTING =====
  
  filterTasks(filters: {
    title?: string;
    status?: string;
    priority?: string;
    assignee?: string;
    tags?: string;
  }): Task[] {
    let tasks = this.tasksSubject.value;
    
    if (filters.title) {
      tasks = tasks.filter(task => 
        task.title.toLowerCase().includes(filters.title!.toLowerCase())
      );
    }
    
    if (filters.status) {
      tasks = tasks.filter(task => task.status === filters.status);
    }
    
    if (filters.priority) {
      tasks = tasks.filter(task => task.priority === filters.priority);
    }
    
    if (filters.assignee) {
      tasks = tasks.filter(task => task.assignee === filters.assignee);
    }
    
    if (filters.tags) {
      tasks = tasks.filter(task => 
        task.tags?.some(tag => tag.toLowerCase().includes(filters.tags!.toLowerCase()))
      );
    }
    
    return tasks;
  }

  sortTasks(tasks: Task[], sortBy: keyof Task, sortDir: 'asc' | 'desc'): Task[] {
    return [...tasks].sort((a, b) => {
      const aValue = a[sortBy] ?? '';
      const bValue = b[sortBy] ?? '';
      
      if (aValue < bValue) return sortDir === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // ===== GETTER METHODS =====
  
  getCurrentTasks(): Task[] {
    return this.tasksSubject.value;
  }

  getCurrentUsers(): User[] {
    return this.usersSubject.value;
  }
}
