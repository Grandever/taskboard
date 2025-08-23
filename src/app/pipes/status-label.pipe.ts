import { Pipe, PipeTransform } from '@angular/core';
import { TaskStatus, getTaskStatusLabel } from '../models/task.enums';

@Pipe({
  name: 'statusLabel',
  standalone: true,
})
export class StatusLabelPipe implements PipeTransform {
  transform(value: string | undefined | null): string {
    if (!value) return '';
    return getTaskStatusLabel(value as TaskStatus);
  }
}


