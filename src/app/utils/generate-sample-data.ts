// Utility to generate sample task data for localStorage
import { Task, User, UserRole, UserStatus } from '../models/task.interfaces';
import { TaskStatus, TaskPriority } from '../models/task.enums';

export interface SampleDataGenerator {
  generateTasks(count: number): Task[];
  generateUsers(count: number): User[];
  saveToLocalStorage(tasks: Task[], users: User[]): void;
}

export class TaskDataGenerator implements SampleDataGenerator {
  private taskTitles = [
    'Implement user authentication',
    'Fix navigation bug',
    'Add search functionality',
    'Optimize database queries',
    'Create responsive design',
    'Update API documentation',
    'Refactor legacy code',
    'Add unit tests',
    'Implement caching',
    'Fix memory leak',
    'Add error handling',
    'Update dependencies',
    'Create admin dashboard',
    'Implement file upload',
    'Add data validation',
    'Fix cross-browser issues',
    'Optimize images',
    'Add accessibility features',
    'Implement real-time updates',
    'Create backup system',
    'Add logging functionality',
    'Fix security vulnerabilities',
    'Implement rate limiting',
    'Add analytics tracking',
    'Create mobile app',
    'Fix performance issues',
    'Add multi-language support',
    'Implement payment system',
    'Create user profiles',
    'Add notification system'
  ];

  private descriptions = [
    'This task involves implementing a comprehensive solution for the specified feature.',
    'Critical bug fix that needs immediate attention to prevent user experience issues.',
    'Enhancement to improve the overall functionality and user satisfaction.',
    'Performance optimization to ensure smooth operation under high load.',
    'UI/UX improvement to make the interface more intuitive and user-friendly.',
    'Documentation update to help developers understand the system better.',
    'Code refactoring to improve maintainability and reduce technical debt.',
    'Quality assurance task to ensure code reliability and stability.',
    'Infrastructure improvement to enhance system performance and scalability.',
    'Security enhancement to protect user data and system integrity.'
  ];

  private statuses: Task['status'][] = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.CODE_REVIEW, TaskStatus.TEST_READY, TaskStatus.FINISHED];
  private priorities: Task['priority'][] = [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.URGENT];
  private tags = ['frontend', 'backend', 'database', 'api', 'ui', 'ux', 'testing', 'deployment', 'security', 'performance'];

  generateTasks(count: number): Task[] {
    const tasks: Task[] = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const createdDate = new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Random date within last 90 days
      const updatedDate = new Date(createdDate.getTime() + Math.random() * (now.getTime() - createdDate.getTime()));
      
      const task: Task = {
        id: `task_${Date.now()}_${i}`,
        title: this.getRandomTitle(),
        description: this.getRandomDescription(),
        status: this.getRandomStatus(),
        priority: this.getRandomPriority(),
        assignee: this.getRandomAssignee(),
        tags: this.getRandomTags(),
        due_date: this.getRandomDueDate(),
        created_at: createdDate.toISOString(),
        updated_at: updatedDate.toISOString(),
        points: this.getRandomPoints()
      };
      
      tasks.push(task);
    }
    
    return tasks;
  }

  generateUsers(count: number): User[] {
    const users: User[] = [];
    const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa', 'Tom', 'Emma', 'Alex', 'Maria', 'Chris', 'Anna', 'Paul', 'Sophie', 'Mark', 'Laura', 'James', 'Rachel', 'Daniel', 'Emily'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
    const now = new Date().toISOString();
    
    for (let i = 0; i < count; i++) {
      const user: User = {
        id: `user_${i + 1}`,
        username: `user${i + 1}`,
        firstName: firstNames[i % firstNames.length],
        lastName: lastNames[i % lastNames.length],
        email: `user${i + 1}@example.com`,
        avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=user${i + 1}`,
        role: UserRole.DEVELOPER,
        status: UserStatus.ACTIVE,
        created_at: now,
        updated_at: now
      };
      
      users.push(user);
    }
    
    return users;
  }

  saveToLocalStorage(tasks: Task[], users: User[]): void {
    try {
      localStorage.setItem('taskboard/v1/tasks', JSON.stringify(tasks));
      localStorage.setItem('taskboard/v1/users', JSON.stringify(users));
      console.log(`✅ Successfully saved ${tasks.length} tasks and ${users.length} users to localStorage`);
      console.log(`📊 Data summary:`);
      console.log(`   - Tasks: ${tasks.length}`);
      console.log(`   - Users: ${users.length}`);
      console.log(`   - Status distribution:`, this.getStatusDistribution(tasks));
      console.log(`   - Priority distribution:`, this.getPriorityDistribution(tasks));
    } catch (error) {
      console.error('❌ Error saving to localStorage:', error);
      console.log('💡 Try clearing some localStorage data or use a smaller dataset');
    }
  }

  private getRandomTitle(): string {
    const baseTitle = this.taskTitles[Math.floor(Math.random() * this.taskTitles.length)];
    const variations = [
      `${baseTitle} for mobile`,
      `${baseTitle} in production`,
      `${baseTitle} with new API`,
      `${baseTitle} for v2.0`,
      `${baseTitle} optimization`,
      `${baseTitle} enhancement`,
      `${baseTitle} refactoring`,
      `${baseTitle} implementation`,
      `${baseTitle} integration`,
      `${baseTitle} migration`
    ];
    return variations[Math.floor(Math.random() * variations.length)];
  }

  private getRandomDescription(): string {
    return this.descriptions[Math.floor(Math.random() * this.descriptions.length)];
  }

  private getRandomStatus(): Task['status'] {
    // Weight the distribution to have more realistic data
    const weights = [0.3, 0.25, 0.2, 0.15, 0.1]; // More todo, less finished
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < this.statuses.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return this.statuses[i];
      }
    }
    
    return this.statuses[0];
  }

  private getRandomPriority(): Task['priority'] {
    // Weight the distribution to have more realistic data
    const weights = [0.4, 0.3, 0.2, 0.1]; // More low/medium, less urgent
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < this.priorities.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return this.priorities[i];
      }
    }
    
    return this.priorities[0];
  }

  private getRandomAssignee(): string | undefined {
    // 30% chance of no assignee
    if (Math.random() < 0.3) {
      return undefined;
    }
    return `user_${Math.floor(Math.random() * 20) + 1}`;
  }

  private getRandomTags(): string[] {
    const numTags = Math.floor(Math.random() * 4) + 1; // 1-4 tags
    const shuffled = [...this.tags].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numTags);
  }

  private getRandomDueDate(): string | undefined {
    // 40% chance of no due date
    if (Math.random() < 0.4) {
      return undefined;
    }
    
    const now = new Date();
    const futureDate = new Date(now.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date within next 30 days
    return futureDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  private getRandomPoints(): number {
    const pointValues = [1, 2, 3, 5, 8, 13, 21];
    return pointValues[Math.floor(Math.random() * pointValues.length)];
  }

  public getStatusDistribution(tasks: Task[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    this.statuses.forEach(status => {
      distribution[status] = tasks.filter(task => task.status === status).length;
    });
    return distribution;
  }

  public getPriorityDistribution(tasks: Task[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    this.priorities.forEach(priority => {
      distribution[priority] = tasks.filter(task => task.priority === priority).length;
    });
    return distribution;
  }
}

// Function to generate and save sample data
export function generateSampleData(taskCount: number = 1000, userCount: number = 20): void {
  const generator = new TaskDataGenerator();
  
  console.log(`🚀 Generating ${taskCount} tasks and ${userCount} users...`);
  
  const tasks = generator.generateTasks(taskCount);
  const users = generator.generateUsers(userCount);
  
  generator.saveToLocalStorage(tasks, users);
}

// Function to clear all taskboard data
export function clearTaskboardData(): void {
  try {
    localStorage.removeItem('taskboard/v1/tasks');
    localStorage.removeItem('taskboard/v1/users');
    console.log('✅ Successfully cleared all taskboard data from localStorage');
  } catch (error) {
    console.error('❌ Error clearing localStorage:', error);
  }
}

// Function to get current data statistics
export function getDataStatistics(): void {
  try {
    const tasksData = localStorage.getItem('taskboard/v1/tasks');
    const usersData = localStorage.getItem('taskboard/v1/users');
    
    if (tasksData) {
      const tasks: Task[] = JSON.parse(tasksData);
      console.log(`📊 Current data statistics:`);
      console.log(`   - Tasks: ${tasks.length}`);
      
      const generator = new TaskDataGenerator();
      console.log(`   - Status distribution:`, generator.getStatusDistribution(tasks));
      console.log(`   - Priority distribution:`, generator.getPriorityDistribution(tasks));
    } else {
      console.log('📊 No task data found in localStorage');
    }
    
    if (usersData) {
      const users: User[] = JSON.parse(usersData);
      console.log(`   - Users: ${users.length}`);
    } else {
      console.log('📊 No user data found in localStorage');
    }
  } catch (error) {
    console.error('❌ Error reading localStorage:', error);
  }
}
