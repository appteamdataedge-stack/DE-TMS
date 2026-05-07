import { Component, HostListener, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LayoutService } from '../../services/layout.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'de-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {
  private layout = inject(LayoutService);
  auth           = inject(AuthService);

  hasNotification = true;
  showUserMenu    = false;
  clockTime       = '';
  clockDate       = '';

  private _clockTimer: ReturnType<typeof setInterval> | null = null;

  get currentUser() { return this.auth.currentUser; }

  ngOnInit(): void {
    this._tick();
    this._clockTimer = setInterval(() => this._tick(), 1000);
  }

  ngOnDestroy(): void {
    if (this._clockTimer) clearInterval(this._clockTimer);
  }

  private _tick(): void {
    const now = new Date();
    this.clockTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.clockDate = now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  }

  toggleUserMenu(): void { this.showUserMenu = !this.showUserMenu; }
  toggleSidebar():  void { this.layout.toggle(); }

  signOut(): void {
    this.showUserMenu = false;
    this.auth.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: Event): void {
    if (!(e.target as HTMLElement).closest('.de-navbar__user-area')) {
      this.showUserMenu = false;
    }
  }
}
