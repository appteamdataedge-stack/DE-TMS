import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TmsSelectComponent } from '../../../shared/components/tms-select/tms-select.component';
import { BottomNavComponent } from '../../../core/layout/bottom-nav/bottom-nav';
import { UpperFooterComponent } from '../../../core/layout/upper-footer/upper-footer.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { ApprovalsService } from '../../../core/services/approvals.service';
import { Subscription } from 'rxjs';
import { InfobarService } from '../../../core/layout/infobar.service';
import { FooterActionService } from '../../../core/layout/footer-action.service';

interface CorrBank {
  value: string;
  label: string;
  swift: string;
  country: string;
}

// SWIFT: 4 bank + 2 country + 2 location + optional 3 branch  (8 or 11 chars)
const SWIFT_PATTERN = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/i;

@Component({
  selector: 'app-ssi-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TmsSelectComponent, BottomNavComponent, UpperFooterComponent],
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
    ]),
    trigger('stripIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-6px)' }),
        animate('180ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  templateUrl: './ssi-create.component.html',
  styleUrl:    './ssi-create.component.scss'
})
export class SsiCreateComponent implements OnInit, OnDestroy {

  private approvalsService    = inject(ApprovalsService);
  private router              = inject(Router);
  private cdr                 = inject(ChangeDetectorRef);
  private infobarService      = inject(InfobarService);
  private footerActionService = inject(FooterActionService);
  private formSub             = new Subscription();

  readonly ssiId = `SSI-${new Date().getFullYear()}-006`;
  readonly today = new Date().toISOString().split('T')[0];

  // ── Options ───────────────────────────────────────────────────────────────

  readonly currencyOptions = [
    { value: 'BDT', label: 'BDT — Bangladeshi Taka'  },
    { value: 'USD', label: 'USD — US Dollar'          },
    { value: 'EUR', label: 'EUR — Euro'               },
    { value: 'GBP', label: 'GBP — British Pound'      },
    { value: 'SGD', label: 'SGD — Singapore Dollar'   },
    { value: 'JPY', label: 'JPY — Japanese Yen'       },
    { value: 'AUD', label: 'AUD — Australian Dollar'  },
    { value: 'CHF', label: 'CHF — Swiss Franc'        },
  ];

  readonly settlementOptions = [
    { value: 'RTGS',     label: 'RTGS'             },
    { value: 'WIRE',     label: 'Wire Transfer'     },
    { value: 'INTERNAL', label: 'Internal Transfer' },
  ];

  // All counterparties (banks + non-banks) — for the "Counterparty" field
  readonly counterpartyOptions = [
    { value: 'BP001', label: 'Sonali Bank PLC',           category: 'Bank'      },
    { value: 'BP002', label: 'City Bank Ltd',             category: 'Bank'      },
    { value: 'BP003', label: 'BRAC Bank Limited',         category: 'Bank'      },
    { value: 'BP004', label: 'Dutch-Bangla Bank Ltd',     category: 'Bank'      },
    { value: 'BP006', label: 'HSBC Bangladesh',           category: 'Bank'      },
    { value: 'BP007', label: 'Janata Bank Ltd',           category: 'Bank'      },
    { value: 'BP008', label: 'Standard Chartered BD',     category: 'Bank'      },
    { value: 'NB001', label: 'IDLC Finance Limited',      category: 'NBFI'     },
    { value: 'NB002', label: 'Green Delta Insurance',     category: 'NBFI'     },
    { value: 'CP001', label: 'Grameenphone Limited',      category: 'Corporate' },
  ];

  // Correspondent banks — BANKS ONLY (no NBFIs, no corporates)
  readonly correspondentBanks: CorrBank[] = [
    { value: 'BP001', label: 'Sonali Bank PLC',         swift: 'BSONBDDH', country: 'Bangladesh'  },
    { value: 'BP002', label: 'City Bank Ltd',           swift: 'CIBLBDDH', country: 'Bangladesh'  },
    { value: 'BP003', label: 'BRAC Bank Limited',       swift: 'BRACBDDH', country: 'Bangladesh'  },
    { value: 'BP006', label: 'HSBC Bangladesh',         swift: 'HSBCBDDH', country: 'Bangladesh'  },
    { value: 'BP007', label: 'Janata Bank Ltd',         swift: 'JANBBDDH', country: 'Bangladesh'  },
    { value: 'BP008', label: 'Standard Chartered BD',   swift: 'SCBLBDDH', country: 'Bangladesh'  },
  ];

  // ── State ─────────────────────────────────────────────────────────────────

  selectedCorrBank: CorrBank | null = null;
  selectedSettlement = 'RTGS';

  // ── Form ──────────────────────────────────────────────────────────────────

  form!: FormGroup;

  ngOnInit(): void {
    this.form = new FormGroup({
      // Card 1 — Identity
      currency:       new FormControl(null,  Validators.required),
      // Card 2 — Beneficiary
      counterpartyId: new FormControl(null,  Validators.required),
      accountNumber:  new FormControl('',   [Validators.required]),
      beneficiaryBankName: new FormControl('', [Validators.required]),
      beneficiarySwift:    new FormControl('', [Validators.required, Validators.pattern(SWIFT_PATTERN)]),
      // Card 3 — Correspondent (optional)
      corrBankId:     new FormControl(null),
      // Card 4 — Notes
      notes:          new FormControl(''),
      status:         new FormControl(true),
    });

    // React to correspondent bank selection
    this.form.get('corrBankId')!.valueChanges.subscribe((id: string | null) => {
      this.selectedCorrBank = id
        ? (this.correspondentBanks.find(b => b.value === id) ?? null)
        : null;
    });

    this.updateInfobar();
    this.formSub.add(
      this.form.valueChanges.subscribe(() => this.updateInfobar())
    );
    this.formSub.add(
      this.footerActionService.action$.subscribe(action => {
        if (action === 'cancel') this.onCancel();
        if (action === 'draft')  this.saveDraft();
        if (action === 'submit') this.onSubmit();
      })
    );
  }

  private updateInfobar(): void {
    this.infobarService.setFields([
      { label: 'SSI ID',       value: this.ssiId },
      { label: 'COUNTERPARTY', value: this.form.get('counterpartyId')?.value || '' },
      { label: 'CURRENCY',     value: this.form.get('currency')?.value || '' },
    ]);
  }

  ngOnDestroy(): void {
    this.formSub.unsubscribe();
    this.infobarService.setFields([]);
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get statusActive()       { return this.form.get('status')?.value as boolean; }
  get hasCorrBank()        { return this.selectedCorrBank !== null; }
  get beneficiarySwiftCtrl(){ return this.form.get('beneficiarySwift'); }

  setSettlement(val: string): void { this.selectedSettlement = val; }

  clearCorrBank(): void {
    this.form.patchValue({ corrBankId: null });
    this.selectedCorrBank = null;
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      const el = document.querySelector('.ng-invalid.ng-touched:not(form)') as HTMLElement | null;
      el?.closest('.de-field')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    this.approvalsService.increment();
    this.showToast(
      `SSI ${this.ssiId} submitted for approval. Check Authorization Inbox.`,
      'success'
    );
    setTimeout(() => this.router.navigate(['/auth-inbox']), 1800);
  }

  saveDraft(): void {
    this.showToast('Draft saved successfully.', 'info');
  }

  onCancel(): void {
    this.router.navigate(['/ssi']);
  }

  // ── Toast ─────────────────────────────────────────────────────────────────

  toastVisible = false;
  toastMessage = '';
  toastType: 'success' | 'info' = 'success';

  private showToast(msg: string, type: 'success' | 'info'): void {
    this.toastMessage = msg;
    this.toastType    = type;
    this.toastVisible = true;
    setTimeout(() => { this.toastVisible = false; this.cdr.detectChanges(); }, 3500);
  }
}
