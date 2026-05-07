import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuditService, AuditLog, AuditFilter } from '../../../core/services/audit.service';
import { TmsSelectComponent } from '../../../shared/components/tms-select/tms-select.component';

@Component({
  selector: 'app-audit-trail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TmsSelectComponent],
  templateUrl: './audit-trail.component.html',
  styleUrl: './audit-trail.component.scss'
})
export class AuditTrailComponent implements OnInit {

  private auditService = inject(AuditService);

  activeView: 'table' | 'timeline' = 'table';

  readonly moduleOptions = [
    { value: 'ALL',        label: 'All Modules'  },
    { value: 'MM_DEAL',    label: 'MM Deal'       },
    { value: 'PORTFOLIO',  label: 'Portfolio'     },
    { value: 'INSTRUMENT', label: 'Instrument'    },
  ];

  readonly actionSelectOptions = [
    { value: 'ALL',             label: 'All Actions'  },
    { value: 'CREATE',          label: 'Create'       },
    { value: 'DRAFT',           label: 'Draft'        },
    { value: 'SUBMIT',          label: 'Submit'       },
    { value: 'AUTHORIZE',       label: 'Authorize'    },
    { value: 'REJECT',          label: 'Reject'       },
    { value: 'CANCEL',          label: 'Cancel'       },
    { value: 'UPDATE',          label: 'Update'       },
    { value: 'EARLY_TERMINATE', label: 'Terminate'    },
    { value: 'RECALL',          label: 'Recall'       },
  ];

  filters: AuditFilter = { module: 'ALL', action: 'ALL', user: '', from: '', to: '' };

  ngOnInit(): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      this.activeView = 'timeline';
    }
  }

  get filteredLogs(): AuditLog[] {
    return this.auditService.filter(this.filters);
  }

  clearFilters(): void {
    this.filters = { module: 'ALL', action: 'ALL', user: '', from: '', to: '' };
  }

  // ── Display helpers ──────────────────────────────────────────────────────

  readonly actionLabels: Record<string, string> = {
    CREATE:          'CREATE',
    DRAFT:           'DRAFT',
    SUBMIT:          'SUBMIT',
    AUTHORIZE:       'AUTHORIZE',
    REJECT:          'REJECT',
    CANCEL:          'CANCEL',
    UPDATE:          'UPDATE',
    EARLY_TERMINATE: 'TERMINATE',
    RECALL:          'RECALL',
  };

  readonly actionBadgeMap: Record<string, string> = {
    CREATE:          'teal',
    DRAFT:           'neutral',
    SUBMIT:          'amber',
    AUTHORIZE:       'green',
    REJECT:          'red',
    CANCEL:          'neutral',
    UPDATE:          'navy',
    EARLY_TERMINATE: 'amber',
    RECALL:          'amber',
  };

  readonly dotColorMap: Record<string, string> = {
    CREATE:          '#0FA383',
    DRAFT:           '#9CA3AF',
    SUBMIT:          '#F5A623',
    AUTHORIZE:       '#16A34A',
    REJECT:          '#DC2626',
    CANCEL:          '#9CA3AF',
    UPDATE:          '#0D1B2A',
    EARLY_TERMINATE: '#F5A623',
    RECALL:          '#F5A623',
  };

  readonly moduleLabelMap: Record<string, string> = {
    MM_DEAL:    'MM Deal',
    PORTFOLIO:  'Portfolio',
    INSTRUMENT: 'Instrument',
  };

  actionLabel(action: string): string  { return this.actionLabels[action]    ?? action; }
  actionBadge(action: string): string  { return this.actionBadgeMap[action]  ?? 'neutral'; }
  dotColor(action: string): string     { return this.dotColorMap[action]     ?? '#9CA3AF'; }
  moduleLabel(module: string): string  { return this.moduleLabelMap[module]  ?? module; }

  fmtTimestamp(ts: string): string {
    const d = new Date(ts);
    return d.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
  }

  // ── CSV Export ───────────────────────────────────────────────────────────

  exportCsv(): void {
    const headers = ['Audit ID', 'Timestamp', 'User', 'Action', 'Module', 'Reference', 'Description', 'IP'];
    const rows = this.filteredLogs.map(l => [
      l.id, l.timestamp, l.user, l.action, l.module, l.refId,
      l.description.replace(/"/g, '""'), l.ip
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${c}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href     = url;
    a.download = `TMS-Audit-Trail-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
