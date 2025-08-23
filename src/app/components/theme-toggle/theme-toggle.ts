import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      class="theme-toggle-btn"
      (click)="toggleTheme()"
      [attr.aria-label]="'Switch to ' + (isDarkMode ? 'light' : 'dark') + ' mode'"
      title="Toggle theme">
      
      <!-- Light mode icon -->
      <svg 
        *ngIf="isDarkMode" 
        class="theme-icon" 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2" 
        stroke-linecap="round" 
        stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
      
      <!-- Dark mode icon -->
      <svg 
        *ngIf="!isDarkMode" 
        class="theme-icon" 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2" 
        stroke-linecap="round" 
        stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    </button>
  `,
  styles: [`
    .theme-toggle-btn {
      background: none;
      border: none;
      padding: var(--spacing-2);
      border-radius: var(--border-radius);
      cursor: pointer;
      color: var(--neutral-700);
      transition: all var(--transition-normal);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
    }

    .theme-toggle-btn:hover {
      background-color: var(--neutral-100);
      color: var(--primary-500);
      transform: scale(1.05);
    }

    .theme-toggle-btn:focus {
      outline: none;
      box-shadow: 0 0 0 2px var(--primary-100);
    }

    .theme-icon {
      transition: transform var(--transition-normal);
    }

    .theme-toggle-btn:hover .theme-icon {
      transform: rotate(15deg);
    }

    /* Enhanced Dark mode styles */
    .dark-mode .theme-toggle-btn {
      color: var(--neutral-300);
      background: linear-gradient(135deg, var(--neutral-100) 0%, var(--neutral-200) 100%);
      border: 1px solid var(--neutral-400);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    .dark-mode .theme-toggle-btn:hover {
      background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
      color: white;
      border-color: var(--primary-500);
      box-shadow: 0 2px 6px rgba(0, 82, 204, 0.3);
      transform: scale(1.1);
    }

    .dark-mode .theme-toggle-btn:focus {
      outline: none;
      box-shadow: 0 0 0 2px var(--primary-400), 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    /* Enhanced Animation for theme switch */
    .theme-toggle-btn:active {
      transform: scale(0.9);
      transition: transform 0.1s ease;
    }

    .theme-toggle-btn {
      position: relative;
      overflow: hidden;
    }

    .theme-toggle-btn::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: radial-gradient(circle, var(--primary-200) 0%, transparent 70%);
      transition: all 0.3s ease;
      transform: translate(-50%, -50%);
    }

    .theme-toggle-btn:hover::before {
      width: 60px;
      height: 60px;
    }

    .theme-icon {
      position: relative;
      z-index: 1;
    }

    /* Enhanced Responsive */
    @media (max-width: 768px) {
      .theme-toggle-btn {
        width: 36px;
        height: 36px;
        padding: var(--spacing-1);
      }

      .dark-mode .theme-toggle-btn {
        background: linear-gradient(135deg, var(--neutral-100) 0%, var(--neutral-200) 100%);
        border: 1px solid var(--neutral-400);
      }

      .theme-toggle-btn::before {
        display: none;
      }
    }

    /* Accessibility improvements */
    .theme-toggle-btn:focus-visible {
      outline: 2px solid var(--primary-400);
      outline-offset: 2px;
    }

    /* Loading state */
    .theme-toggle-btn.loading {
      pointer-events: none;
      opacity: 0.7;
    }

    .theme-toggle-btn.loading .theme-icon {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `]
})
export class ThemeToggleComponent {
  private themeService = inject(ThemeService);
  public isDarkMode = false;

  constructor() {
    this.themeService.theme$.subscribe(theme => {
      this.isDarkMode = theme === 'dark';
    });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
