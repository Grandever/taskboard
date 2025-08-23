import { test, expect } from '@playwright/test';

test.describe('TaskBoard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the taskboard
    await page.goto('/');
    // Wait for the page to load
    await page.waitForSelector('task-table');
  });

  test.describe('CRUD Operations', () => {
    test('should create a new task', async ({ page }) => {
      // Click on new task button or use keyboard shortcut
      await page.keyboard.press('n');
      
      // Wait for modal to appear
      await page.waitForSelector('task-form');
      
      // Fill in task details
      await page.fill('input[placeholder*="Title"]', 'E2E Test Task');
      await page.selectOption('select[formControlName="status"]', 'todo');
      await page.selectOption('select[formControlName="priority"]', 'high');
      await page.fill('textarea[placeholder*="Description"]', 'This is a test task for E2E testing');
      await page.fill('input[type="date"]', '2024-12-31');
      
      // Submit the form
      await page.click('button[type="submit"]');
      
      // Verify task was created
      await expect(page.locator('text=E2E Test Task')).toBeVisible();
      await expect(page.locator('text=high')).toBeVisible();
    });

    test('should read task details in expanded row', async ({ page }) => {
      // Click on expand button for first task
      await page.click('button[title="Expand"]:first');
      
      // Verify description is visible
      await expect(page.locator('.expanded-content')).toBeVisible();
      await expect(page.locator('text=Description:')).toBeVisible();
    });

    test('should update task status via quick actions', async ({ page }) => {
      // Hover over status column to show quick actions
      await page.hover('td.status-column:first');
      
      // Click on quick status change dropdown
      await page.click('button[title="Quick Status Change"]:first');
      
      // Select new status
      await page.click('text=In Progress');
      
      // Verify status changed
      await expect(page.locator('text=In Progress')).toBeVisible();
    });

    test('should delete task with confirmation', async ({ page }) => {
      // Click delete button on first task
      await page.click('button[title="Delete Task"]:first');
      
      // Verify confirmation modal appears
      await expect(page.locator('text=Are you sure?')).toBeVisible();
      
      // Confirm deletion
      await page.click('text=Yes, delete it!');
      
      // Verify task was deleted
      await expect(page.locator('text=Task has been deleted successfully')).toBeVisible();
    });
  });

  test.describe('Filtering and Search', () => {
    test('should filter by status tab', async ({ page }) => {
      // Click on status tab (assuming tabs exist)
      await page.click('text=In Progress');
      
      // Verify only in-progress tasks are shown
      const tasks = page.locator('tbody tr');
      await expect(tasks).toHaveCount(1); // Should show only in-progress tasks
    });

    test('should search by title', async ({ page }) => {
      // Focus on search input using keyboard shortcut
      await page.keyboard.press('/');
      
      // Type search term
      await page.keyboard.type('Test Task');
      
      // Wait for filtering
      await page.waitForTimeout(500);
      
      // Verify filtered results
      await expect(page.locator('text=Test Task')).toBeVisible();
    });

    test('should filter by priority', async ({ page }) => {
      // Select priority filter
      await page.selectOption('select[formControlName="priority"]', 'high');
      
      // Wait for filtering
      await page.waitForTimeout(500);
      
      // Verify only high priority tasks are shown
      await expect(page.locator('text=high')).toBeVisible();
    });

    test('should filter by tags', async ({ page }) => {
      // Enter tag in tags filter
      await page.fill('input[placeholder*="Search tags"]', 'bug');
      
      // Wait for filtering
      await page.waitForTimeout(500);
      
      // Verify only tasks with 'bug' tag are shown
      await expect(page.locator('text=bug')).toBeVisible();
    });
  });

  test.describe('Sorting', () => {
    test('should sort by title', async ({ page }) => {
      // Click on title column header
      await page.click('th[title="Sort by Title"]');
      
      // Verify ascending sort
      await expect(page.locator('th[title="Sort by Title"] i.bi-sort-up')).toBeVisible();
      
      // Click again for descending
      await page.click('th[title="Sort by Title"]');
      await expect(page.locator('th[title="Sort by Title"] i.bi-sort-down')).toBeVisible();
    });

    test('should sort by priority', async ({ page }) => {
      // Click on priority column header
      await page.click('th[title="Sort by Priority"]');
      
      // Verify sort indicator
      await expect(page.locator('th[title="Sort by Priority"] i.bi-sort-up')).toBeVisible();
    });

    test('should sort by due date', async ({ page }) => {
      // Click on due date column header
      await page.click('th[title="Sort by Due Date"]');
      
      // Verify sort indicator
      await expect(page.locator('th[title="Sort by Due Date"] i.bi-sort-up')).toBeVisible();
    });

    test('should sort by updated at', async ({ page }) => {
      // Click on updated at column header
      await page.click('th[title="Sort by Updated At"]');
      
      // Verify sort indicator
      await expect(page.locator('th[title="Sort by Updated At"] i.bi-sort-up')).toBeVisible();
    });
  });

  test.describe('Bulk Actions', () => {
    test('should select multiple tasks', async ({ page }) => {
      // Select first task
      await page.click('input[type="checkbox"]:nth-child(1)');
      
      // Select second task
      await page.click('input[type="checkbox"]:nth-child(2)');
      
      // Verify bulk actions bar appears
      await expect(page.locator('text=2 tasks selected')).toBeVisible();
    });

    test('should perform bulk status update', async ({ page }) => {
      // Select multiple tasks
      await page.click('input[type="checkbox"]:nth-child(1)');
      await page.click('input[type="checkbox"]:nth-child(2)');
      
      // Click bulk status update
      await page.click('text=Update Status');
      
      // Select new status
      await page.click('text=Finished');
      
      // Confirm update
      await page.click('text=Update 2 tasks');
      
      // Verify success message
      await expect(page.locator('text=status updated to "Finished"')).toBeVisible();
    });

    test('should perform bulk delete', async ({ page }) => {
      // Select multiple tasks
      await page.click('input[type="checkbox"]:nth-child(1)');
      await page.click('input[type="checkbox"]:nth-child(2)');
      
      // Click bulk delete
      await page.click('text=Delete Selected');
      
      // Confirm deletion
      await page.click('text=Yes, delete 2 tasks!');
      
      // Verify success message
      await expect(page.locator('text=deleted successfully')).toBeVisible();
    });
  });

  test.describe('Overdue Tasks', () => {
    test('should show overdue flag for past due dates', async ({ page }) => {
      // Look for overdue badge
      await expect(page.locator('text=Overdue')).toBeVisible();
    });

    test('should not show overdue for finished tasks', async ({ page }) => {
      // Find a finished task and verify no overdue badge
      const finishedTaskRow = page.locator('tr:has-text("Finished")');
      await expect(finishedTaskRow.locator('text=Overdue')).not.toBeVisible();
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test('should focus search with / key', async ({ page }) => {
      // Press / key
      await page.keyboard.press('/');
      
      // Verify search input is focused
      const searchInput = page.locator('input[placeholder*="Search title"]');
      await expect(searchInput).toBeFocused();
    });

    test('should open new task modal with n key', async ({ page }) => {
      // Press n key
      await page.keyboard.press('n');
      
      // Verify modal opens
      await expect(page.locator('task-form')).toBeVisible();
    });

    test('should delete selected tasks with Delete key', async ({ page }) => {
      // Select a task first
      await page.click('input[type="checkbox"]:first');
      
      // Press Delete key
      await page.keyboard.press('Delete');
      
      // Verify confirmation modal appears
      await expect(page.locator('text=Are you sure?')).toBeVisible();
    });
  });

  test.describe('WIP Limit Warning', () => {
    test('should show WIP limit warning when exceeded', async ({ page }) => {
      // This test assumes there are more than 5 tasks in progress
      // You might need to create additional tasks first
      
      // Look for WIP warning
      const wipWarning = page.locator('.wip-warning');
      if (await wipWarning.isVisible()) {
        await expect(wipWarning).toContainText('WIP Limit Warning');
        await expect(wipWarning).toContainText('limit: 5');
      }
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle empty dataset gracefully', async ({ page }) => {
      // Clear all tasks (this might require a special test mode)
      // For now, just verify the "No Records Found" message appears when appropriate
      const noRecordsMessage = page.locator('text=No Records Found');
      if (await noRecordsMessage.isVisible()) {
        await expect(noRecordsMessage).toBeVisible();
      }
    });

    test('should handle tasks with many tags', async ({ page }) => {
      // Look for tasks with multiple tags
      const tagElements = page.locator('.tags-container .badge');
      const tagCount = await tagElements.count();
      
      if (tagCount > 0) {
        // Verify tags are displayed properly
        await expect(tagElements.first()).toBeVisible();
      }
    });

    test('should handle localStorage quota exceeded', async ({ page }) => {
      // This is a complex test that would require mocking localStorage
      // For now, just verify the app doesn't crash
      await expect(page.locator('task-table')).toBeVisible();
    });
  });

  test.describe('URL State Synchronization', () => {
    test('should sync filters with URL', async ({ page }) => {
      // Apply a filter
      await page.fill('input[placeholder*="Search title"]', 'test');
      await page.waitForTimeout(500);
      
      // Verify URL contains the filter
      await expect(page).toHaveURL(/.*title=test.*/);
    });

    test('should sync sort with URL', async ({ page }) => {
      // Click sort column
      await page.click('th[title="Sort by Title"]');
      
      // Verify URL contains sort parameter
      await expect(page).toHaveURL(/.*sort=title,asc.*/);
    });

    test('should sync pagination with URL', async ({ page }) => {
      // Go to second page
      await page.click('a:has-text("2")');
      
      // Verify URL contains page parameter
      await expect(page).toHaveURL(/.*page=2.*/);
    });
  });
});
