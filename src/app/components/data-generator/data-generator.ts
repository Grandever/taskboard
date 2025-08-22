import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { generateSampleData, clearTaskboardData, getDataStatistics } from '../../utils/generate-sample-data';

@Component({
  selector: 'app-data-generator',
  standalone: true,
  template: `
    <div class="data-generator-container">
      <div class="card">
        <div class="card-header">
          <h5 class="mb-0">
            <i class="bi bi-database me-2"></i>
            Data Generator
          </h5>
        </div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <button 
                class="btn btn-primary w-100" 
                (click)="generateData()"
                [disabled]="isGenerating">
                <i class="bi bi-plus-circle me-2"></i>
                {{ isGenerating ? 'Generating...' : 'Generate 1K Tasks' }}
              </button>
            </div>
            <div class="col-md-4">
              <button 
                class="btn btn-warning w-100" 
                (click)="clearData()"
                [disabled]="isClearing">
                <i class="bi bi-trash me-2"></i>
                {{ isClearing ? 'Clearing...' : 'Clear All Data' }}
              </button>
            </div>
            <div class="col-md-4">
              <button 
                class="btn btn-info w-100" 
                (click)="showStatistics()">
                <i class="bi bi-bar-chart me-2"></i>
                View Statistics
              </button>
            </div>
          </div>
          
          <div class="mt-3">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" id="smallDataset" [(ngModel)]="useSmallDataset">
              <label class="form-check-label" for="smallDataset">
                Use smaller dataset (100 tasks instead of 1000)
              </label>
            </div>
          </div>
          
          <div *ngIf="message" class="alert mt-3" [ngClass]="messageType === 'success' ? 'alert-success' : 'alert-danger'">
            {{ message }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .data-generator-container {
      margin: 20px 0;
    }
    
    .card {
      border: 1px solid #e9ecef;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .card-header {
      background-color: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
      padding: 12px 16px;
    }
    
    .card-header h5 {
      color: #495057;
      font-size: 1rem;
      font-weight: 600;
    }
    
    .card-body {
      padding: 16px;
    }
    
    .btn {
      font-size: 0.875rem;
      font-weight: 500;
    }
    
    .form-check-label {
      font-size: 0.875rem;
      color: #6c757d;
    }
  `],
  imports: [FormsModule]
})
export class DataGeneratorComponent {
  isGenerating = false;
  isClearing = false;
  message = '';
  messageType: 'success' | 'error' = 'success';
  useSmallDataset = false;

  async generateData(): Promise<void> {
    this.isGenerating = true;
    this.message = '';
    
    try {
      const taskCount = this.useSmallDataset ? 100 : 1000;
      
      // Use setTimeout to allow UI to update
      setTimeout(() => {
        generateSampleData(taskCount, 20);
        this.message = `✅ Successfully generated ${taskCount} tasks and 20 users!`;
        this.messageType = 'success';
        this.isGenerating = false;
      }, 100);
      
    } catch (error) {
      this.message = '❌ Error generating data. Please try again.';
      this.messageType = 'error';
      this.isGenerating = false;
    }
  }

  async clearData(): Promise<void> {
    this.isClearing = true;
    this.message = '';
    
    try {
      // Use setTimeout to allow UI to update
      setTimeout(() => {
        clearTaskboardData();
        this.message = '✅ Successfully cleared all data!';
        this.messageType = 'success';
        this.isClearing = false;
      }, 100);
      
    } catch (error) {
      this.message = '❌ Error clearing data. Please try again.';
      this.messageType = 'error';
      this.isClearing = false;
    }
  }

  showStatistics(): void {
    this.message = '';
    getDataStatistics();
  }
}
