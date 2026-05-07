import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';
import { ApprovalsService } from '../../../core/services/approvals.service';

const ALL_ROLES = [
  { id: 'EMPLOYEE',         label: 'Employee',           icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  { id: 'COUNTERPARTY',     label: 'Counterparty',        icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
  { id: 'SETTLEMENT_BANK',  label: 'Settlement Bank',     icon: 'M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2l8 4H4l8-4z' },
  { id: 'CORRESPONDENT',    label: 'Correspondent Bank',  icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10' },
  { id: 'INTERMEDIARY',     label: 'Intermediary Bank',   icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  { id: 'BROKER',           label: 'Broker',              icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
  { id: 'CLEARING_MEMBER',  label: 'Clearing Member',     icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' },
  { id: 'CUSTODIAN',        label: 'Custodian Bank',       icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
  { id: 'PAYING_AGENT',     label: 'Paying Agent',         icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
  { id: 'ISSUER',           label: 'Issuer',               icon: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01' },
];

@Component({
  selector: 'app-bp-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, height: '0', overflow: 'hidden' }),
        animate('200ms ease-out', style({ opacity: 1, height: '*', overflow: 'hidden' }))
      ]),
      transition(':leave', [
        style({ overflow: 'hidden' }),
        animate('150ms ease-in', style({ opacity: 0, height: '0', overflow: 'hidden' }))
      ])
    ])
  ],
  templateUrl: './bp-roles.component.html',
  styleUrl:    './bp-roles.component.scss',
})
export class BpRolesComponent implements OnInit {
  private route     = inject(ActivatedRoute);
  private approvals = inject(ApprovalsService);
  private router    = inject(Router);
  private cdr       = inject(ChangeDetectorRef);

  bpId       = '';
  allRoles   = ALL_ROLES;
  activeRoles: string[] = [];

  employeeForm!: FormGroup;

  ngOnInit(): void {
    this.bpId = this.route.snapshot.paramMap.get('id') ?? 'BP-NEW';

    this.employeeForm = new FormGroup({
      empId:         new FormControl('', Validators.required),
      designation:   new FormControl('', Validators.required),
      department:    new FormControl(''),
      dateOfJoining: new FormControl('', Validators.required),
      dateOfLeaving: new FormControl(''),
      status:        new FormControl(true),
      loginUserName: new FormControl('', Validators.required),
    });

    this.employeeForm.get('dateOfLeaving')!.valueChanges.subscribe(val => {
      if (val) this.employeeForm.patchValue({ status: false }, { emitEvent: false });
    });
  }

  get hasEmployee(): boolean     { return this.activeRoles.includes('EMPLOYEE'); }
  get empStatusActive(): boolean { return this.employeeForm.get('status')?.value as boolean; }

  toggleRole(id: string): void {
    const i = this.activeRoles.indexOf(id);
    if (i === -1) this.activeRoles.push(id);
    else          this.activeRoles.splice(i, 1);
  }

  onSubmit(): void {
    if (this.hasEmployee) {
      this.employeeForm.markAllAsTouched();
      if (this.employeeForm.invalid) return;
    }
    if (this.activeRoles.length === 0) return;
    this.approvals.increment();
    this.showToast(`Role assignment for ${this.bpId} submitted for approval.`);
    setTimeout(() => this.router.navigate(['/auth-inbox']), 1800);
  }

  // ── Toast ─────────────────────────────────────────────────────────────────

  toastVisible = false;
  toastMessage = '';

  private showToast(msg: string): void {
    this.toastMessage = msg;
    this.toastVisible = true;
    setTimeout(() => { this.toastVisible = false; this.cdr.detectChanges(); }, 3500);
  }

  readonly today = new Date().toISOString().split('T')[0];
}
