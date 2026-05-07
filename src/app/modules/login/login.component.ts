import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  host: { class: 'lp-host' }
})
export class LoginComponent {
  private auth    = inject(AuthService);
  private router  = inject(Router);
  private route   = inject(ActivatedRoute);

  username = '';
  password = '';
  showPw   = false;
  loading  = false;
  error    = false;
  shaking  = false;

  readonly demos = this.auth.getMockCredentials();

  fillDemo(d: { username: string; password: string }): void {
    this.username = d.username;
    this.password = d.password;
    this.error    = false;
  }

  onSubmit(): void {
    if (this.loading) return;
    this.loading = true;
    this.error   = false;

    // Small artificial delay — swap for real API call later
    setTimeout(() => {
      const ok = this.auth.login(this.username, this.password);
      this.loading = false;
      if (ok) {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      } else {
        this.error   = true;
        this.shaking = true;
        setTimeout(() => (this.shaking = false), 600);
      }
    }, 400);
  }
}
