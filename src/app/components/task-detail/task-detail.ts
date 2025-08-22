import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import { Task } from '../../models/task.interfaces';
import {NgIf} from '@angular/common';
import {TaskForm} from '../task-form/task-form';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.html',
  imports: [
    RouterLink,
    NgIf,
    TaskForm
  ],
  styleUrls: ['./task-detail.css']
})
export class TaskDetail implements OnInit {
  taskId!: string | null;
  taskDetails: Task | null = null;

  @ViewChild(TaskForm) taskFormComponent!: TaskForm; // Reference to the TaskForm component

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    // Watch for route changes
    this.route.paramMap.subscribe((paramMap) => {
      this.taskId = paramMap.get('id');

      // Fetch and assign task details
      if (this.taskId) {
        const storedTasks = localStorage.getItem('taskboard/v1/tasks');
        if (storedTasks) {
          const tasks: Task[] = JSON.parse(storedTasks);
          this.taskDetails = tasks.find(task => task.id === this.taskId) || null;
        }
      }
    });
  }

  // Open the TaskForm component in edit mode
  editTask(): void {
    if (this.taskFormComponent) {
      this.taskFormComponent.taskToEdit = this.taskDetails; // Set the task to edit
      this.taskFormComponent.openModal(); // Open the modal
    }
  }

  onTaskUpdated(task: Task): void {
    // Update the task in localStorage
    const storedTasks = localStorage.getItem('taskboard/v1/tasks');
    if (storedTasks) {
      const tasks: Task[] = JSON.parse(storedTasks);
      const taskIndex = tasks.findIndex(t => t.id === task.id);
      if (taskIndex > -1) {
        // Yangilashdan oldin updated_at ni o'zgartiring
        const updatedTask = { ...tasks[taskIndex], ...task, updated_at: new Date().toISOString() };
        tasks[taskIndex] = updatedTask;
        localStorage.setItem('taskboard/v1/tasks', JSON.stringify(tasks));

        // Provide feedback to the user
        alert('Task updated successfully!');
        this.taskDetails = updatedTask; // Update current view
      }
    }
  }

  deleteTask(): void {
    if (!this.taskId) return;

    if (confirm('Are you sure you want to delete this task?')) {
      // Remove task from localStorage
      const storedTasks = localStorage.getItem('taskboard/v1/tasks');
      if (storedTasks) {
        const tasks: Task[] = JSON.parse(storedTasks);
        const updatedTasks = tasks.filter(task => task.id !== this.taskId);

        // Update localStorage
        localStorage.setItem('taskboard/v1/tasks', JSON.stringify(updatedTasks));
      }

      // Navigate back to the task board
      this.router.navigate(['/board']);
      alert('Task deleted successfully!');
    }
  }

}
