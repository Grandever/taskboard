import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { User, UserRole, UserStatus } from '../models/task.interfaces';

const LOCAL_STORAGE_KEY = 'taskboard/v1/tasks';

export const localStorageTasksInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  // Only intercept GETs to the tasks endpoint
  const url = new URL(req.url, window.location.origin);
  if (req.method === 'GET' && url.pathname === '/taskboard/v1/tasks') {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const body = raw ? JSON.parse(raw) : [];

      // Optionally, we could apply server-like pagination/sorting here using req.params
      // For now we return the full array as-is; the client paginates.

      return of(
        new HttpResponse({
          status: 200,
          body,
          headers: req.headers,
          url: req.urlWithParams,
        })
      );
    } catch (error) {
      console.error('LocalStorage error in interceptor:', error);
      // Return empty array if localStorage is corrupted or full
      return of(
        new HttpResponse({
          status: 200,
          body: [],
          headers: req.headers,
          url: req.urlWithParams,
        })
      );
    }
  }

  // Seed users if not present
  if (req.method === 'GET' && url.pathname === '/taskboard/v1/users') {
    try {
      const usersKey = 'taskboard/v1/users';
      let rawUsers = localStorage.getItem(usersKey);
      if (!rawUsers) {
        const seed: User[] = generateSeedUsers();
        try {
          localStorage.setItem(usersKey, JSON.stringify(seed));
          rawUsers = JSON.stringify(seed);
        } catch (storageError) {
          console.error('Failed to save users to localStorage:', storageError);
          // Continue with in-memory seed users
        }
      }
      const users = rawUsers ? JSON.parse(rawUsers) : [];
      return of(new HttpResponse({ status: 200, body: users, headers: req.headers, url: req.urlWithParams }));
    } catch (error) {
      console.error('LocalStorage error for users:', error);
      // Return seed users if localStorage is corrupted
      const seedUsers = generateSeedUsers();
      return of(new HttpResponse({ status: 200, body: seedUsers, headers: req.headers, url: req.urlWithParams }));
    }
  }

  return next(req);
};

function generateSeedUsers(): User[] {
  const names = [
    ['Ali', 'Karimov', 'karimov'],
    ['Laylo', 'Ismoilova', 'ismoilova'],
    ['Jasur', 'Beknazarov', 'beknazarov'],
    ['Nigora', 'Sattorova', 'sattorova'],
    ['Timur', 'Akbarov', 'akbarov'],
  ];
  const styles = ['adventurer', 'identicon', 'thumbs', 'fun-emoji', 'bottts'];
  const now = new Date().toISOString();
  return names.map((n, i) => {
    const style = styles[Math.floor(Math.random() * styles.length)];
    const seed = `${n[2]}-${Math.floor(Math.random() * 100000)}`;
    const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
    return {
      id: String(i + 1),
      firstName: n[0],
      lastName: n[1],
      username: n[2],
      email: `${n[2]}@example.com`,
      avatarUrl,
      role: UserRole.DEVELOPER,
      status: UserStatus.ACTIVE,
      created_at: now,
      updated_at: now,
    };
  });
}


