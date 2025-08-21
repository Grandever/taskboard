export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'code_review' | 'test_ready' | 'finished';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
  tags?: string[];
  due_date?: string;
  created_at: string;
  updated_at: string;
  points?: number;
}

export interface AppSettings {
  pageSize: 10 | 20 | 50;
  sort: {
    by: 'updated_at' | 'due_date' | 'priority' | 'title';
    dir: 'asc' | 'desc';
  };
  lastUsedFilters: {
    status?: 'todo' | 'in_progress' | 'code_review' | 'test_ready' | 'finished';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    assignee?: string;
    due_date_range?: { from: string; to: string };
    tags?: string[];
  };
}
