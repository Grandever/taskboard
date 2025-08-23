export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  CODE_REVIEW = 'code_review',
  TEST_READY = 'test_ready',
  FINISHED = 'finished'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface TaskStatusOption {
  value: TaskStatus;
  label: string;
  icon: string;
}

export interface TaskPriorityOption {
  value: TaskPriority;
  label: string;
  color: string;
}

export const TASK_STATUS_OPTIONS: TaskStatusOption[] = [
  { value: TaskStatus.TODO, label: 'To Do', icon: 'bi-list-task' },
  { value: TaskStatus.IN_PROGRESS, label: 'In Progress', icon: 'bi-play-circle' },
  { value: TaskStatus.CODE_REVIEW, label: 'Code Review', icon: 'bi-eye' },
  { value: TaskStatus.TEST_READY, label: 'Test Ready', icon: 'bi-check-circle' },
  { value: TaskStatus.FINISHED, label: 'Finished', icon: 'bi-check2-all' }
];

export const TASK_PRIORITY_OPTIONS: TaskPriorityOption[] = [
  { value: TaskPriority.LOW, label: 'Low', color: '#36b37e' },
  { value: TaskPriority.MEDIUM, label: 'Medium', color: '#ffab00' },
  { value: TaskPriority.HIGH, label: 'High', color: '#ff5630' },
  { value: TaskPriority.URGENT, label: 'Urgent', color: '#de350b' }
];

export function getTaskStatusLabel(status: TaskStatus): string {
  const option = TASK_STATUS_OPTIONS.find(opt => opt.value === status);
  return option ? option.label : status;
}

export function getTaskPriorityLabel(priority: TaskPriority): string {
  const option = TASK_PRIORITY_OPTIONS.find(opt => opt.value === priority);
  return option ? option.label : priority;
}

export function getTaskStatusIcon(status: TaskStatus): string {
  const option = TASK_STATUS_OPTIONS.find(opt => opt.value === status);
  return option ? option.icon : 'bi-question-circle';
}

export function getTaskPriorityColor(priority: TaskPriority): string {
  const option = TASK_PRIORITY_OPTIONS.find(opt => opt.value === priority);
  return option ? option.color : '#6c757d';
}
