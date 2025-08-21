import { Component, OnInit  } from '@angular/core';
import { TitleCasePipe} from '@angular/common';
import {TaskBoard} from './components/task-board/task-board';

@Component({
  selector: 'app-root',
  imports: [TitleCasePipe, TaskBoard],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App{

}
