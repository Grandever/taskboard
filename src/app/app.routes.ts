import { Routes } from '@angular/router';
import {TaskDetail} from './components/task-detail/task-detail';
import {TaskBoard} from './components/task-board/task-board';
import {TaskTableComponent} from './components/task-table/task-table';
import {StorageDemoComponent} from './components/storage-demo/storage-demo';
import {TaskForm} from './components/task-form/task-form';

export const routes: Routes = [
  { path: '', redirectTo: '/board', pathMatch: 'full' }, // Default route
  { path: 'board', component: TaskBoard, data: { defaultQueryParams: 'sort=updated_at,desc&page=1&size=20' } },
  { path: 'task/:id', component: TaskDetail },
  { path: 'edit-task/:id', component: TaskForm }, // Edit task route
  { path: 'table', component: TaskTableComponent, data: { defaultQueryParams: 'sort=updated_at,desc&page=1&size=10' } },
  { path: 'storage-demo', component: StorageDemoComponent } // LocalStorage demo route
];
