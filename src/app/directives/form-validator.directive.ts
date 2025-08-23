import { Directive, Input, TemplateRef, ViewContainerRef, OnDestroy } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appFormValidator]',
  standalone: true
})
export class FormValidatorDirective implements OnDestroy {
  @Input() set appFormValidator(control: any) {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this._appFormValidator = control;
    if (control && typeof control.statusChanges !== 'undefined') {
      this.subscription = control.statusChanges.subscribe(() => {
        this.updateView();
      });
      this.updateView();
    }
  }
  get appFormValidator(): AbstractControl | null {
    return this._appFormValidator;
  }
  private _appFormValidator: AbstractControl | null = null;
  
  @Input() fieldName: string = '';
  @Input() customMessages: { [key: string]: string } = {};
  
  private subscription?: Subscription;
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) {}

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private updateView() {
    if (!this.appFormValidator) return;
    
    const hasError = this.appFormValidator.invalid && this.appFormValidator.touched;
    
    if (hasError && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef, {
        $implicit: this.getErrorMessages()
      });
      this.hasView = true;
    } else if (!hasError && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    } else if (hasError && this.hasView) {
      // Update existing view with new error messages
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef, {
        $implicit: this.getErrorMessages()
      });
    }
  }

  private getErrorMessages(): string[] {
    if (!this.appFormValidator) return [];
    
    const errors = this.appFormValidator.errors;
    if (!errors) return [];

    const messages: string[] = [];
    
    Object.keys(errors).forEach(errorKey => {
      const message = this.getErrorMessage(errorKey, errors[errorKey]);
      if (message) {
        messages.push(message);
      }
    });

    return messages;
  }

  private getErrorMessage(errorKey: string, errorValue: any): string {
    // Custom messages first
    if (this.customMessages[errorKey]) {
      return this.customMessages[errorKey];
    }

    // Default messages
    const defaultMessages: { [key: string]: string } = {
      required: `${this.fieldName || 'This field'} is required`,
      minlength: `${this.fieldName || 'This field'} must be at least ${errorValue.requiredLength} characters`,
      maxlength: `${this.fieldName || 'This field'} must not exceed ${errorValue.requiredLength} characters`,
      min: `${this.fieldName || 'This field'} must be at least ${errorValue.min}`,
      max: `${this.fieldName || 'This field'} must not exceed ${errorValue.max}`,
      email: `${this.fieldName || 'This field'} must be a valid email address`,
      pattern: `${this.fieldName || 'This field'} format is invalid`,
      unique: `${this.fieldName || 'This field'} already exists`,
      passwordMismatch: 'Passwords do not match',
      invalidDate: `${this.fieldName || 'This field'} must be a valid date`,
      futureDate: `${this.fieldName || 'This field'} must be a future date`,
      pastDate: `${this.fieldName || 'This field'} must be a past date`
    };

    return defaultMessages[errorKey] || `${this.fieldName || 'This field'} is invalid`;
  }
}
