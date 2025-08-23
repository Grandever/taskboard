import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.interfaces';
import { User } from '../../models/task.interfaces';
import { AdvancedFilters } from '../../models/filter.interfaces';
import { DataGeneratorComponent } from '../data-generator/data-generator';
import { AdvancedFilterComponent } from '../advanced-filter/advanced-filter';

@Component({
  selector: 'app-controls-panel',
  templateUrl: './controls-panel.html',
  styleUrls: ['./controls-panel.css'],
  standalone: true,
  imports: [CommonModule, DataGeneratorComponent, AdvancedFilterComponent]
})
export class ControlsPanelComponent {
  @Input() tasks: Task[] = [];
  @Input() users: User[] = [];
  @Input() advancedFilters: AdvancedFilters = {};

  @Output() filtersChanged = new EventEmitter<AdvancedFilters>();
  @Output() clearFilters = new EventEmitter<void>();

  onAdvancedFiltersChanged(filters: AdvancedFilters): void {
    this.filtersChanged.emit(filters);
  }

  onAdvancedFiltersClear(): void {
    this.clearFilters.emit();
  }
}
