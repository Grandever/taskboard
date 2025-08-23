import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-wip-warning',
  templateUrl: './wip-warning.html',
  styleUrls: ['./wip-warning.css'],
  standalone: true,
  imports: [CommonModule]
})
export class WipWarningComponent {
  @Input() wipCount: number = 0;
  @Input() wipLimit: number = 5;
  @Input() showWarning: boolean = false;

  get shouldShowWarning(): boolean {
    return this.showWarning && this.wipCount > this.wipLimit;
  }
}
