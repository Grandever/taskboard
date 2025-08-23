import { Injectable } from '@angular/core';
import { Task } from '../models/task.interfaces';
import { TaskStatus, TaskPriority } from '../models/task.enums';

export interface ExportOptions {
  format: 'csv' | 'markdown' | 'json';
  includeHeaders: boolean;
  includeDescription: boolean;
  includeTags: boolean;
  includeMetadata: boolean;
  dateFormat: 'iso' | 'short' | 'long';
  separator: string;
  encoding: 'utf-8' | 'utf-16';
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private readonly defaultOptions: ExportOptions = {
    format: 'csv',
    includeHeaders: true,
    includeDescription: true,
    includeTags: true,
    includeMetadata: true,
    dateFormat: 'short',
    separator: ',',
    encoding: 'utf-8'
  };

  /**
   * Export tasks to CSV format
   */
  exportToCSV(tasks: Task[], options: Partial<ExportOptions> = {}): string {
    const opts: ExportOptions = { ...this.defaultOptions, ...options, format: 'csv' };
    
    if (tasks.length === 0) {
      return '';
    }

    const headers = this.getCSVHeaders(opts);
    const rows = tasks.map(task => this.taskToCSVRow(task, opts));
    
    let csv = '';
    
    if (opts.includeHeaders) {
      csv += headers.join(opts.separator) + '\n';
    }
    
    csv += rows.join('\n');
    
    return csv;
  }

  /**
   * Export tasks to Markdown format
   */
  exportToMarkdown(tasks: Task[], options: Partial<ExportOptions> = {}): string {
    const opts: ExportOptions = { ...this.defaultOptions, ...options, format: 'markdown' };
    
    if (tasks.length === 0) {
      return '# No Tasks Found\n\nNo tasks available for export.';
    }

    let md = `# Task Export\n\n`;
    md += `**Total Tasks:** ${tasks.length}\n`;
    md += `**Export Date:** ${new Date().toLocaleString()}\n\n`;
    
    // Summary table
    md += this.generateSummaryTable(tasks);
    md += '\n\n';
    
    // Detailed tasks
    md += '## Task Details\n\n';
    
    tasks.forEach((task, index) => {
      md += this.taskToMarkdown(task, opts, index + 1);
      md += '\n\n';
    });
    
    return md;
  }

  /**
   * Export tasks to JSON format
   */
  exportToJSON(tasks: Task[], options: Partial<ExportOptions> = {}): string {
    const opts: ExportOptions = { ...this.defaultOptions, ...options, format: 'json' };
    
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalTasks: tasks.length,
        format: 'json',
        version: '1.0'
      },
      tasks: opts.includeMetadata ? tasks : tasks.map(task => this.sanitizeTaskForExport(task, opts))
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Download exported data as file
   */
  downloadExport(data: string, filename: string, mimeType: string): void {
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get filename for export
   */
  getExportFilename(prefix: string = 'tasks', format: string = 'csv'): string {
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    return `${prefix}_${date}_${time}.${format}`;
  }

  private getCSVHeaders(options: ExportOptions): string[] {
    const headers = [
      'ID',
      'Title',
      'Status',
      'Priority',
      'Assignee',
      'Due Date',
      'Created At',
      'Updated At'
    ];

    if (options.includeDescription) {
      headers.splice(2, 0, 'Description');
    }

    if (options.includeTags) {
      headers.splice(3, 0, 'Tags');
    }

    if (options.includeMetadata) {
      headers.push('Points');
    }

    return headers;
  }

  private taskToCSVRow(task: Task, options: ExportOptions): string {
    const values = [
      this.escapeCSVValue(task.id),
      this.escapeCSVValue(task.title),
      this.escapeCSVValue(this.getStatusLabel(task.status)),
      this.escapeCSVValue(this.getPriorityLabel(task.priority)),
      this.escapeCSVValue(task.assignee || ''),
      this.escapeCSVValue(this.formatDate(task.due_date, options.dateFormat)),
      this.escapeCSVValue(this.formatDate(task.created_at, options.dateFormat)),
      this.escapeCSVValue(this.formatDate(task.updated_at, options.dateFormat))
    ];

    if (options.includeDescription) {
      values.splice(2, 0, this.escapeCSVValue(task.description || ''));
    }

    if (options.includeTags) {
      values.splice(3, 0, this.escapeCSVValue((task.tags || []).join('; ')));
    }

    if (options.includeMetadata) {
      values.push(this.escapeCSVValue(task.points?.toString() || '0'));
    }

    return values.join(options.separator);
  }

  private taskToMarkdown(task: Task, options: ExportOptions, index: number): string {
    let md = `### ${index}. ${task.title}\n\n`;
    
    md += `**Status:** ${this.getStatusLabel(task.status)}  \n`;
    md += `**Priority:** ${this.getPriorityLabel(task.priority)}  \n`;
    md += `**Assignee:** ${task.assignee || 'Unassigned'}  \n`;
    md += `**Due Date:** ${this.formatDate(task.due_date, options.dateFormat)}  \n`;
    
    if (options.includeDescription && task.description) {
      md += `**Description:** ${task.description}  \n`;
    }
    
    if (options.includeTags && task.tags && task.tags.length > 0) {
      md += `**Tags:** ${task.tags.map(tag => `\`${tag}\``).join(', ')}  \n`;
    }
    
    md += `**Created:** ${this.formatDate(task.created_at, options.dateFormat)}  \n`;
    md += `**Updated:** ${this.formatDate(task.updated_at, options.dateFormat)}  \n`;
    
    if (options.includeMetadata && task.points) {
      md += `**Points:** ${task.points}  \n`;
    }
    
    return md;
  }

  private generateSummaryTable(tasks: Task[]): string {
    const statusCounts = this.countByStatus(tasks);
    const priorityCounts = this.countByPriority(tasks);
    const assigneeCounts = this.countByAssignee(tasks);
    
    let md = '### Summary\n\n';
    
    // Status summary
    md += '#### Status Distribution\n';
    md += '| Status | Count | Percentage |\n';
    md += '|--------|-------|------------|\n';
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      const percentage = ((count / tasks.length) * 100).toFixed(1);
      md += `| ${this.getStatusLabel(status as TaskStatus)} | ${count} | ${percentage}% |\n`;
    });
    
    md += '\n';
    
    // Priority summary
    md += '#### Priority Distribution\n';
    md += '| Priority | Count | Percentage |\n';
    md += '|----------|-------|------------|\n';
    
    Object.entries(priorityCounts).forEach(([priority, count]) => {
      const percentage = ((count / tasks.length) * 100).toFixed(1);
      md += `| ${this.getPriorityLabel(priority as TaskPriority)} | ${count} | ${percentage}% |\n`;
    });
    
    md += '\n';
    
    // Assignee summary
    md += '#### Assignee Distribution\n';
    md += '| Assignee | Count | Percentage |\n';
    md += '|----------|-------|------------|\n';
    
    Object.entries(assigneeCounts).forEach(([assignee, count]) => {
      const percentage = ((count / tasks.length) * 100).toFixed(1);
      md += `| ${assignee || 'Unassigned'} | ${count} | ${percentage}% |\n`;
    });
    
    return md;
  }

  private countByStatus(tasks: Task[]): Record<string, number> {
    return tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private countByPriority(tasks: Task[]): Record<string, number> {
    return tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private countByAssignee(tasks: Task[]): Record<string, number> {
    return tasks.reduce((acc, task) => {
      const assignee = task.assignee || 'Unassigned';
      acc[assignee] = (acc[assignee] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private sanitizeTaskForExport(task: Task, options: ExportOptions): Partial<Task> {
    const sanitized: Partial<Task> = {
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      assignee: task.assignee,
      due_date: task.due_date,
      created_at: task.created_at,
      updated_at: task.updated_at
    };

    if (options.includeDescription) {
      sanitized.description = task.description;
    }

    if (options.includeTags) {
      sanitized.tags = task.tags;
    }

    if (options.includeMetadata) {
      sanitized.points = task.points;
    }

    return sanitized;
  }

  private escapeCSVValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private formatDate(dateString: string | undefined, format: string): string {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    
    switch (format) {
      case 'iso':
        return date.toISOString();
      case 'long':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      case 'short':
      default:
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
    }
  }

  private getStatusLabel(status: TaskStatus): string {
    const labels: Record<TaskStatus, string> = {
      [TaskStatus.TODO]: 'To Do',
      [TaskStatus.IN_PROGRESS]: 'In Progress',
      [TaskStatus.CODE_REVIEW]: 'Code Review',
      [TaskStatus.TEST_READY]: 'Test Ready',
      [TaskStatus.FINISHED]: 'Finished'
    };
    return labels[status] || status;
  }

  private getPriorityLabel(priority: TaskPriority): string {
    const labels: Record<TaskPriority, string> = {
      [TaskPriority.LOW]: 'Low',
      [TaskPriority.MEDIUM]: 'Medium',
      [TaskPriority.HIGH]: 'High',
      [TaskPriority.URGENT]: 'Urgent'
    };
    return labels[priority] || priority;
  }
}
