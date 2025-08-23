# TaskBoard Models Documentation

This directory contains all the TypeScript interfaces, types, and enums used throughout the TaskBoard application.

## 📁 File Structure

```
models/
├── index.ts                 # Main export file
├── task.interfaces.ts       # Core task and user interfaces
├── task.enums.ts           # Task status and priority enums
├── filter.interfaces.ts    # Filter and search interfaces
├── common.interfaces.ts    # Common utility interfaces
├── ui.interfaces.ts        # UI component interfaces
├── events.interfaces.ts    # Event handling interfaces
└── README.md              # This documentation file
```

## 🎯 Core Models

### Task Interface
The main `Task` interface extends `BaseEntity` and includes:

```typescript
interface Task extends BaseEntity {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  tags?: string[];
  due_date?: string;
  points?: number;
  estimated_hours?: number;
  actual_hours?: number;
  time_spent?: number;
  attachments?: TaskAttachment[];
  sprint?: string;
  epic?: string;
  story_points?: number;
  complexity?: 'low' | 'medium' | 'high';
  comments?: TaskComment[];
  activity_log?: TaskActivity[];
  dependencies?: string[];
  blockers?: string[];
  custom_fields?: Record<string, any>;
}
```

### User Interface
The `User` interface extends `BaseEntity` and includes:

```typescript
interface User extends BaseEntity {
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
```

## 🔄 Enums

### TaskStatus
```typescript
enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  CODE_REVIEW = 'code_review',
  TEST_READY = 'test_ready',
  FINISHED = 'finished'
}
```

### TaskPriority
```typescript
enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}
```

### UserRole
```typescript
enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  DEVELOPER = 'developer',
  TESTER = 'tester',
  VIEWER = 'viewer'
}
```

## 🎨 UI Models

### ToastConfig
For toast notifications:
```typescript
interface ToastConfig {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: ToastAction[];
  timestamp: Date;
}
```

### FormConfig
For dynamic forms:
```typescript
interface FormConfig {
  fields: FormField[];
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
  loading?: boolean;
}
```

## 📊 Common Models

### BaseEntity
Base interface for all entities:
```typescript
interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}
```

### PaginationParams
For pagination:
```typescript
interface PaginationParams {
  page: number;
  size: number;
  total?: number;
}
```

### ApiResponse
For API responses:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationParams;
}
```

## 🎪 Event Models

### TaskEvent
For task-related events:
```typescript
interface TaskEvent {
  type: 'created' | 'updated' | 'deleted' | 'restored' | 'moved' | 'assigned' | 'status_changed' | 'priority_changed';
  taskId: string;
  userId?: string;
  timestamp: Date;
  data?: any;
  metadata?: Record<string, any>;
}
```

### DragDropEvent
For drag and drop operations:
```typescript
interface DragDropEvent {
  type: 'drag_start' | 'drag_over' | 'drop' | 'drag_end';
  taskId: string;
  sourceColumn?: string;
  targetColumn?: string;
  position?: number;
  timestamp: Date;
}
```

## 🔍 Filter Models

### AdvancedFilters
For complex filtering:
```typescript
interface AdvancedFilters {
  title?: string;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignee?: string[];
  due_date?: string;
  due_date_range?: { from?: string; to?: string };
  tags?: string[];
  onlyOverdue?: boolean;
  search?: string;
  description?: string;
}
```

## 📝 Usage Examples

### Importing Models
```typescript
// Import specific models
import { Task, User, TaskStatus } from '../models';

// Import from index (recommended)
import { Task, User, TaskStatus, AdvancedFilters } from '../models';

// Import all models
import * as Models from '../models';
```

### Creating a Task
```typescript
const newTask: Task = {
  id: generateId(),
  title: 'Implement user authentication',
  description: 'Add login and registration functionality',
  status: TaskStatus.TODO,
  priority: TaskPriority.HIGH,
  assignee: 'user123',
  tags: ['frontend', 'auth'],
  due_date: '2024-02-15',
  points: 8,
  estimated_hours: 16,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};
```

### Creating Form Configuration
```typescript
const taskFormConfig: FormConfig = {
  fields: [
    {
      name: 'title',
      label: 'Task Title',
      type: 'text',
      required: true,
      placeholder: 'Enter task title'
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: TASK_STATUS_OPTIONS.map(opt => ({
        value: opt.value,
        label: opt.label
      }))
    }
  ],
  submitLabel: 'Create Task',
  cancelLabel: 'Cancel'
};
```

## 🔧 Best Practices

1. **Always extend BaseEntity** for new entities
2. **Use enums** for fixed value sets
3. **Make optional fields explicit** with `?`
4. **Use descriptive names** for interfaces and properties
5. **Group related interfaces** in the same file
6. **Export from index.ts** for easier imports
7. **Use TypeScript strict mode** for better type safety
8. **Document complex interfaces** with JSDoc comments

## 🚀 Future Enhancements

- [ ] Add validation schemas using Zod
- [ ] Create model factories for testing
- [ ] Add model versioning for migrations
- [ ] Implement model serialization/deserialization
- [ ] Add model caching strategies
- [ ] Create model performance monitoring
