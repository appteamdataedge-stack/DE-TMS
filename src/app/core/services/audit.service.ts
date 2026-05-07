import { Injectable } from '@angular/core';

export type AuditAction =
  | 'CREATE' | 'DRAFT' | 'SUBMIT' | 'AUTHORIZE'
  | 'REJECT' | 'CANCEL' | 'UPDATE' | 'EARLY_TERMINATE' | 'RECALL';

export type AuditModule = 'MM_DEAL' | 'PORTFOLIO' | 'INSTRUMENT';

export interface AuditLog {
  id:          string;
  timestamp:   string;     // ISO-8601
  user:        string;
  role:        string;
  action:      AuditAction;
  module:      AuditModule;
  refId:       string;
  description: string;
  ip:          string;
}

export interface AuditFilter {
  module: string;   // 'ALL' or AuditModule
  action: string;   // 'ALL' or AuditAction
  user:   string;
  from:   string;   // date string YYYY-MM-DD
  to:     string;
}

@Injectable({ providedIn: 'root' })
export class AuditService {

  readonly logs: AuditLog[] = [
    // ── MM-2026-00001  City Bank Ltd ──────────────────────────────────────
    { id: 'AUD-001', timestamp: '2026-04-20T09:14:00', user: 'MD Rahman',  role: 'Dealer',            action: 'CREATE',   module: 'MM_DEAL',    refId: 'MM-2026-00001', description: 'Deal MM-2026-00001 created — FTD, City Bank Ltd, BDT 10,000,000 @ 7.25%',        ip: '10.0.0.15' },
    { id: 'AUD-002', timestamp: '2026-04-20T09:15:00', user: 'MD Rahman',  role: 'Dealer',            action: 'SUBMIT',   module: 'MM_DEAL',    refId: 'MM-2026-00001', description: 'Deal MM-2026-00001 submitted for authorization',                                   ip: '10.0.0.15' },
    { id: 'AUD-003', timestamp: '2026-04-21T10:32:00', user: 'KM Hossain', role: 'Treasury Manager',  action: 'AUTHORIZE',module: 'MM_DEAL',    refId: 'MM-2026-00001', description: 'Deal MM-2026-00001 authorized',                                                       ip: '10.0.0.22' },
    // ── MM-2026-00002  BRAC Bank ──────────────────────────────────────────
    { id: 'AUD-004', timestamp: '2026-04-21T11:00:00', user: 'MD Rahman',  role: 'Dealer',            action: 'CREATE',   module: 'MM_DEAL',    refId: 'MM-2026-00002', description: 'Deal MM-2026-00002 created — FTD, BRAC Bank, USD 5,000,000 @ 5.20%',              ip: '10.0.0.15' },
    { id: 'AUD-005', timestamp: '2026-04-21T11:02:00', user: 'MD Rahman',  role: 'Dealer',            action: 'SUBMIT',   module: 'MM_DEAL',    refId: 'MM-2026-00002', description: 'Deal MM-2026-00002 submitted for authorization',                                   ip: '10.0.0.15' },
    { id: 'AUD-006', timestamp: '2026-04-22T09:10:00', user: 'KM Hossain', role: 'Treasury Manager',  action: 'AUTHORIZE',module: 'MM_DEAL',    refId: 'MM-2026-00002', description: 'Deal MM-2026-00002 authorized',                                                       ip: '10.0.0.22' },
    // ── MM-2026-00006  Dutch-Bangla Bank (reject → update → re-submit) ───
    { id: 'AUD-007', timestamp: '2026-04-22T10:00:00', user: 'MD Rahman',  role: 'Dealer',            action: 'CREATE',   module: 'MM_DEAL',    refId: 'MM-2026-00006', description: 'Deal MM-2026-00006 created — Repo, Dutch-Bangla Bank, BDT 8,000,000 @ 5.50%',   ip: '10.0.0.15' },
    { id: 'AUD-008', timestamp: '2026-04-22T10:02:00', user: 'MD Rahman',  role: 'Dealer',            action: 'SUBMIT',   module: 'MM_DEAL',    refId: 'MM-2026-00006', description: 'Deal MM-2026-00006 submitted for authorization',                                   ip: '10.0.0.15' },
    { id: 'AUD-009', timestamp: '2026-04-22T14:20:00', user: 'SN Ahmed',   role: 'Deputy Manager',    action: 'REJECT',   module: 'MM_DEAL',    refId: 'MM-2026-00006', description: 'Deal MM-2026-00006 rejected — rate requires desk confirmation',                   ip: '10.0.0.17' },
    { id: 'AUD-010', timestamp: '2026-04-22T14:55:00', user: 'MD Rahman',  role: 'Dealer',            action: 'UPDATE',   module: 'MM_DEAL',    refId: 'MM-2026-00006', description: 'Deal MM-2026-00006 rate confirmed at 5.50% — re-submitted',                       ip: '10.0.0.15' },
    { id: 'AUD-011', timestamp: '2026-04-22T14:56:00', user: 'MD Rahman',  role: 'Dealer',            action: 'SUBMIT',   module: 'MM_DEAL',    refId: 'MM-2026-00006', description: 'Deal MM-2026-00006 re-submitted for authorization',                                ip: '10.0.0.15' },
    // ── MM-2026-00009  BRAC Bank ──────────────────────────────────────────
    { id: 'AUD-012', timestamp: '2026-04-22T11:20:00', user: 'MD Rahman',  role: 'Dealer',            action: 'CREATE',   module: 'MM_DEAL',    refId: 'MM-2026-00009', description: 'Deal MM-2026-00009 created — FTD, BRAC Bank, BDT 12,000,000 @ 6.20%',           ip: '10.0.0.15' },
    { id: 'AUD-013', timestamp: '2026-04-22T11:22:00', user: 'MD Rahman',  role: 'Dealer',            action: 'SUBMIT',   module: 'MM_DEAL',    refId: 'MM-2026-00009', description: 'Deal MM-2026-00009 submitted for authorization',                                   ip: '10.0.0.15' },
    { id: 'AUD-014', timestamp: '2026-04-23T09:05:00', user: 'KM Hossain', role: 'Treasury Manager',  action: 'AUTHORIZE',module: 'MM_DEAL',    refId: 'MM-2026-00009', description: 'Deal MM-2026-00009 authorized',                                                       ip: '10.0.0.22' },
    // ── PORTFOLIO ─────────────────────────────────────────────────────────
    { id: 'AUD-015', timestamp: '2026-04-18T09:30:00', user: 'FZ Karim',   role: 'Senior Dealer',     action: 'CREATE',   module: 'PORTFOLIO',  refId: 'PRTF-2026-001', description: 'Portfolio PRTF-2026-001 created — MM Primary 2026',                                ip: '10.0.0.30' },
    { id: 'AUD-016', timestamp: '2026-04-18T09:32:00', user: 'FZ Karim',   role: 'Senior Dealer',     action: 'SUBMIT',   module: 'PORTFOLIO',  refId: 'PRTF-2026-001', description: 'Portfolio PRTF-2026-001 submitted for authorization',                              ip: '10.0.0.30' },
    { id: 'AUD-017', timestamp: '2026-04-18T15:45:00', user: 'KM Hossain', role: 'Treasury Manager',  action: 'AUTHORIZE',module: 'PORTFOLIO',  refId: 'PRTF-2026-001', description: 'Portfolio PRTF-2026-001 authorized and activated',                                ip: '10.0.0.22' },
    { id: 'AUD-018', timestamp: '2026-04-23T10:00:00', user: 'MD Rahman',  role: 'Dealer',            action: 'CREATE',   module: 'PORTFOLIO',  refId: 'PRTF-2026-002', description: 'Portfolio PRTF-2026-002 created — FX Hedging Reserve',                            ip: '10.0.0.15' },
    { id: 'AUD-019', timestamp: '2026-04-23T10:02:00', user: 'MD Rahman',  role: 'Dealer',            action: 'SUBMIT',   module: 'PORTFOLIO',  refId: 'PRTF-2026-002', description: 'Portfolio PRTF-2026-002 submitted for authorization',                              ip: '10.0.0.15' },
    // ── INSTRUMENT ────────────────────────────────────────────────────────
    { id: 'AUD-020', timestamp: '2026-04-22T08:00:00', user: 'FZ Karim',   role: 'Senior Dealer',     action: 'CREATE',   module: 'INSTRUMENT', refId: 'INST-2026-001', description: 'Instrument INST-2026-001 created — Fixed Term Deposit Standard',                 ip: '10.0.0.30' },
    { id: 'AUD-021', timestamp: '2026-04-22T08:02:00', user: 'FZ Karim',   role: 'Senior Dealer',     action: 'SUBMIT',   module: 'INSTRUMENT', refId: 'INST-2026-001', description: 'Instrument INST-2026-001 submitted for authorization',                            ip: '10.0.0.30' },
    { id: 'AUD-022', timestamp: '2026-04-22T10:15:00', user: 'KM Hossain', role: 'Treasury Manager',  action: 'AUTHORIZE',module: 'INSTRUMENT', refId: 'INST-2026-001', description: 'Instrument INST-2026-001 authorized and made available for booking',            ip: '10.0.0.22' },
    { id: 'AUD-023', timestamp: '2026-04-24T09:00:00', user: 'SN Ahmed',   role: 'Deputy Manager',    action: 'CREATE',   module: 'INSTRUMENT', refId: 'INST-2026-002', description: 'Instrument INST-2026-002 created — Call Deposit Overnight',                       ip: '10.0.0.17' },
    { id: 'AUD-024', timestamp: '2026-04-24T09:01:00', user: 'SN Ahmed',   role: 'Deputy Manager',    action: 'DRAFT',    module: 'INSTRUMENT', refId: 'INST-2026-002', description: 'Instrument INST-2026-002 saved as draft',                                          ip: '10.0.0.17' },
  ];

  getByRefId(refId: string): AuditLog[] {
    return this.logs
      .filter(l => l.refId === refId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  filter(f: AuditFilter): AuditLog[] {
    return this.logs
      .filter(l => {
        if (f.module !== 'ALL' && l.module !== f.module) return false;
        if (f.action !== 'ALL' && l.action !== f.action)  return false;
        if (f.user && !l.user.toLowerCase().includes(f.user.toLowerCase())) return false;
        if (f.from && l.timestamp.slice(0, 10) < f.from) return false;
        if (f.to   && l.timestamp.slice(0, 10) > f.to)   return false;
        return true;
      })
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp)); // newest first
  }
}
