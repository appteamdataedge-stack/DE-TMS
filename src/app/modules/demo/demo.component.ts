import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Scenario {
  id: number;
  label: string;
  category: string;
  title: string;
  description: string;
  steps: string[];
  startRoute: string;
  color: 'teal' | 'navy' | 'green' | 'amber' | 'violet';
}

const LS_KEY = 'tms_demo_completed';

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './demo.component.html',
  styleUrl: './demo.component.scss'
})
export class DemoComponent implements OnInit {

  readonly scenarios: Scenario[] = [
    {
      id: 1,
      label: 'Scenario 1 · Operations',
      category: 'Operations',
      title: 'Book a New MM Term Deposit',
      description: 'Create a BDT 10,000,000 fixed-rate term deposit with City Bank Ltd. Enter counterparty details, deposit amount, interest rate, and tenor to generate a fully-formed deal ticket.',
      steps: [
        'Navigate to Money Market → MM Deals',
        'Fill in Step 1 – Basics (counterparty, direction, instrument)',
        'Complete Step 2 – Deposit (amount, currency, value date, maturity date)',
        'Set Step 3 – Interest (rate type, rate %, day count)',
        'Review the deal summary and click Submit'
      ],
      startRoute: '/mm-deal/create/basics',
      color: 'teal'
    },
    {
      id: 2,
      label: 'Scenario 2 · Workflow',
      category: 'Workflow',
      title: 'Submit a Deal for Authorization',
      description: 'After booking, submit the deal into the maker-checker workflow. Observe how the deal status transitions from DRAFT → SUBMITTED and appears in the Authorization Inbox for a second user.',
      steps: [
        'Open the Blotter and locate the DRAFT deal',
        'Click the deal ID to open the Deal Detail page',
        'Review the summary, then click Submit for Authorization',
        'Confirm the status badge changes to SUBMITTED (amber)',
        'Switch to the Lifecycle tab to see the audit event'
      ],
      startRoute: '/blotter',
      color: 'navy'
    },
    {
      id: 3,
      label: 'Scenario 3 · Authorization',
      category: 'Workflow',
      title: 'Authorize a Deal (Four-Eyes)',
      description: 'Log in as a second user with AUTHORIZER role. Review the pending deal in the Authorization Inbox and approve it. Note that the original submitter (MD Rahman) cannot authorize their own deal.',
      steps: [
        'Open Authorization Inbox — confirm the deal appears pending',
        'Click Authorize — observe the maker-checker tooltip on MD Rahman\'s deal',
        'As a different user (e.g., S. Hossain), open the deal and click Authorize',
        'Confirm status changes to AUTHORIZED (green)',
        'Verify the deal disappears from the pending inbox count'
      ],
      startRoute: '/auth-inbox',
      color: 'green'
    },
    {
      id: 4,
      label: 'Scenario 4 · Workflow',
      category: 'Workflow',
      title: 'Reject and Resubmit a Deal',
      description: 'Simulate a rejection scenario: an authorizer rejects a deal with a comment, the original maker corrects it and resubmits. Observe how the deal moves back through the workflow.',
      steps: [
        'In the Auth Inbox, open a SUBMITTED deal',
        'Click Reject and enter a rejection reason',
        'Switch to the maker view — deal returns to REJECTED status',
        'Open the deal, correct the rate, and resubmit',
        'Confirm the deal re-enters SUBMITTED state in the inbox'
      ],
      startRoute: '/auth-inbox',
      color: 'amber'
    },
    {
      id: 5,
      label: 'Scenario 5 · Compliance',
      category: 'Compliance',
      title: 'Investigate a Deal Using the Audit Trail',
      description: 'Use the Audit Trail to reconstruct the full lifecycle of a deal — who created it, who submitted it, who authorized it, and when. Filter by reference ID, export the CSV for regulatory purposes.',
      steps: [
        'Navigate to Reports → Audit Trail',
        'Filter by Module: MM Deal and reference MM-2026-00001',
        'Toggle between Table and Timeline views',
        'Open the deal detail and switch to the Lifecycle tab',
        'Click Export CSV to download the audit log for compliance'
      ],
      startRoute: '/reports/audit',
      color: 'violet'
    }
  ];

  readonly quickRef = [
    { label: 'Deal Statuses', items: ['DRAFT — saved, not submitted', 'SUBMITTED — awaiting authorization', 'AUTHORIZED — approved and active', 'REJECTED — returned to maker', 'MATURED — past value date', 'CANCELLED — voided'] },
    { label: 'Key Routes', items: ['/mm-deal/create/basics — New deal wizard', '/blotter — All deals table', '/auth-inbox — Authorization queue', '/reports/audit — Audit trail'] },
    { label: 'Maker-Checker Rule', items: ['A user who submits a deal CANNOT authorize it', 'At least two distinct users required', 'Enforced by the four-eyes control'] },
    { label: 'Useful Shortcuts', items: ['Deal ID in Blotter → Deal Detail', 'Lifecycle tab → deal-level audit', 'Export CSV → compliance-ready log'] }
  ];

  completed = new Set<number>();

  ngOnInit(): void {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const ids: number[] = JSON.parse(raw);
        this.completed = new Set(ids);
      }
    } catch { /* ignore */ }
  }

  get completedCount(): number { return this.completed.size; }

  get progressPct(): number {
    return Math.round((this.completed.size / this.scenarios.length) * 100);
  }

  isComplete(id: number): boolean { return this.completed.has(id); }

  toggleComplete(id: number): void {
    if (this.completed.has(id)) {
      this.completed.delete(id);
    } else {
      this.completed.add(id);
    }
    this.completed = new Set(this.completed);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify([...this.completed]));
    } catch { /* ignore */ }
  }

  resetAll(): void {
    this.completed = new Set();
    try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
  }
}
