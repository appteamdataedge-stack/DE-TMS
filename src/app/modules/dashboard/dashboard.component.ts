import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MmDealApiService } from '../mm-deal/mm-deal-api.service';
import { StoredDeal } from '../mm-deal/sqlite.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  readonly greeting   = this.getGreeting();
  get currentUserName(): string {
    return this.authService.currentUser?.displayName ?? 'there';
  }
  readonly todayLabel = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date());

  // ── Live stats ─────────────────────────────────────────────────────────────
  totalDealsCount   = 0;
  totalFaceValue    = 0;
  dealsByStatus: Array<{ label: string; count: number; color: string }> = [];
  recentDeals: StoredDeal[] = [];

  // ── Count-up animation state ───────────────────────────────────────────────
  displayDealsCount     = 0;
  displayFaceValue      = 0;

  // ── Static widgets (kept as-is, live data injected) ───────────────────────
  readonly kpis = [
    { icon: 'exposure', label: 'Total MM Exposure', value: 'BDT 53.2M', sub: '5 active deals',           badge: '+2 this week',   up: true,  color: 'navy'   },
    { icon: 'deals',    label: 'Active Deals',       value: '5',          sub: '2 ACCEPT · 3 PLACE',       badge: null,             up: null,  color: 'teal'   },
    { icon: 'calendar', label: 'Maturing ≤ 90d',     value: '2',          sub: 'Nearest: 19 Jul 2026',     badge: 'Action needed',  up: false, color: 'amber'  },
    { icon: 'rate',     label: 'Avg Rate (MM)',       value: '5.45%',      sub: 'Benchmark: 5.30%',         badge: '+15 bps',        up: true,  color: 'purple' },
  ];

  readonly activeDeals = [
    { id: 'MM-2026-00001', cp: 'City Bank Ltd',         dir: 'PLACE',  ccy: 'BDT', amount: '10,000,000', rate: '5.80', maturity: '22 Oct 2026', days: 183 },
    { id: 'MM-2026-00002', cp: 'BRAC Bank',              dir: 'PLACE',  ccy: 'USD', amount: '5,000,000',  rate: '5.20', maturity: '22 Jul 2026', days: 91  },
    { id: 'MM-2026-00003', cp: 'Sonali Bank',            dir: 'ACCEPT', ccy: 'BDT', amount: '15,000,000', rate: '6.50', maturity: '23 Jan 2027', days: 275 },
    { id: 'MM-2026-00004', cp: 'Janata Bank',            dir: 'ACCEPT', ccy: 'BDT', amount: '13,000,000', rate: '6.00', maturity: '23 Oct 2026', days: 184 },
    { id: 'MM-2026-00005', cp: 'Standard Chartered BD',  dir: 'ACCEPT', ccy: 'USD', amount: '2,000,000',  rate: '4.80', maturity: '19 Jul 2026', days: 88  },
  ];

  readonly maturingDeals = [
    { id: 'MM-2026-00001', cp: 'City Bank',  ccy: 'BDT', amount: '10M', maturity: '22 Oct', days: 183, color: 'indigo',  barPct: 100 },
    { id: 'MM-2026-00002', cp: 'BRAC Bank',  ccy: 'USD', amount: '5M',  maturity: '22 Jul', days: 91,  color: 'emerald', barPct: 50  },
    { id: 'MM-2026-00005', cp: 'Std Chtd',   ccy: 'USD', amount: '2M',  maturity: '19 Jul', days: 88,  color: 'indigo',  barPct: 48  },
  ];

  readonly currencyExposure = [
    { currency: 'BDT', amount: 'BDT 38M', pct: 71.7, color: 'navy'    },
    { currency: 'USD', amount: 'USD 7M',  pct: 13.2, color: 'emerald' },
    { currency: 'GBP', amount: 'GBP 1M',  pct: 1.9,  color: 'violet'  },
  ];

  readonly auditEvents = [
    { time: '10:34',     text: 'MM-2026-00001 authorized by S Ahmed',               dot: 'green'   },
    { time: '09:14',     text: 'PRTF-2026-001 submitted for approval by MD Rahman', dot: 'amber'   },
    { time: '08:55',     text: 'MM-2026-00002 released by KM Hossain',              dot: 'teal'    },
    { time: 'Yesterday', text: 'BP004 Standard Chartered — role updated',           dot: 'neutral' },
  ];

  constructor(private mmDealApi: MmDealApiService, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadLiveData();
  }

  loadLiveData(): void {
    this.mmDealApi.getDealStats().subscribe(stats => {
      this.totalDealsCount = stats.totalDeals;
      this.totalFaceValue  = stats.totalFaceValue;

      // Build status breakdown
      const statusColors: Record<string, string> = {
        SAVED: 'teal', AUTHORIZED: 'navy', REJECTED: 'red', MATURED: 'neutral'
      };
      this.dealsByStatus = Object.entries(stats.byStatus).map(([label, count]) => ({
        label, count, color: statusColors[label] ?? 'neutral'
      }));

      this.recentDeals = stats.recentDeals;

      // Count-up animation
      this.animateCount('displayDealsCount', stats.totalDeals, 800);
      this.animateCount('displayFaceValue',  stats.totalFaceValue, 1000);
    });
  }

  private animateCount(prop: 'displayDealsCount' | 'displayFaceValue', target: number, duration: number): void {
    if (target === 0) { this[prop] = 0; return; }
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      this[prop] = Math.round(progress * target);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  get donutGradient(): string {
    if (this.totalDealsCount === 0) return 'conic-gradient(var(--de-neutral-200) 0deg 360deg)';
    const statusColorHex: Record<string, string> = {
      SAVED: '#0BA974', AUTHORIZED: '#0D1117', REJECTED: '#E5484D', MATURED: '#9CA3B2'
    };
    let deg = 0;
    const parts: string[] = [];
    for (const s of this.dealsByStatus) {
      const pct = s.count / this.totalDealsCount;
      const end = deg + pct * 360;
      const col = statusColorHex[s.label] ?? '#9CA3B2';
      parts.push(`${col} ${deg.toFixed(1)}deg ${end.toFixed(1)}deg`);
      deg = end;
    }
    return `conic-gradient(${parts.join(', ')})`;
  }

  fmtAmount(n: number): string {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000)         return `${(n / 1_000).toFixed(2)}K`;
    return n.toLocaleString();
  }

  dirBadge(dir: string): string { return dir === 'ACCEPT' ? 'teal' : 'navy'; }

  daysBadge(days: number): string {
    if (days <= 30) return 'red';
    if (days <= 90) return 'amber';
    return 'neutral';
  }

  private getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }
}
