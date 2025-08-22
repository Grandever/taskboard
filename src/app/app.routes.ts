import { Routes } from '@angular/router';
import {TaskDetail} from './components/task-detail/task-detail';
import {TaskBoard} from './components/task-board/task-board';
import {TaskTable} from './components/task-table/task-table';

export const routes: Routes = [
  { path: '', redirectTo: '/board', pathMatch: 'full' }, // Default route
  { path: 'board', component: TaskBoard },
  { path: 'task/:id', component: TaskDetail },
  { path: 'table', component: TaskTable } 

];
