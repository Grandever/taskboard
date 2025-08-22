import {Component, inject, OnInit} from '@angular/core';
import {NgForOf, NgIf, TitleCasePipe} from '@angular/common';
import {TaskForm} from '../task-form/task-form';
import {Router, RouterLink} from '@angular/router';
import { Task } from '../../models/task.interfaces'; // Qo'shildi



interface Column {
  name: string;
  title: string;
  icon: string;
  tasks: Task[];
}

@Component({
  selector: 'task-board',
  templateUrl: './task-board.html',
  imports: [
    TitleCasePipe,
    NgForOf,
    NgIf,
    TaskForm,
    RouterLink
  ],
  styleUrls: ['./task-board.css']
})
export class TaskBoard implements OnInit {
  columns: Column[] = []; // Dynamically constructed columns
  tasks: Task[] = []; // Flat list of tasks
  draggedTask: Task | null = null;
selectedTask: Task | null = null;

  private router= inject(Router)

  ngOnInit(): void {
    // Load tasks from LocalStorage
    const storedTasks = localStorage.getItem('taskboard/v1/tasks');
    if (storedTasks) {
      this.tasks = JSON.parse(storedTasks);
    }

    // Dynamically build columns based on grouped tasks
    this.generateColumns();
  }

  // Group tasks by status and generate columns dynamically
  private generateColumns(): void {
    const initialColumns = [
      { name: 'todo', title: 'To Do', icon: 'clipboard-list' },
      { name: 'in_progress', title: 'In Progress', icon: 'spinner' },
      { name: 'code_review', title: 'Code Review', icon: 'code' },
      { name: 'test_ready', title: 'Test Ready', icon: 'check-circle' },
      { name: 'finished', title: 'Finished', icon: 'check-circle' },
    ];

    this.columns = initialColumns.map((col) => ({
      ...col,
      tasks: this.tasks.filter((task) => task.status === col.name) // Filter tasks by status
    }));
  }

  // Save tasks to localStorage
  private saveTasksToLocalStorage(): void {
    localStorage.setItem('taskboard/v1/tasks', JSON.stringify(this.tasks));
  }

  

  onDragOver(event: DragEvent): void {
    event.preventDefault(); // Allow dropping
  }

  logTaskClick(task: Task): void {
    console.log('Task clicked:', task);
    this.router.navigate(['/task', task.id]); // Navigate to the task detail page
  }


  onDrop(columnName: string, event: DragEvent): void {
  event.preventDefault();
  if (this.draggedTask) {
    // Update task status
    this.draggedTask.status = columnName as Task['status']; // tipga mos

    // Update tasks in LocalStorage
    this.saveTasksToLocalStorage();

    this.draggedTask.updated_at = new Date().toISOString();
    // Regenerate columns to reflect the updated tasks
    this.generateColumns();
    this.draggedTask = null;
  }
}

  addTask(): void {
    const taskTitle = prompt('Enter task title:');
    if (taskTitle) {
      const newTask: Task = {
        id: Date.now().toString(),
        title: taskTitle,
        description: '',
        status: 'todo',
        priority: 'medium',
        assignee: '',
        tags: [],
        due_date: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        points: 0
      };

      this.tasks.push(newTask); // Add the new task
      this.saveTasksToLocalStorage(); // Save to LocalStorage
      this.generateColumns(); // Regenerate columns
    }
  }

  onDragStart(task: Task): void {
    this.draggedTask = task; // Start dragging the selected task
  }

  onDragEnd(): void {
    this.draggedTask = null; // Reset dragged task
  }

  editTask(task: Task): void {
    const newTitle = prompt('Edit task title:', task.title);
    if (newTitle !== null && newTitle.trim() !== '') {
      task.title = newTitle;
      task.updated_at = new Date().toISOString();
      this.saveTasksToLocalStorage();
      this.generateColumns(); // Update displayed columns
    }
  }

  clearData(): void {
    // Clear localStorage and reset state
    localStorage.removeItem('taskboard/v1/tasks');
    this.tasks = [];
    this.generateColumns();
  }

  onTaskAdded(task: Task): void {
    // LocalStorage dan qayta o'qish
    const storedTasks = localStorage.getItem('taskboard/v1/tasks');
    this.tasks = storedTasks ? JSON.parse(storedTasks) : [];
    this.generateColumns();
  }

  onTaskUpdated(task: Task): void {
    // LocalStorage dan qayta o'qish
    const storedTasks = localStorage.getItem('taskboard/v1/tasks');
    this.tasks = storedTasks ? JSON.parse(storedTasks) : [];
    this.generateColumns();
  }
}
