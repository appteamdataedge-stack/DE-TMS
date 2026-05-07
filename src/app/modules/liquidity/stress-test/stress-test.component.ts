import { Component, ChangeDetectorRef, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface StressKPIs {
  survivalDays: number;
  lcr: number;
  nsfr: number;
  peakGap: number;
}

interface BucketResult {
  label: string;
  shortLabel: string;
  baseGap: number;
  stressedGap: number;
  difference: number;
  changed: boolean;
  status: 'OK' | 'WARNING' | 'BREACH';
}

type Scenario = 'BASE' | 'MODERATE' | 'SEVERE' | 'CATASTROPHIC';

@Component({
  selector: 'app-stress-test',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './stress-test.component.html',
  styleUrl: './stress-test.component.scss'
})
export class StressTestComponent implements OnDestroy {

  private cdr = inject(ChangeDetectorRef);
  private simInterval?: ReturnType<typeof setInterval>;

  scenario: Scenario = 'BASE';
  haircut           = 0;
  retailOutflow     = 0;
  corpWithdrawal    = 0;
  fxShock           = false;
  showDiffOnly      = false;
  running           = false;

  readonly scenarios: Scenario[] = ['BASE', 'MODERATE', 'SEVERE', 'CATASTROPHIC'];

  readonly bucketLabels = ['Overnight', '1 Week', '2 Weeks', '1 Month', '3 Months', '6 Months', '1 Year', '>1 Year'];
  readonly shortLabels  = ['O/N', '1W', '2W', '1M', '3M', '6M', '1Y', '>1Y'];

  private readonly baseGaps = [-5, 40, -25, 20, 60, 40, -60, 40].map(x => x * 1_000_000);

  private readonly kpiPresets: Record<Scenario, StressKPIs> = {
    BASE:         { survivalDays: 185, lcr: 132.0, nsfr: 114.0, peakGap:   -5_000_000 },
    MODERATE:     { survivalDays: 145, lcr: 112.0, nsfr:  98.0, peakGap:  -35_000_000 },
    SEVERE:       { survivalDays:  95, lcr:  88.0, nsfr:  85.0, peakGap: -120_000_000 },
    CATASTROPHIC: { survivalDays:  45, lcr:  62.0, nsfr:  71.0, peakGap: -280_000_000 },
  };

  private readonly gapPresets: Record<Scenario, number[]> = {
    BASE:         [-5,  40, -25,  20,  60,  40,  -60,  40].map(x => x * 1_000_000),
    MODERATE:     [-18, 28, -42,   8,  38,  18,  -88,  22].map(x => x * 1_000_000),
    SEVERE:       [-35, 10, -68, -18,   8, -22, -135,   2].map(x => x * 1_000_000),
    CATASTROPHIC: [-62,-15,-105, -55, -35, -85, -210, -38].map(x => x * 1_000_000),
  };

  private readonly paramPresets: Record<Scenario, { haircut: number; retailOutflow: number; corpWithdrawal: number; fxShock: boolean }> = {
    BASE:         { haircut:  0, retailOutflow:  0, corpWithdrawal:  0, fxShock: false },
    MODERATE:     { haircut: 10, retailOutflow:  8, corpWithdrawal: 15, fxShock: false },
    SEVERE:       { haircut: 25, retailOutflow: 15, corpWithdrawal: 30, fxShock: true  },
    CATASTROPHIC: { haircut: 45, retailOutflow: 25, corpWithdrawal: 50, fxShock: true  },
  };

  displayKPIs: StressKPIs = { ...this.kpiPresets['BASE'] };
  currentGaps: number[]   = [...this.gapPresets['BASE']];

  selectScenario(s: Scenario): void {
    this.scenario = s;
    const p = this.paramPresets[s];
    this.haircut        = p.haircut;
    this.retailOutflow  = p.retailOutflow;
    this.corpWithdrawal = p.corpWithdrawal;
    this.fxShock        = p.fxShock;
  }

  runSimulation(): void {
    if (this.running) return;
    this.running = true;

    const from: StressKPIs = { ...this.displayKPIs };
    const to: StressKPIs   = { ...this.kpiPresets[this.scenario] };
    const toGaps = [...this.gapPresets[this.scenario]];

    const steps = 30;
    let step = 0;

    this.simInterval = setInterval(() => {
      step++;
      const t = step / steps;
      const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;  // ease-in-out

      this.displayKPIs = {
        survivalDays: Math.round(from.survivalDays + (to.survivalDays - from.survivalDays) * e),
        lcr:           from.lcr    + (to.lcr    - from.lcr)    * e,
        nsfr:          from.nsfr   + (to.nsfr   - from.nsfr)   * e,
        peakGap:       from.peakGap + (to.peakGap - from.peakGap) * e,
      };
      this.cdr.detectChanges();

      if (step >= steps) {
        clearInterval(this.simInterval);
        this.displayKPIs = to;
        this.currentGaps = toGaps;
        this.running     = false;
        this.cdr.detectChanges();
      }
    }, 20);
  }

  resetSimulation(): void {
    this.selectScenario('BASE');
    this.displayKPIs = { ...this.kpiPresets['BASE'] };
    this.currentGaps = [...this.gapPresets['BASE']];
    this.showDiffOnly = false;
  }

  ngOnDestroy(): void {
    if (this.simInterval) clearInterval(this.simInterval);
  }

  // ── Computed results ────────────────────────────────────────────────────

  get bucketResults(): BucketResult[] {
    return this.bucketLabels.map((label, i) => {
      const baseGap     = this.baseGaps[i];
      const stressedGap = this.currentGaps[i];
      const difference  = stressedGap - baseGap;
      const changed     = Math.abs(difference) > 5_000_000;
      let status: 'OK' | 'WARNING' | 'BREACH' = 'OK';
      if (stressedGap < -100_000_000)  status = 'BREACH';
      else if (stressedGap < -20_000_000) status = 'WARNING';
      return { label, shortLabel: this.shortLabels[i], baseGap, stressedGap, difference, changed, status };
    });
  }

  get visibleResults(): BucketResult[] {
    return this.showDiffOnly ? this.bucketResults.filter(r => r.changed) : this.bucketResults;
  }

  get showRemediation(): boolean {
    return this.displayKPIs.lcr < 100 ||
           this.displayKPIs.survivalDays < 90 ||
           this.displayKPIs.peakGap < -100_000_000;
  }

  kpiColor(metric: 'lcr' | 'nsfr' | 'survival'): string {
    if (metric === 'lcr') {
      if (this.displayKPIs.lcr >= 120) return 'teal';
      if (this.displayKPIs.lcr >= 100) return 'amber';
      return 'red';
    }
    if (metric === 'nsfr') {
      if (this.displayKPIs.nsfr >= 110) return 'teal';
      if (this.displayKPIs.nsfr >= 100) return 'amber';
      return 'red';
    }
    if (this.displayKPIs.survivalDays >= 150) return 'teal';
    if (this.displayKPIs.survivalDays >= 90)  return 'amber';
    return 'red';
  }

  statusBadge(s: string): string {
    return ({ OK: 'teal', WARNING: 'amber', BREACH: 'red' } as Record<string, string>)[s] ?? 'neutral';
  }

  fmtM(n: number): string {
    const abs = Math.abs(n) / 1_000_000;
    return (n < 0 ? '–' : '+') + abs.toFixed(0) + 'M';
  }

  fmtPct(n: number): string { return n.toFixed(1) + '%'; }

  // ── SVG Stress Chart ────────────────────────────────────────────────────

  private readonly W  = 700;
  private readonly H  = 200;
  private readonly PL = 60;
  private readonly PR = 20;
  private readonly PT = 16;
  private readonly PB = 36;
  private readonly BREACH_LINE = -100_000_000;

  private cX(i: number): number {
    return this.PL + (i / (this.shortLabels.length - 1)) * (this.W - this.PL - this.PR);
  }

  private cY(val: number, min: number, max: number): number {
    const range = max - min || 1;
    return this.PT + (1 - (val - min) / range) * (this.H - this.PT - this.PB);
  }

  get stressChart(): {
    vb: string;
    basePts: string; stressPts: string;
    zeroY: number; breachY: number;
    xLabels: { x: number; label: string }[];
    yLabels: { y: number; label: string }[];
    breachDots: { x: number; y: number }[];
  } {
    const base     = this.baseGaps;
    const stressed = this.currentGaps;

    const all = [...base, ...stressed, this.BREACH_LINE, 0];
    const min = Math.min(...all);
    const max = Math.max(...all);

    const pts = (arr: number[]) =>
      arr.map((v, i) => `${this.cX(i).toFixed(1)},${this.cY(v, min, max).toFixed(1)}`).join(' ');

    const yLabels = Array.from({ length: 5 }, (_, i) => {
      const val = min + (i / 4) * (max - min);
      return { y: this.cY(val, min, max), label: (val / 1_000_000).toFixed(0) + 'M' };
    }).reverse();

    const xLabels = this.shortLabels.map((label, i) => ({ x: this.cX(i), label }));

    const breachDots = stressed
      .map((v, i) => ({ x: this.cX(i), y: this.cY(v, min, max), isBreach: v < this.BREACH_LINE }))
      .filter(d => d.isBreach);

    return {
      vb: `0 0 ${this.W} ${this.H}`,
      basePts:    pts(base),
      stressPts:  pts(stressed),
      zeroY:      this.cY(0, min, max),
      breachY:    this.cY(this.BREACH_LINE, min, max),
      xLabels,
      yLabels,
      breachDots,
    };
  }
}
