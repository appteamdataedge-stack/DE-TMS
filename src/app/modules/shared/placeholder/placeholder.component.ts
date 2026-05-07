import { Component, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav class="de-breadcrumb">
      <a routerLink="/dashboard">Home</a><span class="sep">›</span>
      <span class="current">{{ title }}</span>
    </nav>
    <div class="ph-wrap">
      <div class="de-card ph-card">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.2" stroke-linecap="round" class="ph-icon">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
        </svg>
        <h2 class="ph-title">{{ title }}</h2>
        <p class="ph-sub">This module is coming soon. Check back in a future release.</p>
        <a routerLink="/dashboard" class="de-btn de-btn--outline">← Back to Dashboard</a>
      </div>
    </div>
  `,
  styles: [`
    .ph-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 55vh;
    }
    .ph-card {
      text-align: center;
      padding: 56px 48px;
      max-width: 420px;
      width: 100%;
    }
    .ph-icon {
      color: var(--de-neutral-300);
      margin-bottom: 20px;
    }
    .ph-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--de-navy);
      margin: 0 0 8px;
    }
    .ph-sub {
      font-size: 14px;
      color: var(--de-neutral-500);
      margin: 0 0 24px;
      line-height: 1.5;
    }
  `]
})
export class PlaceholderComponent {
  title: string;
  constructor() {
    const route = inject(ActivatedRoute);
    this.title = (route.snapshot.data['title'] as string) ?? 'Coming Soon';
  }
}
