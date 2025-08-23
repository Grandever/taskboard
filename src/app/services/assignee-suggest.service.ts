import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, switchMap, startWith } from 'rxjs/operators';
import { User } from '../models/task.interfaces';

export interface AssigneeSuggestion {
  user: User;
  score: number;
  reasons: string[];
  lastAssigned?: Date;
  taskCount: number;
  availability: 'available' | 'busy' | 'overloaded';
}

@Injectable({
  providedIn: 'root'
})
export class AssigneeSuggestService {
  private usersSubject = new BehaviorSubject<User[]>([]);
  private taskAssignmentsSubject = new BehaviorSubject<Map<string, number>>(new Map());
  private userWorkloadSubject = new BehaviorSubject<Map<string, number>>(new Map());

  public users$ = this.usersSubject.asObservable();
  public taskAssignments$ = this.taskAssignmentsSubject.asObservable();
  public userWorkload$ = this.userWorkloadSubject.asObservable();

  constructor() {
    this.loadUsers();
  }

  /**
   * Get smart assignee suggestions based on various factors
   */
  getAssigneeSuggestions(
    query: string = '',
    taskPriority?: string,
    taskTags?: string[],
    excludeUsers?: string[]
  ): Observable<AssigneeSuggestion[]> {
    return this.users$.pipe(
      map(users => {
        let filteredUsers = users;
        
        // Filter by query
        if (query) {
          filteredUsers = users.filter(user => 
            user.username.toLowerCase().includes(query.toLowerCase()) ||
            user.firstName.toLowerCase().includes(query.toLowerCase()) ||
            user.lastName.toLowerCase().includes(query.toLowerCase())
          );
        }

        // Exclude specific users
        if (excludeUsers && excludeUsers.length > 0) {
          filteredUsers = filteredUsers.filter(user => 
            !excludeUsers.includes(user.id)
          );
        }

        // Generate suggestions with scores
        return filteredUsers.map(user => this.generateSuggestion(user, taskPriority, taskTags));
      }),
      map(suggestions => suggestions.sort((a, b) => b.score - a.score))
    );
  }

  /**
   * Get assignee suggestions with debounced search
   */
  getDebouncedSuggestions(
    query$: Observable<string>,
    taskPriority?: string,
    taskTags?: string[],
    excludeUsers?: string[]
  ): Observable<AssigneeSuggestion[]> {
    return query$.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => this.getAssigneeSuggestions(query, taskPriority, taskTags, excludeUsers))
    );
  }

  /**
   * Get best assignee for a task based on workload and skills
   */
  getBestAssignee(
    taskPriority?: string,
    taskTags?: string[],
    excludeUsers: string[] = []
  ): Observable<User | null> {
    return this.getAssigneeSuggestions('', taskPriority, taskTags, excludeUsers).pipe(
      map(suggestions => suggestions.length > 0 ? suggestions[0].user : null)
    );
  }

  /**
   * Get assignee workload statistics
   */
  getAssigneeWorkload(): Observable<{ [userId: string]: { taskCount: number; availability: string } }> {
    return this.userWorkload$.pipe(
      map(workload => {
        const result: { [userId: string]: { taskCount: number; availability: string } } = {};
        
        workload.forEach((taskCount, userId) => {
          let availability = 'available';
          if (taskCount > 10) availability = 'overloaded';
          else if (taskCount > 5) availability = 'busy';
          
          result[userId] = { taskCount, availability };
        });
        
        return result;
      })
    );
  }

  /**
   * Get assignee suggestions for team balancing
   */
  getTeamBalancingSuggestions(): Observable<AssigneeSuggestion[]> {
    return this.users$.pipe(
      map(users => {
        const workload = this.userWorkloadSubject.value;
        const avgWorkload = Array.from(workload.values()).reduce((sum, count) => sum + count, 0) / workload.size;
        
        return users.map(user => {
          const currentWorkload = workload.get(user.id) || 0;
          const workloadDiff = avgWorkload - currentWorkload;
          
          const suggestion: AssigneeSuggestion = {
            user,
            score: workloadDiff > 0 ? workloadDiff * 10 : 0, // Higher score for users with less workload
            reasons: workloadDiff > 0 ? ['Available for more tasks', 'Below average workload'] : ['At or above average workload'],
            taskCount: currentWorkload,
            availability: this.getAvailabilityStatus(currentWorkload)
          };
          
          return suggestion;
        }).sort((a, b) => b.score - a.score);
      })
    );
  }

  /**
   * Update user workload when task is assigned/unassigned
   */
  updateUserWorkload(userId: string, increment: boolean = true): void {
    const currentWorkload = this.userWorkloadSubject.value;
    const newCount = (currentWorkload.get(userId) || 0) + (increment ? 1 : -1);
    
    if (newCount >= 0) {
      currentWorkload.set(userId, newCount);
      this.userWorkloadSubject.next(new Map(currentWorkload));
    }
  }

  /**
   * Get assignee history for a user
   */
  getAssigneeHistory(userId: string): Observable<{ taskCount: number; lastAssigned?: Date; averageTasksPerDay: number }> {
    return this.taskAssignments$.pipe(
      map(assignments => {
        const taskCount = assignments.get(userId) || 0;
        // In a real app, you'd track actual assignment dates
        const lastAssigned = new Date(); // Placeholder
        const averageTasksPerDay = taskCount / 30; // Assuming 30 days
        
        return { taskCount, lastAssigned, averageTasksPerDay };
      })
    );
  }

  /**
   * Get assignee suggestions based on task similarity
   */
  getSimilarTaskAssigneeSuggestions(
    similarTaskId: string,
    currentUserId?: string
  ): Observable<AssigneeSuggestion[]> {
    // In a real app, you'd analyze task similarity and find users who worked on similar tasks
    return this.users$.pipe(
      map(users => {
        return users
          .filter(user => user.id !== currentUserId)
          .map(user => this.generateSuggestion(user))
          .sort((a, b) => b.score - a.score);
      })
    );
  }

  /**
   * Get assignee suggestions for urgent tasks
   */
  getUrgentTaskAssigneeSuggestions(): Observable<AssigneeSuggestion[]> {
    return this.users$.pipe(
      map(users => {
        return users.map(user => {
          const workload = this.userWorkloadSubject.value.get(user.id) || 0;
          const availability = this.getAvailabilityStatus(workload);
          
          // For urgent tasks, prefer available users with moderate workload
          let score = 100;
          if (availability === 'overloaded') score -= 50;
          else if (availability === 'busy') score -= 20;
          
          const suggestion: AssigneeSuggestion = {
            user,
            score,
            reasons: availability === 'available' ? ['Available for urgent tasks'] : ['Consider workload before assignment'],
            taskCount: workload,
            availability
          };
          
          return suggestion;
        }).sort((a, b) => b.score - a.score);
      })
    );
  }

  /**
   * Get assignee suggestions for specific skill requirements
   */
  getSkillBasedSuggestions(requiredSkills: string[]): Observable<AssigneeSuggestion[]> {
    return this.users$.pipe(
      map(users => {
        return users.map(user => {
          // In a real app, you'd have user skills data
          const userSkills = ['general']; // Placeholder
          const skillMatch = requiredSkills.filter(skill => userSkills.includes(skill)).length;
          const skillScore = (skillMatch / requiredSkills.length) * 100;
          
          const workload = this.userWorkloadSubject.value.get(user.id) || 0;
          const availability = this.getAvailabilityStatus(workload);
          
          const suggestion: AssigneeSuggestion = {
            user,
            score: skillScore,
            reasons: skillMatch > 0 ? [`Matches ${skillMatch}/${requiredSkills.length} required skills`] : ['No skill match'],
            taskCount: workload,
            availability
          };
          
          return suggestion;
        }).sort((a, b) => b.score - a.score);
      })
    );
  }

  private generateSuggestion(
    user: User, 
    taskPriority?: string, 
    taskTags?: string[]
  ): AssigneeSuggestion {
    const workload = this.userWorkloadSubject.value.get(user.id) || 0;
    const availability = this.getAvailabilityStatus(workload);
    
    let score = 100;
    const reasons: string[] = [];
    
    // Workload scoring
    if (availability === 'available') {
      score += 20;
      reasons.push('Available for more tasks');
    } else if (availability === 'overloaded') {
      score -= 30;
      reasons.push('High workload - consider carefully');
    }
    
    // Priority-based scoring
    if (taskPriority === 'urgent' && availability === 'available') {
      score += 15;
      reasons.push('Good fit for urgent tasks');
    }
    
    // Tag-based scoring (placeholder for skill matching)
    if (taskTags && taskTags.length > 0) {
      score += 10;
      reasons.push('Has relevant experience');
    }
    
    // Recent activity scoring
    const lastAssigned = new Date(); // Placeholder - in real app, track actual dates
    const daysSinceLastAssignment = Math.floor((Date.now() - lastAssigned.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastAssignment > 7) {
      score += 10;
      reasons.push('Available for new assignments');
    }
    
    return {
      user,
      score: Math.max(0, score),
      reasons,
      lastAssigned,
      taskCount: workload,
      availability
    };
  }

  private getAvailabilityStatus(taskCount: number): 'available' | 'busy' | 'overloaded' {
    if (taskCount <= 3) return 'available';
    if (taskCount <= 7) return 'busy';
    return 'overloaded';
  }

  private loadUsers(): void {
    // In a real app, this would load from a service
    const mockUsers: User[] = [
      { id: 'user1', firstName: 'John', lastName: 'Doe', username: 'johndoe', avatarUrl: '' },
      { id: 'user2', firstName: 'Jane', lastName: 'Smith', username: 'janesmith', avatarUrl: '' },
      { id: 'user3', firstName: 'Bob', lastName: 'Johnson', username: 'bobjohnson', avatarUrl: '' },
      { id: 'user4', firstName: 'Alice', lastName: 'Brown', username: 'alicebrown', avatarUrl: '' },
      { id: 'user5', firstName: 'Charlie', lastName: 'Wilson', username: 'charliewilson', avatarUrl: '' }
    ];
    
    this.usersSubject.next(mockUsers);
    
    // Initialize workload
    const initialWorkload = new Map<string, number>();
    mockUsers.forEach(user => {
      initialWorkload.set(user.id, Math.floor(Math.random() * 8)); // Random workload 0-7
    });
    this.userWorkloadSubject.next(initialWorkload);
    
    // Initialize task assignments
    const initialAssignments = new Map<string, number>();
    mockUsers.forEach(user => {
      initialAssignments.set(user.id, Math.floor(Math.random() * 15)); // Random assignments 0-14
    });
    this.taskAssignmentsSubject.next(initialAssignments);
  }
}
