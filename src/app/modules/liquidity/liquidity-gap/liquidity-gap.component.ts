import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';

interface LiqDeal {
  id: string;
  counterparty: string;
  instrument: string;
  direction: 'IN' | 'OUT';
  currency: string;
  amount: number;
}

export interface LiqBucket {
  id: string;
  label: string;
  shortLabel: string;
  inflows: number;
  outflows: number;
  netGap: number;
  cumulativeGap: number;
  limit: number;
  status: 'OK' | 'WARNING' | 'BREACH';
  deals: LiqDeal[];
}

@Component({
  selector: 'app-liquidity-gap',
  standalone: true,
  imports: [CommonModule, RouterLink],
  animations: [
    trigger('drill', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-6px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('140ms ease-in', style({ opacity: 0, transform: 'translateY(-4px)' }))
      ])
    ])
  ],
  templateUrl: './liquidity-gap.component.html',
  styleUrl: './liquidity-gap.component.scss'
})
export class LiquidityGapComponent {

  expandedBucket: string | null = null;

  readonly buckets: LiqBucket[] = [
    {
      id: 'ON', label: 'Overnight', shortLabel: 'O/N',
      inflows: 45_000_000, outflows: 50_000_000,
      netGap: -5_000_000, cumulativeGap: -5_000_000,
      limit: -10_000_000, status: 'WARNING',
      deals: [
        { id: 'MM-2026-00010', counterparty: 'City Bank Ltd',         instrument: 'Overnight Deposit',       direction: 'IN',  currency: 'USD', amount:  1_500_000 },
        { id: 'MM-2026-00005', counterparty: 'Standard Chartered BD', instrument: 'Overnight Deposit',       direction: 'IN',  currency: 'USD', amount:  2_000_000 },
        { id: 'CF-OUT-001',    counterparty: 'Internal Treasury',     instrument: 'Call Liability',          direction: 'OUT', currency: 'BDT', amount: 50_000_000 },
      ]
    },
    {
      id: '1W', label: '1 Week', shortLabel: '1W',
      inflows: 120_000_000, outflows: 80_000_000,
      netGap: 40_000_000, cumulativeGap: 35_000_000,
      limit: -20_000_000, status: 'OK',
      deals: [
        { id: 'MM-2026-00001', counterparty: 'City Bank Ltd',         instrument: 'Fixed Term Deposit',      direction: 'IN',  currency: 'BDT', amount: 10_000_000 },
        { id: 'MM-2026-00002', counterparty: 'BRAC Bank',             instrument: 'Fixed Term Deposit',      direction: 'IN',  currency: 'USD', amount:  5_000_000 },
        { id: 'MM-2026-00006', counterparty: 'Dutch-Bangla Bank',     instrument: 'Repo Agreement',          direction: 'OUT', currency: 'BDT', amount:  8_000_000 },
      ]
    },
    {
      id: '2W', label: '2 Weeks', shortLabel: '2W',
      inflows: 85_000_000, outflows: 110_000_000,
      netGap: -25_000_000, cumulativeGap: 10_000_000,
      limit: -30_000_000, status: 'OK',
      deals: [
        { id: 'MM-2026-00011', counterparty: 'Al-Arafah Islami Bank', instrument: 'Fixed Term Deposit',      direction: 'IN',  currency: 'BDT', amount:  7_500_000 },
        { id: 'CF-OUT-002',    counterparty: 'Treasury Ops',          instrument: 'Bond Maturity Payout',    direction: 'OUT', currency: 'BDT', amount: 25_000_000 },
      ]
    },
    {
      id: '1M', label: '1 Month', shortLabel: '1M',
      inflows: 200_000_000, outflows: 180_000_000,
      netGap: 20_000_000, cumulativeGap: 30_000_000,
      limit: -50_000_000, status: 'OK',
      deals: [
        { id: 'MM-2026-00003', counterparty: 'Sonali Bank',           instrument: 'Fixed Term Deposit',      direction: 'IN',  currency: 'BDT', amount: 15_000_000 },
        { id: 'MM-2026-00004', counterparty: 'Janata Bank',           instrument: 'Call Deposit',            direction: 'IN',  currency: 'BDT', amount: 13_000_000 },
        { id: 'CF-OUT-003',    counterparty: 'Loan Disbursement',     instrument: 'Corporate Term Loan',     direction: 'OUT', currency: 'BDT', amount: 80_000_000 },
      ]
    },
    {
      id: '3M', label: '3 Months', shortLabel: '3M',
      inflows: 350_000_000, outflows: 290_000_000,
      netGap: 60_000_000, cumulativeGap: 90_000_000,
      limit: -80_000_000, status: 'OK',
      deals: [
        { id: 'MM-2026-00007', counterparty: 'Islami Bank Bangladesh', instrument: 'Fixed Term Deposit',     direction: 'IN',  currency: 'BDT', amount: 20_000_000 },
        { id: 'MM-2026-00008', counterparty: 'HSBC Bangladesh',        instrument: 'Treasury Bill',          direction: 'IN',  currency: 'USD', amount:  3_000_000 },
        { id: 'CF-OUT-004',    counterparty: 'Corporate Clients',      instrument: 'Revolving Credit Util',  direction: 'OUT', currency: 'BDT', amount: 120_000_000 },
      ]
    },
    {
      id: '6M', label: '6 Months', shortLabel: '6M',
      inflows: 420_000_000, outflows: 380_000_000,
      netGap: 40_000_000, cumulativeGap: 130_000_000,
      limit: -100_000_000, status: 'OK',
      deals: [
        { id: 'MM-2026-00009', counterparty: 'BRAC Bank',             instrument: 'Fixed Term Deposit',      direction: 'IN',  currency: 'BDT', amount: 12_000_000 },
        { id: 'CF-IN-005',     counterparty: 'Loan Repayments',       instrument: 'Term Loan Repayment',     direction: 'IN',  currency: 'BDT', amount: 150_000_000 },
        { id: 'CF-OUT-005',    counterparty: 'Bond Redemption',       instrument: 'Subordinated Debenture',  direction: 'OUT', currency: 'BDT', amount: 200_000_000 },
      ]
    },
    {
      id: '1Y', label: '1 Year', shortLabel: '1Y',
      inflows: 180_000_000, outflows: 240_000_000,
      netGap: -60_000_000, cumulativeGap: 70_000_000,
      limit: -80_000_000, status: 'WARNING',
      deals: [
        { id: 'CF-IN-006',     counterparty: 'Retail Deposit Pool',   instrument: 'Retail Fixed Deposits',   direction: 'IN',  currency: 'BDT', amount:  80_000_000 },
        { id: 'CF-OUT-006',    counterparty: 'Subordinated Debt',     instrument: 'Tier 2 Capital Note',     direction: 'OUT', currency: 'BDT', amount: 150_000_000 },
      ]
    },
    {
      id: 'GT1Y', label: '>1 Year', shortLabel: '>1Y',
      inflows: 320_000_000, outflows: 280_000_000,
      netGap: 40_000_000, cumulativeGap: 110_000_000,
      limit: -100_000_000, status: 'OK',
      deals: [
        { id: 'CF-IN-007',     counterparty: 'Equity Capital',        instrument: 'Paid-up Capital Reserve', direction: 'IN',  currency: 'BDT', amount: 200_000_000 },
        { id: 'CF-OUT-007',    counterparty: 'Syndicated Lending',    instrument: 'Long-term Facility',      direction: 'OUT', currency: 'BDT', amount: 150_000_000 },
      ]
    },
  ];

  toggleBucket(id: string): void {
    this.expandedBucket = this.expandedBucket === id ? null : id;
  }

  get totalInflows():  number { return this.buckets.reduce((s, b) => s + b.inflows,  0); }
  get totalOutflows(): number { return this.buckets.reduce((s, b) => s + b.outflows, 0); }
  get netPosition():   number { return this.totalInflows - this.totalOutflows; }
  get alertCount():    number { return this.buckets.filter(b => b.status !== 'OK').length; }

  statusBadge(s: string): string {
    return ({ OK: 'teal', WARNING: 'amber', BREACH: 'red' } as Record<string, string>)[s] ?? 'neutral';
  }

  fmtM(n: number): string {
    const abs = Math.abs(n) / 1_000_000;
    return (n < 0 ? '–' : '+') + abs.toFixed(1) + 'M';
  }

  fmtAmt(n: number): string {
    return new Intl.NumberFormat('en-US').format(n);
  }

  // ── SVG Chart ──────────────────────────────────────────────────────────────

  private readonly W  = 700;
  private readonly H  = 220;
  private readonly PL = 62;
  private readonly PR = 16;
  private readonly PT = 16;
  private readonly PB = 36;

  private cX(i: number): number {
    return this.PL + (i / (this.buckets.length - 1)) * (this.W - this.PL - this.PR);
  }

  private cY(val: number, min: number, max: number): number {
    const range = max - min || 1;
    return this.PT + (1 - (val - min) / range) * (this.H - this.PT - this.PB);
  }

  get chart(): {
    vb: string;
    inPts: string; outPts: string; netPts: string;
    zeroY: number;
    xLabels: { x: number; label: string }[];
    yLabels: { y: number; label: string }[];
    netDots: { x: number; y: number; color: string }[];
  } {
    const inArr  = this.buckets.map(b => b.inflows);
    const outArr = this.buckets.map(b => b.outflows);
    const netArr = this.buckets.map(b => b.netGap);

    const all = [...inArr, ...outArr, ...netArr];
    const min = Math.min(...all);
    const max = Math.max(...all);

    const pts = (arr: number[]) =>
      arr.map((v, i) => `${this.cX(i).toFixed(1)},${this.cY(v, min, max).toFixed(1)}`).join(' ');

    const yLabels = Array.from({ length: 5 }, (_, i) => {
      const val = min + (i / 4) * (max - min);
      return { y: this.cY(val, min, max), label: (val / 1_000_000).toFixed(0) + 'M' };
    }).reverse();

    const xLabels = this.buckets.map((b, i) => ({ x: this.cX(i), label: b.shortLabel }));

    const netDots = this.buckets.map((b, i) => ({
      x: this.cX(i),
      y: this.cY(b.netGap, min, max),
      color: b.status === 'WARNING' ? 'var(--de-amber)' : b.status === 'BREACH' ? 'var(--de-red)' : 'var(--de-teal)'
    }));

    return {
      vb: `0 0 ${this.W} ${this.H}`,
      inPts: pts(inArr), outPts: pts(outArr), netPts: pts(netArr),
      zeroY: this.cY(0, min, max),
      xLabels, yLabels, netDots
    };
  }
}
