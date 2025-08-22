import {Component, OnInit, ViewChild} from '@angular/core';
import {TaskBoard} from './components/task-board/task-board';
import {TaskForm} from './components/task-form/task-form';
import {RouterLink, RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [TaskBoard, TaskForm, RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App{

  @ViewChild(TaskForm) modal!: TaskForm;
}
