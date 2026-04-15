import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment.prod';


export interface CurrentUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface LoginResponse {
  token: string;
  user: CurrentUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly tokenKey = environment.tokenKey;

  currentUser = signal<CurrentUser | null>(null);
  isLoggedIn = signal<boolean>(this.hasToken());

  constructor(private http: HttpClient, private router: Router) {}

  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  syncSessionFromStorage(): boolean {
    const hasToken = this.hasToken();

    if (!hasToken) {
      this.currentUser.set(null);
    }

    this.isLoggedIn.set(hasToken);
    return hasToken;
  }

  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(({ token, user }) => {
          localStorage.setItem(this.tokenKey, token);
          this.currentUser.set(user);
          this.isLoggedIn.set(true);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
    this.router.navigate(['/signin']);
  }

  handleSessionExpired(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUser.set(null);
    this.isLoggedIn.set(false);

    if (this.router.url !== '/signin') {
      this.router.navigate(['/signin']);
    }
  }

  fetchMe() {
    return this.http
      .get<CurrentUser>(`${this.apiUrl}/auth/me`)
      .pipe(tap((user) => this.currentUser.set(user)));
  }
}
