import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { ApprovalsService } from '../../core/services/approvals.service';

export interface PendingItem {
  id: string;
  type: 'MM_DEAL' | 'PORTFOLIO';
  urgency: 'HIGH' | 'NORMAL';
  title: string;
  subtitle: string;
  submittedBy: string;
  submittedByRole: string;
  submittedAt: string;
  details: { label: string; value: string }[];
}

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('cardLeave', [
      transition(':leave', [
        animate('220ms ease', style({ opacity: 0, transform: 'translateX(32px)' }))
      ])
    ]),
    trigger('slideDown', [
      transition(':enter', [
        style({ height: '0', overflow: 'hidden', opacity: 0 }),
        animate('200ms ease-out', style({ height: '*', overflow: 'hidden', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ overflow: 'hidden' }),
        animate('150ms ease-in', style({ height: '0', opacity: 0, overflow: 'hidden' }))
      ])
    ])
  ],
  templateUrl: './approvals.component.html',
  styleUrl:    './approvals.component.scss'
})
export class ApprovalsComponent {

  private approvalsService = inject(ApprovalsService);

  readonly currentUser = 'MD Rahman';

  items: PendingItem[] = [
    {
      id:              'MM-2026-00006',
      type:            'MM_DEAL',
      urgency:         'HIGH',
      title:           'Repo Agreement — Dutch-Bangla Bank',
      subtitle:        'BDT 8,000,000 · 5.50% · 78 days · PLACE',
      submittedBy:     'KM Hossain',
      submittedByRole: 'Dealer',
      submittedAt:     '10 Apr 2026, 09:22',
      details: [
        { label: 'Instrument',  value: 'Repo Agreement' },
        { label: 'Amount',      value: 'BDT 8,000,000'  },
        { label: 'Rate',        value: '5.50%'           },
        { label: 'Direction',   value: 'PLACE'           },
        { label: 'Value Date',  value: '10 Apr 2026'     },
        { label: 'Maturity',    value: '27 Jun 2026'     },
      ]
    },
    {
      id:              'MM-2026-00009',
      type:            'MM_DEAL',
      urgency:         'NORMAL',
      title:           'Fixed Term Deposit — BRAC Bank',
      subtitle:        'BDT 12,000,000 · 6.20% · 183 days · PLACE',
      submittedBy:     'MD Rahman',
      submittedByRole: 'Dealer',
      submittedAt:     '22 Apr 2026, 14:15',
      details: [
        { label: 'Instrument',  value: 'Fixed Term Deposit' },
        { label: 'Amount',      value: 'BDT 12,000,000'     },
        { label: 'Rate',        value: '6.20%'               },
        { label: 'Direction',   value: 'PLACE'               },
        { label: 'Value Date',  value: '22 Apr 2026'         },
        { label: 'Maturity',    value: '22 Oct 2026'         },
      ]
    },
    {
      id:              'PRTF-2026-001',
      type:            'PORTFOLIO',
      urgency:         'HIGH',
      title:           'Money Market Portfolio — PRTF-2026-001',
      subtitle:        'BDT + USD exposure · General MM portfolio',
      submittedBy:     'MD Rahman',
      submittedByRole: 'Dealer',
      submittedAt:     '22 Apr 2026, 10:34',
      details: [
        { label: 'Portfolio ID',   value: 'PRTF-2026-001' },
        { label: 'Book Type',      value: 'Banking Book'  },
        { label: 'Currencies',     value: 'BDT, USD'      },
        { label: 'Effective Date', value: '22 Apr 2026'   },
        { label: 'Status',         value: 'Active'        },
        { label: 'Dealer Access',  value: 'All'           },
      ]
    }
  ];

  // ── Expand ─────────────────────────────────────────────────────────────────
  expandedIds = new Set<string>();

  toggleExpand(id: string): void {
    this.expandedIds.has(id) ? this.expandedIds.delete(id) : this.expandedIds.add(id);
  }

  // ── Self-approval guard ────────────────────────────────────────────────────
  isSelf(item: PendingItem): boolean {
    return item.submittedBy === this.currentUser;
  }

  // ── Approve modal ──────────────────────────────────────────────────────────
  approveModal: PendingItem | null = null;
  approveChecked = false;

  openApproveModal(item: PendingItem): void {
    this.approveModal   = item;
    this.approveChecked = false;
  }

  confirmApprove(): void {
    if (!this.approveModal || !this.approveChecked) return;
    const item = this.approveModal;
    this.closeModals();
    this.items = this.items.filter(i => i.id !== item.id);
    this.approvalsService.decrement();
    const msg = item.type === 'MM_DEAL'
      ? `Deal ${item.id} authorized. Now active in the blotter.`
      : `Portfolio ${item.id} authorized. Now available for deal booking.`;
    this.showToast(msg, 'success');
  }

  // ── Reject modal ───────────────────────────────────────────────────────────
  rejectModal: PendingItem | null = null;
  rejectReason = '';

  openRejectModal(item: PendingItem): void {
    this.rejectModal  = item;
    this.rejectReason = '';
  }

  confirmReject(): void {
    if (!this.rejectModal) return;
    const item = this.rejectModal;
    this.closeModals();
    this.items = this.items.filter(i => i.id !== item.id);
    this.approvalsService.decrement();
    const prefix = item.type === 'MM_DEAL' ? 'Deal' : 'Portfolio';
    this.showToast(`${prefix} ${item.id} rejected. Maker has been notified.`, 'warning');
  }

  closeModals(): void {
    this.approveModal = null;
    this.rejectModal  = null;
  }

  // ── Toast ──────────────────────────────────────────────────────────────────
  toastVisible = false;
  toastMessage = '';
  toastType: 'success' | 'warning' = 'success';

  private showToast(message: string, type: 'success' | 'warning'): void {
    this.toastMessage = message;
    this.toastType    = type;
    this.toastVisible = true;
    setTimeout(() => this.toastVisible = false, 3500);
  }
}
