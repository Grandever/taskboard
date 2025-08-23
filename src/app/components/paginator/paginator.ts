// paginator.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './paginator.html',
  styleUrls: ['./paginator.css']
})
export class Paginator {
  @Input() currentPage: number = 1;
  @Input() totalItems: number = 0;
  @Input() itemsPerPage: number = 10;
  @Input() loading: boolean = false;
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.itemsPerPage));
  }

  get pages(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToFirst() {
    if (this.currentPage !== 1) {
      this.pageChange.emit(1);
    }
  }

  goToPrev() {
    if (this.currentPage > 1) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  goToNext() {
    if (this.currentPage < this.totalPages) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }

  goToLast() {
    if (this.currentPage !== this.totalPages) {
      this.pageChange.emit(this.totalPages);
    }
  }

  onPageSizeChange() {
    this.pageSizeChange.emit(this.itemsPerPage);
  }

  onPageChange() {
    if (this.currentPage >= 1 && this.currentPage <= this.totalPages) {
      this.pageChange.emit(this.currentPage);
    }
  }

  // Keyboard navigation support
  onKeyDown(event: KeyboardEvent, action: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      switch (action) {
        case 'first':
          this.goToFirst();
          break;
        case 'prev':
          this.goToPrev();
          break;
        case 'next':
          this.goToNext();
          break;
        case 'last':
          this.goToLast();
          break;
      }
    }
  }

  // Accessibility helpers
  getPageLabel(page: number): string {
    return `Page ${page}`;
  }

  getNavigationLabel(action: string): string {
    switch (action) {
      case 'first': return 'Go to first page';
      case 'prev': return 'Go to previous page';
      case 'next': return 'Go to next page';
      case 'last': return 'Go to last page';
      default: return '';
    }
  }
}
