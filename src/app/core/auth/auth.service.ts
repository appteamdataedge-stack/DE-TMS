import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { Role, TmsUser, ROUTE_PERMISSIONS, ACTION_PERMISSIONS, ALL_ROLES } from './roles';

interface MockUser extends TmsUser { password: string; }

const MOCK_USERS: MockUser[] = [
  { username: 'dealer1',  password: 'dealer123', displayName: 'MD Rahman',    role: 'DEALER',       initials: 'MR', segment: 'Money Market Dealer'    },
  { username: 'checker1', password: 'checker123', displayName: 'S Ahmed',      role: 'CHECKER',      initials: 'SA', segment: 'Authorization Checker'  },
  { username: 'backoff1', password: 'back123',    displayName: 'N Chowdhury',  role: 'BACK_OFFICE',  initials: 'NC', segment: 'Back Office Operations'  },
  { username: 'risk1',    password: 'risk123',    displayName: 'R Islam',      role: 'RISK_OFFICER', initials: 'RI', segment: 'Risk Management'         },
  { username: 'admin1',   password: 'admin123',   displayName: 'KM Hossain',   role: 'ADMIN',        initials: 'KH', segment: 'System Administrator'   },
];

const STORAGE_KEY = 'tms_user';

// Sorted once: longest key first, so most-specific route wins.
const SORTED_ROUTE_KEYS = Object.keys(ROUTE_PERMISSIONS).sort((a, b) => b.length - a.length);

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);

  private _user$ = new BehaviorSubject<TmsUser | null>(this.loadFromStorage());
  readonly currentUser$ = this._user$.asObservable();

  get currentUser(): TmsUser | null { return this._user$.value; }

  private loadFromStorage(): TmsUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as TmsUser) : null;
    } catch { return null; }
  }

  login(username: string, password: string): boolean {
    // Check static mock users
    const found = MOCK_USERS.find(u => u.username === username && u.password === password);
    if (found) {
      const { password: _pw, ...user } = found;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      this._user$.next(user);
      return true;
    }
    // TODO: replace with real POST /api/auth/login when backend is ready
    // Check dynamically created users stored in localStorage
    try {
      const created: Array<{username:string;password:string;displayName:string;role:string;initials:string;segment:string}> =
        JSON.parse(localStorage.getItem('tms_created_users') ?? '[]');
      const dynUser = created.find(u => u.username === username && u.password === password);
      if (dynUser) {
        const user: TmsUser = {
          username:    dynUser.username,
          displayName: dynUser.displayName,
          role:        dynUser.role as Role,
          initials:    dynUser.initials,
          segment:     dynUser.segment,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        this._user$.next(user);
        return true;
      }
    } catch { /* ignore parse errors */ }
    return false;
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this._user$.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean { return !!this._user$.value; }

  hasAccess(routePath: string): boolean {
    const user = this._user$.value;
    if (!user) return false;
    if (user.role === 'ADMIN') return true;

    const path = routePath.replace(/^\//, '').split('?')[0];
    const key = SORTED_ROUTE_KEYS.find(k => path === k || path.startsWith(k + '/'));
    if (!key) return true; // no rule defined → open to all authenticated users
    return (ROUTE_PERMISSIONS[key] ?? ALL_ROLES).includes(user.role);
  }

  canDo(action: string): boolean {
    const user = this._user$.value;
    if (!user) return false;
    return (ACTION_PERMISSIONS[action] ?? []).includes(user.role);
  }

  getMockCredentials(): { label: string; username: string; password: string }[] {
    return [
      { label: 'Dealer',      username: 'dealer1',  password: 'dealer123' },
      { label: 'Checker',     username: 'checker1', password: 'checker123' },
      { label: 'Back Office', username: 'backoff1', password: 'back123'   },
      { label: 'Risk Officer',username: 'risk1',    password: 'risk123'   },
      { label: 'Admin',       username: 'admin1',   password: 'admin123'  },
    ];
  }
}
