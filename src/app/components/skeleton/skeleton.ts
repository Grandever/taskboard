import { Component, Input } from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [NgForOf, NgIf],
  template: `
    <div class="skeleton-container">
      <!-- Table skeleton -->
      <div class="skeleton-table">
        <div class="skeleton-header">
          <div *ngFor="let col of columns" class="skeleton-col" [style.width]="col.width">
            <span class="placeholder col-12 placeholder-lg"></span>
            <span class="placeholder col-12 placeholder-sm"></span>
          </div>
        </div>
        <div class="skeleton-body">
          <div *ngFor="let row of rowsArray" class="skeleton-row">
            <div *ngFor="let col of columns" class="skeleton-col" [style.width]="col.width">
              <span class="placeholder col-12"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-container {
      width: 100%;
    }

    /* Table skeleton */
    .skeleton-table {
      border: 1px solid #e9ecef;
      border-radius: 0.375rem;
      overflow: hidden;
      height: 600px;
      width: 100%;
    }

    .skeleton-header {
      display: flex;
      background-color: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }

    .skeleton-body {
      background-color: white;
    }

    .skeleton-row {
      display: flex;
      border-bottom: 1px solid #e9ecef;
    }

    .skeleton-row:last-child {
      border-bottom: none;
    }

    .skeleton-col {
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    /* Unified placeholder styles */
    .placeholder {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      border-radius: 0.25rem;
      height: 1rem;
    }

    .placeholder-lg {
      height: 1.5rem;
    }

    .placeholder-sm {
      height: 0.75rem;
    }

    @keyframes loading {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .skeleton-header,
      .skeleton-row {
        flex-direction: column;
      }

      .skeleton-col {
        width: 100% !important;
      }
    }
  `]
})
export class SkeletonComponent {
  @Input() rows: number = 5;
  @Input() columns: Array<{width: string}> = [
    { width: '20%' },
    { width: '15%' },
    { width: '15%' },
    { width: '25%' },
    { width: '25%' }
  ];

  get rowsArray(): number[] {
    return Array.from({ length: this.rows }, (_, i) => i);
  }
}
