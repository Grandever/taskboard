import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statusLabel',
  standalone: true,
})
export class StatusLabelPipe implements PipeTransform {
  transform(value: string | undefined | null): string {
    if (!value) return '';
    const normalized = String(value).toLowerCase().replace(/[^a-z]/g, '');
    switch (normalized) {
      case 'todo':
        return 'To Do';
      case 'inprogress':
        return 'In Progress';
      case 'codereview':
        return 'Code Review';
      case 'testready':
        return 'Test Ready';
      case 'finished':
        return 'Finished';
      default:
        return value;
    }
  }
}


