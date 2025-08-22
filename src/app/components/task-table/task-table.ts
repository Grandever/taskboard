// task-table.ts
import { NgForOf, NgClass, DatePipe, NgIf } from '@angular/common';
import { SkeletonComponent } from '../skeleton/skeleton';
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Paginator } from '../paginator/paginator'; // Adjust path as needed
import { StatusLabelPipe } from '../../pipes/status-label.pipe';
import { Task, User } from '../../models/task.interfaces';

@Component({
  selector: 'task-table',
  standalone: true,
  templateUrl: './task-table.html',
  styleUrls: ['./task-table.css'],
  imports: [NgForOf, NgClass, FormsModule, Paginator, StatusLabelPipe, DatePipe, NgIf, SkeletonComponent],
})
export class TaskTable implements OnInit {
  tasks: Task[] = [];
  pagedTasks: Task[] = [];
  filteredSortedTasks: Task[] = [];
  loading: boolean = true;
  pageSize: number = 10; // Matches itemsPerPage
  currentPage: number = 1;
  totalItems: number = 0; // Will be set based on tasks length
  itemsPerPage: number = 10;

  // URL-synced filters/state
  tab?: string;
  search?: string;
  priority?: string[]; // legacy global priority filter from URL (still supported)
  sortBy: string = 'updated_at';
  sortDir: 'asc' | 'desc' = 'desc';

  filters: { title?: string; status?: string; priority?: string; updated_at?: string; assignee?: string } = {};
  private debounceTimers: Partial<Record<keyof TaskTable['filters'], any>> = {};

  statusOptions: string[] = ['todo', 'in_progress', 'code_review', 'test_ready', 'finished'];
  priorityOptions: string[] = ['low', 'medium', 'high', 'urgent'];
  users: User[] = [];
  assigneeMap: Record<string, User> = {};
  readonly fallbackAvatar: string = 'data:image/png;base64,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';

  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.subscribeToQueryParams();
    this.loadTasks();
    this.loadUsers();
    // Ensure totalItems is always set
    this.totalItems = this.tasks.length;
  }

  loadTasks() {
    this.loading = true;
    // Try network first with query params so it appears in Network tab
    const params = this.buildQueryParams();
    this.http.get<Task[]>('/taskboard/v1/tasks', { params }).subscribe({
      next: (data) => {
        this.tasks = Array.isArray(data) ? data : [];
        this.totalItems = this.tasks.length;
        this.applyFilterSortAndPaginate();
        // Add delay to show skeleton for 1000ms
        setTimeout(() => {
          this.loading = false;
        }, 400);
      },
      error: () => {
        const storedTasks = localStorage.getItem('taskboard/v1/tasks');
        this.tasks = storedTasks ? JSON.parse(storedTasks) : [];
        this.totalItems = this.tasks.length;
        this.applyFilterSortAndPaginate();
        // Add delay to show skeleton for 1000ms
        setTimeout(() => {
          this.loading = false;
        }, 400);
      },
    });
  }

  private loadUsers() {
    this.http.get<User[]>('/taskboard/v1/users').subscribe((data) => {
      this.users = Array.isArray(data) ? data : [];
      this.assigneeMap = Object.fromEntries(this.users.map((u) => [u.id, u]));
    });
  }

  private buildQueryParams(): HttpParams {
    let params = new HttpParams()
      .set('sort', `${this.sortBy},${this.sortDir}`)
      .set('page', String(this.currentPage))
      .set('size', String(this.pageSize));

    if (this.tab) params = params.set('tab', this.tab);
    if (this.search) params = params.set('search', this.search);
    // Column filters
    if (this.filters.title) params = params.set('title', this.filters.title);
    if (this.filters.status) params = params.set('status', this.filters.status);
    if (this.filters.priority) params = params.set('priority', this.filters.priority);
    if (this.filters.updated_at) params = params.set('updated_at', this.filters.updated_at);
    if (this.filters.assignee) params = params.set('assignee', this.filters.assignee);
    // Legacy priority list support (kept if present)
    if (!this.filters.priority && this.priority && this.priority.length) {
      params = params.set('priority', this.priority.join(','));
    }
    return params;
  }

  private subscribeToQueryParams() {
    this.route.queryParamMap.subscribe((qp) => {
      const page = Number(qp.get('page'));
      const size = Number(qp.get('size'));
      this.currentPage = Number.isFinite(page) && page > 0 ? page : this.currentPage;
      this.pageSize = Number.isFinite(size) && size > 0 ? size : this.pageSize;
      this.itemsPerPage = this.pageSize;

      this.tab = qp.get('tab') ?? this.tab;
      this.search = qp.get('search') ?? this.search;

      // Column filters from URL
      const qpTitle = qp.get('title');
      const qpStatus = qp.get('status');
      const qpPriority = qp.get('priority');
      const qpUpdated = qp.get('updated_at');
      const qpAssignee = qp.get('assignee');
      if (qpTitle !== null) this.filters.title = qpTitle || undefined;
      if (qpStatus !== null) this.filters.status = qpStatus || undefined;
      if (qpPriority !== null) this.filters.priority = qpPriority || undefined;
      if (qpUpdated !== null) this.filters.updated_at = qpUpdated || undefined;
      if (qpAssignee !== null) this.filters.assignee = qpAssignee || undefined;

      // Legacy priority list support (only if not using column priority)
      if (!this.filters.priority) {
        const priorityList = qp.get('priority');
        this.priority = priorityList ? priorityList.split(',').filter(Boolean) : this.priority;
      }
      const sort = qp.get('sort');
      if (sort) {
        const [by, dir] = sort.split(',');
        if (by) this.sortBy = by;
        if (dir === 'asc' || dir === 'desc') this.sortDir = dir;
      }

      this.applyFilterSortAndPaginate();
    });
  }

  private syncUrl(extra?: Partial<Params>) {
    const params: Params = {
      tab: this.tab,
      search: this.search,
      // Column filters
      title: this.filters.title || undefined,
      status: this.filters.status || undefined,
      priority: this.filters.priority || (this.priority && this.priority.length ? this.priority.join(',') : undefined),
      updated_at: this.filters.updated_at || undefined,
      assignee: this.filters.assignee || undefined,
      sort: `${this.sortBy},${this.sortDir}`,
      page: this.currentPage,
      size: this.pageSize,
      ...extra,
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  updatePagedTasks() {
    this.totalItems = this.filteredSortedTasks.length;
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedTasks = this.filteredSortedTasks.slice(start, end);
  }

  private applyFilterSortAndPaginate() {
    // Filter
    const t = (s?: string) => (s ?? '').toLowerCase();
    const f = this.filters;
    this.filteredSortedTasks = this.tasks.filter((task) => {
      return (
        (!f.title || t(task.title).includes(t(f.title))) &&
        (!f.status || t(task.status) === t(f.status)) &&
        (!f.priority || t(task.priority) === t(f.priority)) &&
        (!f.assignee || (task.assignee || '') === f.assignee) &&
        (!f.updated_at || t(task.updated_at).includes(t(f.updated_at)))
      );
    });

    // Sort
    const dir = this.sortDir === 'asc' ? 1 : -1;
    const by = this.sortBy as keyof Task;
    this.filteredSortedTasks = [...this.filteredSortedTasks].sort((a, b) => {
      const av = (a[by] ?? '') as unknown as string;
      const bv = (b[by] ?? '') as unknown as string;
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });

    this.updatePagedTasks();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePagedTasks();
    this.loadTasks();
    this.syncUrl({ page: this.currentPage });
    console.log(`Sahifa o'zgardi: ${page}`);
  }

  onPageSizeChange(newPageSize: number): void {
    this.pageSize = newPageSize;
    this.itemsPerPage = newPageSize;
    this.currentPage = 1; 
    this.updatePagedTasks();
    this.loadTasks();
    this.syncUrl({ size: this.pageSize, page: this.currentPage });
    console.log(`Sahifa hajmi o'zgardi: ${newPageSize}`);
  }

  onAssigneeChange(task: Task, userId: string | undefined) {
    task.assignee = userId || undefined;
    // persist back to localStorage
    const key = 'taskboard/v1/tasks';
    const raw = localStorage.getItem(key);
    const arr: Task[] = raw ? JSON.parse(raw) : [];
    const idx = arr.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      arr[idx] = { ...arr[idx], assignee: task.assignee, updated_at: new Date().toISOString() };
      localStorage.setItem(key, JSON.stringify(arr));
    }
    this.applyFilterSortAndPaginate();
  }

  getAssignee(task: Task): User | undefined {
    const key = task.assignee;
    if (!key) return undefined;
   
    
    // Try fast lookup by id
    if (this.assigneeMap[key]) return this.assigneeMap[key];
    // Try lookup by username or full name if tasks store other identifiers
    const found = this.users.find(
      (u) => u.username === key || `${u.firstName} ${u.lastName}` === key
    );
    console.log(found);
    return found;
  }

  onAvatarError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== this.fallbackAvatar) {
      img.src = this.fallbackAvatar;
    }
  }

  onFiltersChanged() {
    this.currentPage = 1;
    // debounce filter apply (400ms)
    window.clearTimeout(this.debounceTimers.title);
    window.clearTimeout(this.debounceTimers.status);
    window.clearTimeout(this.debounceTimers.priority);
    window.clearTimeout(this.debounceTimers.updated_at);
    window.clearTimeout(this.debounceTimers.assignee);
    this.debounceTimers.title = window.setTimeout(() => {
      this.applyFilterSortAndPaginate();
      this.syncUrl({ page: this.currentPage });
      this.loadTasks();
    }, 400);
  }

  toggleSort(column: string) {
    if (this.sortBy === column) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDir = 'asc';
    }
    this.currentPage = 1;
    this.applyFilterSortAndPaginate();
    this.syncUrl({ sort: `${this.sortBy},${this.sortDir}`, page: this.currentPage });
    this.loadTasks();
  }

  getPriorityBadgeClass(priority: string): string {
    const p = (priority || '').toLowerCase();
    switch (p) {
      case 'urgent':
        return 'badge bg-danger';
      case 'high':
        return 'badge bg-warning text-dark';
      case 'medium':
        return 'badge bg-primary';
      case 'low':
      default:
        return 'badge bg-secondary';
    }
  }
}
