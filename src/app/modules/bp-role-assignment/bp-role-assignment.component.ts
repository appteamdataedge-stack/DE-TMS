import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { animate, style, transition, trigger } from '@angular/animations';
import { TmsSelectComponent } from '../../shared/components/tms-select/tms-select.component';

export interface BpRoleAssignment {
  id: string;
  bpId: string;
  role: string;
  empId?: string;
  designation?: string;
  department?: string;
  dateOfJoining?: string;
  dateOfLeaving?: string;
  status?: string;
  loginUserName?: string;
}

@Component({
  selector: 'app-bp-role-assignment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TmsSelectComponent],
  animations: [
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
  templateUrl: './bp-role-assignment.component.html',
  styleUrl:    './bp-role-assignment.component.scss'
})
export class BpRoleAssignmentComponent implements OnInit, OnDestroy {

  private cdr     = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // ── Options ───────────────────────────────────────────────────────────────

  readonly roleOptions = [
    { value: 'Employee',           label: 'Employee'           },
    { value: 'Counterparty',       label: 'Counterparty'       },
    { value: 'Settlement Bank',    label: 'Settlement Bank'    },
    { value: 'Correspondent Bank', label: 'Correspondent Bank' },
    { value: 'Intermediary Bank',  label: 'Intermediary Bank'  },
    { value: 'Broker',             label: 'Broker'             },
    { value: 'Clearing Member',    label: 'Clearing Member'    },
    { value: 'Custodian Bank',     label: 'Custodian Bank'     },
    { value: 'Paying Agent',       label: 'Paying Agent'       },
    { value: 'Issuer',             label: 'Issuer'             },
  ];

  readonly statusOptions = [
    { value: 'Active',   label: 'Active'   },
    { value: 'Inactive', label: 'Inactive' },
  ];

  // ── Form ──────────────────────────────────────────────────────────────────

  readonly form = new FormGroup({
    bpId:          new FormControl('', Validators.required),
    role:          new FormControl('', Validators.required),
    // Employee-only fields
    empId:         new FormControl(''),
    designation:   new FormControl(''),
    department:    new FormControl(''),
    dateOfJoining: new FormControl(''),
    dateOfLeaving: new FormControl(''),
    status:        new FormControl(''),
    loginUserName: new FormControl(''),
  });

  // ── State ─────────────────────────────────────────────────────────────────

  isEmployeeRole  = false;
  showToast       = false;
  toastMsg        = '';
  toastIsError    = false;
  editingId: string | null = null;

  // In-memory assignments list (mock until API is wired)
  assignments: BpRoleAssignment[] = [];

  // Filtered grid: all assignments for the currently entered BP ID
  get gridRows(): BpRoleAssignment[] {
    const bpId = this.form.get('bpId')?.value?.trim();
    if (!bpId) return this.assignments;
    return this.assignments.filter(a => a.bpId === bpId);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Watch role to show/hide Employee fields
    this.form.get('role')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        this.isEmployeeRole = val === 'Employee';
        this.applyEmployeeValidators(this.isEmployeeRole);
        this.cdr.detectChanges();
      });

    // TODO: GET /api/bp-role-assignment?bpId=xxx when BP ID changes
    this.form.get('bpId')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cdr.detectChanges());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Validators ────────────────────────────────────────────────────────────

  private applyEmployeeValidators(isEmployee: boolean): void {
    const empFields = ['empId', 'designation', 'department', 'dateOfJoining', 'status', 'loginUserName'];
    for (const f of empFields) {
      const ctrl = this.form.get(f)!;
      if (isEmployee && f !== 'dateOfLeaving') {
        ctrl.setValidators(Validators.required);
      } else {
        ctrl.clearValidators();
        ctrl.reset('');
      }
      ctrl.updateValueAndValidity({ emitEvent: false });
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const assignment: BpRoleAssignment = {
      id:            this.editingId ?? `BPRA-${Date.now()}`,
      bpId:          v['bpId']          ?? '',
      role:          v['role']          ?? '',
      empId:         v['empId']         || undefined,
      designation:   v['designation']   || undefined,
      department:    v['department']    || undefined,
      dateOfJoining: v['dateOfJoining'] || undefined,
      dateOfLeaving: v['dateOfLeaving'] || undefined,
      status:        v['status']        || undefined,
      loginUserName: v['loginUserName'] || undefined,
    };

    if (this.editingId) {
      // TODO: PUT /api/bp-role-assignment/:id
      const idx = this.assignments.findIndex(a => a.id === this.editingId);
      if (idx >= 0) this.assignments[idx] = assignment;
      this.editingId = null;
    } else {
      // TODO: POST /api/bp-role-assignment
      this.assignments.push(assignment);
    }

    this.toast('Saved successfully (mock)', false);
    this.resetForm();
    this.cdr.detectChanges();
  }

  saveDraft(): void {
    this.toast('Draft saved successfully.', false);
  }

  onReset(): void {
    this.editingId = null;
    this.resetForm();
  }

  onEdit(row: BpRoleAssignment): void {
    this.editingId = row.id;
    this.form.patchValue({
      bpId:          row.bpId,
      role:          row.role,
      empId:         row.empId         ?? '',
      designation:   row.designation   ?? '',
      department:    row.department    ?? '',
      dateOfJoining: row.dateOfJoining ?? '',
      dateOfLeaving: row.dateOfLeaving ?? '',
      status:        row.status        ?? '',
      loginUserName: row.loginUserName ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onDelete(row: BpRoleAssignment): void {
    if (!confirm(`Delete role assignment (${row.role}) for ${row.bpId}? This cannot be undone.`)) return;
    // TODO: DELETE /api/bp-role-assignment/:id
    this.assignments = this.assignments.filter(a => a.id !== row.id);
    this.toast('Assignment deleted.', false);
    this.cdr.detectChanges();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private resetForm(): void {
    this.form.reset({ role: '', bpId: '', empId: '', designation: '', department: '', dateOfJoining: '', dateOfLeaving: '', status: '', loginUserName: '' });
    this.isEmployeeRole = false;
    this.applyEmployeeValidators(false);
  }

  private toast(msg: string, isError: boolean): void {
    this.toastMsg = msg; this.toastIsError = isError; this.showToast = true;
    setTimeout(() => { this.showToast = false; this.cdr.detectChanges(); }, 3500);
  }

  isInvalid(name: string): boolean {
    const c = this.form.get(name);
    return !!(c?.invalid && c.touched);
  }
}
