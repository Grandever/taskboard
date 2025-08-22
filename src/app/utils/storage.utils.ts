/**
 * LocalStorage utility functions with error handling
 */

export interface StorageError {
  type: 'quota_exceeded' | 'corrupted_data' | 'unavailable';
  message: string;
  originalError?: any;
}

/**
 * Safely get item from localStorage
 */
export function safeGetItem(key: string): any {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return null;
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return null;
  }
}

/**
 * Safely set item to localStorage
 */
export function safeSetItem(key: string, value: any): StorageError | null {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return null; // Success
  } catch (error: any) {
    let storageError: StorageError;
    
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      storageError = {
        type: 'quota_exceeded',
        message: 'LocalStorage is full. Please clear some data or use incognito mode.',
        originalError: error
      };
    } else if (error.name === 'SecurityError') {
      storageError = {
        type: 'unavailable',
        message: 'LocalStorage is not available in this context.',
        originalError: error
      };
    } else {
      storageError = {
        type: 'corrupted_data',
        message: 'Failed to save data to localStorage.',
        originalError: error
      };
    }
    
    console.error(`Error writing to localStorage key "${key}":`, storageError);
    return storageError;
  }
}

/**
 * Safely remove item from localStorage
 */
export function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage key "${key}":`, error);
    return false;
  }
}

/**
 * Check if localStorage is available and has space
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    const testValue = 'test';
    localStorage.setItem(testKey, testValue);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get localStorage usage information
 */
export function getStorageInfo(): { used: number; available: number; percentage: number } {
  try {
    let used = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }
    
    // Approximate available space (5MB is typical limit)
    const available = 5 * 1024 * 1024 - used;
    const percentage = (used / (5 * 1024 * 1024)) * 100;
    
    return { used, available, percentage };
  } catch {
    return { used: 0, available: 0, percentage: 0 };
  }
}

/**
 * Clear localStorage safely
 */
export function safeClearStorage(): boolean {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
}

/**
 * Get user-friendly error message
 */
export function getStorageErrorMessage(error: StorageError): string {
  switch (error.type) {
    case 'quota_exceeded':
      return 'Storage is full. Please clear some data or use incognito mode.';
    case 'corrupted_data':
      return 'Data could not be saved. Please refresh the page.';
    case 'unavailable':
      return 'Storage is not available. Data may not be saved.';
    default:
      return 'An error occurred while accessing storage.';
  }
}
