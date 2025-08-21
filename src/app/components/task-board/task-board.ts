import {Component, OnInit} from '@angular/core';
import {TitleCasePipe} from "@angular/common";

interface Card {
  id: string;
  title: string;
  type: string;
  priority: string;
  assignee?: string;
  column: string;
}

interface Column {
  name: string;
  title: string;
  icon: string;
  cards: Card[];
}
@Component({
  selector: 'task-board',
    imports: [
        TitleCasePipe
    ],
  templateUrl: './task-board.html',
  styleUrl: './task-board.css'
})
export class TaskBoard implements OnInit{
  columns: Column[] = [
    {
      name: 'todo',
      title: 'To Do',
      icon: 'clipboard-list',
      cards: [
        { id: 'IN-630', title: 'Write CSV reading and reading_date to reading table', type: 'task', priority: 'high', assignee: 'A', column: 'todo' },
        { id: 'IN-431', title: 'Implementation AI Contract details', type: 'improvement', priority: 'medium', assignee: 'M', column: 'todo' },
        { id: 'IN-632', title: 'Update API endpoints for new requirements', type: 'task', priority: 'low', assignee: 'T', column: 'todo' }
      ]
    },
    {
      name: 'inprogress',
      title: 'In Progress',
      icon: 'spinner',
      cards: [
        { id: 'IN-634', title: 'Implementation', type: 'task', priority: 'high', assignee: 'S', column: 'inprogress' },
        { id: 'IN-635', title: 'Change payment status', type: 'improvement', priority: 'low', assignee: 'J', column: 'inprogress' },
        { id: 'IN-637', title: 'Middle responsive issues', type: 'bug', priority: 'medium', assignee: 'R', column: 'inprogress' }
      ]
    },
    {
      name: 'review',
      title: 'Code Review',
      icon: 'code',
      cards: [
        { id: 'IN-640', title: 'Ready calculation', type: 'task', priority: 'medium', assignee: 'K', column: 'review' }
      ]
    },
    {
      name: 'test-ready',
      title: 'Test Ready',
      icon: 'check-circle',
      cards: [
        { id: 'IN-481', title: 'Fit draft models', type: 'task', priority: 'low', assignee: 'T', column: 'done' },
        { id: 'IN-619', title: 'Weave decline. Ensure Password can', type: 'bug', priority: 'high', assignee: 'R', column: 'done' },
        { id: 'IN-625', title: 'Refactor user authentication module', type: 'improvement', priority: 'medium', assignee: 'A', column: 'done' }
      ]
    },
    {
      name: 'finished',
      title: 'Finished',
      icon: 'check-circle',
      cards: [
        { id: 'IN-481', title: 'Fit draft models', type: 'task', priority: 'low', assignee: 'T', column: 'done' },
        { id: 'IN-619', title: 'Weave decline. Ensure Password can', type: 'bug', priority: 'high', assignee: 'R', column: 'done' },
        { id: 'IN-625', title: 'Refactor user authentication module', type: 'improvement', priority: 'medium', assignee: 'A', column: 'done' }
      ]
    }
  ];

  draggedCard: Card | null = null;

  constructor() { }

  ngOnInit(): void {
  }

  onDragStart(card: Card): void {
    this.draggedCard = card;
  }

  onDragEnd(): void {
    this.draggedCard = null;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(columnName: string, event: DragEvent): void {
    event.preventDefault();
    if (this.draggedCard) {
      // Remove from previous column
      for (const column of this.columns) {
        const index = column.cards.findIndex(c => c.id === this.draggedCard!.id);
        if (index > -1) {
          column.cards.splice(index, 1);
          break;
        }
      }

      // Add to new column
      const targetColumn = this.columns.find(c => c.name === columnName);
      if (targetColumn) {
        this.draggedCard.column = columnName;
        targetColumn.cards.push({...this.draggedCard});
      }

      this.draggedCard = null;
    }
  }

  editCard(card: Card): void {
    const newTitle = prompt('Edit task:', card.title);
    if (newTitle !== null && newTitle.trim() !== '') {
      card.title = newTitle;
    }
  }

  addCard(columnName: string): void {
    const cardTitle = prompt('Enter task title:');
    if (cardTitle) {
      const newCard: Card = {
        id: 'IN-' + Math.floor(Math.random() * 1000),
        title: cardTitle,
        type: 'task',
        priority: 'medium',
        assignee: 'U',
        column: columnName
      };

      const column = this.columns.find(c => c.name === columnName);
      if (column) {
        column.cards.push(newCard);
      }
    }
  }

  getColumnCount(columnName: string): number {
    const column = this.columns.find(c => c.name === columnName);
    return column ? column.cards.length : 0;
  }

  getTotalIssues(): number {
    return this.columns.reduce((total, column) => total + column.cards.length, 0);
  }
}
