import { TaskStatus, TaskPriority } from './task.enums';

export interface AdvancedFilters {
  // Basic filters (existing)
  title?: string;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignee?: string[];
  due_date?: string;
  
  // Advanced filters
  due_date_range?: {
    from?: string;
    to?: string;
  };
  tags?: string[];
  onlyOverdue?: boolean;
  
  // Search and text filters
  search?: string;
  description?: string;
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
  selected?: boolean;
}

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface TagOption {
  value: string;
  label: string;
  color?: string;
  selected?: boolean;
}

export interface AssigneeOption {
  id: string;
  name: string;
  avatar?: string;
  selected?: boolean;
}
