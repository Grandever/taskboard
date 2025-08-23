// UI-related interfaces

export interface ToastConfig {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: ToastAction[];
  timestamp: Date;
}

export interface ToastAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger' | 'success';
}

export interface ModalConfig {
  id: string;
  title: string;
  content: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  backdrop?: boolean | 'static';
  keyboard?: boolean;
  actions?: ModalAction[];
  data?: any;
}

export interface ModalAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: boolean;
}

export interface DropdownOption {
  value: string | number;
  label: string;
  icon?: string;
  disabled?: boolean;
  divider?: boolean;
  action?: () => void;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => string;
}

export interface TableConfig {
  columns: TableColumn[];
  sortable: boolean;
  filterable: boolean;
  selectable: boolean;
  pagination: boolean;
  pageSize: number;
  pageSizeOptions: number[];
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'date' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: DropdownOption[];
  validation?: ValidationRule[];
  disabled?: boolean;
  defaultValue?: any;
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'email' | 'min' | 'max' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

export interface FormConfig {
  fields: FormField[];
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  url?: string;
  active?: boolean;
  icon?: string;
}

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  badge?: number | string;
  content?: any;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  url?: string;
  children?: SidebarItem[];
  badge?: number | string;
  disabled?: boolean;
  expanded?: boolean;
}

export interface ThemeConfig {
  name: string;
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  light: string;
  dark: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  shadow: string;
}

export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

export interface ResponsiveBreakpoint {
  name: string;
  minWidth: number;
  maxWidth?: number;
}

export interface LoadingState {
  loading: boolean;
  message?: string;
  progress?: number;
  indeterminate?: boolean;
}

export interface ErrorState {
  hasError: boolean;
  error?: Error;
  message?: string;
  retryAction?: () => void;
}
