import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdvancedFilters, FilterOption, TagOption, AssigneeOption } from '../../models/filter.interfaces';
import { Task, User } from '../../models/task.interfaces';
import { TaskStatus, TaskPriority, TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from '../../models/task.enums';

@Component({
  selector: 'app-advanced-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './advanced-filter.html',
  styleUrls: ['./advanced-filter.css']
})
export class AdvancedFilterComponent implements OnInit {
  @Input() tasks: Task[] = [];
  @Input() users: User[] = [];
  @Input() filters: AdvancedFilters = {};
  @Output() filtersChanged = new EventEmitter<AdvancedFilters>();
  @Output() clearFilters = new EventEmitter<void>();

  // Panel state
  isCollapsed = true;
  activeFiltersCount = 0;

  // Filter options
  statusOptions = TASK_STATUS_OPTIONS;
  priorityOptions = TASK_PRIORITY_OPTIONS;
  assigneeOptions: AssigneeOption[] = [];
  tagOptions: TagOption[] = [];

  // Local filter state
  localFilters: AdvancedFilters = {};

  // Date presets
  datePresets = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'this-week' },
    { label: 'This Month', value: 'this-month' },
    { label: 'Next Week', value: 'next-week' },
    { label: 'Next Month', value: 'next-month' }
  ];

  ngOnInit() {
    this.initializeOptions();
    this.localFilters = { 
      ...this.filters,
      due_date_range: this.filters.due_date_range || { from: undefined, to: undefined }
    };
    this.updateActiveFiltersCount();
  }

  private initializeOptions() {
    // Initialize assignee options
    this.assigneeOptions = this.users.map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      avatar: user.avatarUrl,
      selected: this.filters.assignee?.includes(user.id) || false
    }));

    // Initialize tag options from tasks
    const allTags = new Set<string>();
    this.tasks.forEach(task => {
      if (task.tags) {
        task.tags.forEach(tag => allTags.add(tag));
      }
    });

    this.tagOptions = Array.from(allTags).map(tag => ({
      value: tag,
      label: tag,
      color: this.getTagColor(tag),
      selected: this.filters.tags?.includes(tag) || false
    }));
  }

  private getTagColor(tag: string): string {
    const colors = [
      '#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8',
      '#6f42c1', '#e83e8c', '#20c997', '#fd7e14', '#6c757d'
    ];
    const index = tag.length % colors.length;
    return colors[index];
  }

  togglePanel() {
    this.isCollapsed = !this.isCollapsed;
  }

  // Status filter methods
  toggleStatus(status: TaskStatus) {
    if (!this.localFilters.status) {
      this.localFilters.status = [];
    }
    
    const index = this.localFilters.status.indexOf(status);
    if (index > -1) {
      this.localFilters.status.splice(index, 1);
    } else {
      this.localFilters.status.push(status);
    }
    
    this.onFiltersChange();
  }

  isStatusSelected(status: TaskStatus): boolean {
    return this.localFilters.status?.includes(status) || false;
  }

  // Priority filter methods
  togglePriority(priority: TaskPriority) {
    if (!this.localFilters.priority) {
      this.localFilters.priority = [];
    }
    
    const index = this.localFilters.priority.indexOf(priority);
    if (index > -1) {
      this.localFilters.priority.splice(index, 1);
    } else {
      this.localFilters.priority.push(priority);
    }
    
    this.onFiltersChange();
  }

  isPrioritySelected(priority: TaskPriority): boolean {
    return this.localFilters.priority?.includes(priority) || false;
  }

  // Assignee filter methods
  toggleAssignee(assigneeId: string) {
    if (!this.localFilters.assignee) {
      this.localFilters.assignee = [];
    }
    
    const index = this.localFilters.assignee.indexOf(assigneeId);
    if (index > -1) {
      this.localFilters.assignee.splice(index, 1);
    } else {
      this.localFilters.assignee.push(assigneeId);
    }
    
    // Update option state
    const option = this.assigneeOptions.find(opt => opt.id === assigneeId);
    if (option) {
      option.selected = !option.selected;
    }
    
    this.onFiltersChange();
  }

  // Tag filter methods
  toggleTag(tag: string) {
    if (!this.localFilters.tags) {
      this.localFilters.tags = [];
    }
    
    const index = this.localFilters.tags.indexOf(tag);
    if (index > -1) {
      this.localFilters.tags.splice(index, 1);
    } else {
      this.localFilters.tags.push(tag);
    }
    
    // Update option state
    const option = this.tagOptions.find(opt => opt.value === tag);
    if (option) {
      option.selected = !option.selected;
    }
    
    this.onFiltersChange();
  }

  // Date range methods
  onDateRangeChange() {
    // Ensure due_date_range exists
    if (!this.localFilters.due_date_range) {
      this.localFilters.due_date_range = { from: undefined, to: undefined };
    }
    this.onFiltersChange();
  }

  setDatePreset(preset: string) {
    const today = new Date();
    let from: Date, to: Date;

    switch (preset) {
      case 'today':
        from = to = new Date(today);
        break;
      case 'this-week':
        from = new Date(today);
        from.setDate(today.getDate() - today.getDay());
        to = new Date(from);
        to.setDate(from.getDate() + 6);
        break;
      case 'this-month':
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'next-week':
        from = new Date(today);
        from.setDate(today.getDate() + (7 - today.getDay()));
        to = new Date(from);
        to.setDate(from.getDate() + 6);
        break;
      case 'next-month':
        from = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        to = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        break;
      default:
        return;
    }

    this.localFilters.due_date_range = {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0]
    };

    this.onFiltersChange();
  }

  // Overdue filter
  toggleOverdue() {
    this.localFilters.onlyOverdue = !this.localFilters.onlyOverdue;
    this.onFiltersChange();
  }

  // Main filter change handler
  onFiltersChange() {
    this.updateActiveFiltersCount();
    this.filtersChanged.emit({ ...this.localFilters });
  }

  private updateActiveFiltersCount() {
    let count = 0;
    
    if (this.localFilters.status?.length) count++;
    if (this.localFilters.priority?.length) count++;
    if (this.localFilters.assignee?.length) count++;
    if (this.localFilters.tags?.length) count++;
    if (this.localFilters.due_date_range?.from || this.localFilters.due_date_range?.to) count++;
    if (this.localFilters.onlyOverdue) count++;
    if (this.localFilters.search) count++;
    
    this.activeFiltersCount = count;
  }

  // Clear all filters
  onClearFilters() {
    this.localFilters = {
      due_date_range: { from: undefined, to: undefined }
    };
    
    // Reset option states
    this.assigneeOptions.forEach(opt => opt.selected = false);
    this.tagOptions.forEach(opt => opt.selected = false);
    
    this.updateActiveFiltersCount();
    this.clearFilters.emit();
  }

  // Get selected items count for display
  getSelectedStatusCount(): number {
    return this.localFilters.status?.length || 0;
  }

  getSelectedPriorityCount(): number {
    return this.localFilters.priority?.length || 0;
  }

  getSelectedAssigneeCount(): number {
    return this.localFilters.assignee?.length || 0;
  }

  getSelectedTagsCount(): number {
    return this.localFilters.tags?.length || 0;
  }

  // Get priority badge class
  getPriorityBadgeClass(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.URGENT:
        return 'badge bg-danger';
      case TaskPriority.HIGH:
        return 'badge bg-warning text-dark';
      case TaskPriority.MEDIUM:
        return 'badge bg-primary';
      case TaskPriority.LOW:
      default:
        return 'badge bg-secondary';
    }
  }
}
