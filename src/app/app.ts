import {Component, OnInit, ViewChild} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import {TaskBoard} from './components/task-board/task-board';
import {TaskForm} from './components/task-form/task-form';
import {RouterLink, RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TaskBoard, TaskForm, RouterOutlet, RouterLink, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit{

  @ViewChild(TaskForm) modal!: TaskForm;

  titleSearch: string = '';
  private titleSearchInput$ = new Subject<string>();

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((p) => {
      const t = p.get('title');
      this.titleSearch = t ?? '';
    });

    this.titleSearchInput$
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((val) => {
        this.router.navigate([], {
          queryParams: { title: val || undefined },
          queryParamsHandling: 'merge',
        });
      });
  }

  onSearchInput(value: string) {
    this.titleSearch = value;
    this.titleSearchInput$.next(value);
    // Optionally emit an event or use a shared service to notify TaskBoard
  }
}
