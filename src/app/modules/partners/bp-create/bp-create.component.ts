import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import {
  AbstractControl, FormControl, FormGroup, FormsModule,
  ReactiveFormsModule, ValidationErrors, Validators
} from '@angular/forms';
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

export type BpCategory = 'INDIVIDUAL' | 'CORPORATE' | 'BANK';

export interface AddressRecord {
  type:      string;
  housePlot: string;
  road:      string;
  line2:     string;
  city:      string;
  zipPin:    string;
  state:     string;
  country:   string;
}

function swiftValidator(ctrl: AbstractControl): ValidationErrors | null {
  if (!ctrl.value) return null;
  return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(ctrl.value) ? null : { swiftFormat: true };
}

@Component({
  selector: 'app-bp-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, TmsSelectComponent, BottomNavComponent, UpperFooterComponent],
  animations: [
    trigger('cardSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('bannerSlide', [
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
  templateUrl: './bp-create.component.html',
  styleUrl:    './bp-create.component.scss',
})
export class BpCreateComponent implements OnInit, OnDestroy {
  private approvals           = inject(ApprovalsService);
  private router              = inject(Router);
  private cdr                 = inject(ChangeDetectorRef);
  private infobarService      = inject(InfobarService);
  private footerActionService = inject(FooterActionService);
  private formSub             = new Subscription();

  category: BpCategory = 'INDIVIDUAL';
  readonly today = new Date().toISOString().split('T')[0];

  get generatedBpId(): string {
    const prefix = { INDIVIDUAL: '1', CORPORATE: '2', BANK: '3' }[this.category];
    return `${prefix}001`;
  }

  // ── Reference options ─────────────────────────────────────────────────────

  readonly isdOptions = [
    { value: '+880', label: '+880 Bangladesh' },
    { value: '+1',   label: '+1 United States' },
    { value: '+44',  label: '+44 United Kingdom' },
    { value: '+65',  label: '+65 Singapore' },
    { value: '+971', label: '+971 UAE' },
    { value: '+91',  label: '+91 India' },
    { value: '+81',  label: '+81 Japan' },
    { value: '+49',  label: '+49 Germany' },
    { value: '+86',  label: '+86 China' },
  ];

  readonly countryOptions = [
    { value: 'BD', label: 'Bangladesh'     },
    { value: 'US', label: 'United States'  },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'SG', label: 'Singapore'      },
    { value: 'JP', label: 'Japan'          },
    { value: 'DE', label: 'Germany'        },
    { value: 'CN', label: 'China'          },
    { value: 'IN', label: 'India'          },
    { value: 'AE', label: 'UAE'            },
    { value: 'SA', label: 'Saudi Arabia'   },
  ];

  readonly constitutionOptions = [
    { value: 'PROP',    label: 'Proprietorship' },
    { value: 'PARTNER', label: 'Partnership'    },
    { value: 'LTD',     label: 'Ltd'            },
    { value: 'PLC',     label: 'PLC'            },
    { value: 'LLP',     label: 'LLP'            },
    { value: 'OTHERS',  label: 'Others'         },
  ];

  readonly currencyScopeOptions = ['BDT', 'USD', 'EUR', 'GBP', 'JPY', 'CNY'];

  get addressTypeOptions() {
    if (this.category === 'INDIVIDUAL') {
      return [
        { value: 'COMMUNICATION', label: 'Communication' },
        { value: 'OFFICE',        label: 'Office'        },
        { value: 'PERMANENT',     label: 'Permanent'     },
      ];
    }
    return [
      { value: 'COMMUNICATION', label: 'Communication'  },
      { value: 'REGD_OFFICE',   label: 'Regd. Office'   },
      { value: 'BRANCH_OFFICE', label: 'Branch Office'  },
    ];
  }

  // ── Forms ─────────────────────────────────────────────────────────────────

  individualForm!: FormGroup;
  corporateForm!:  FormGroup;
  bankForm!:       FormGroup;
  commonForm!:     FormGroup;

  ngOnInit(): void {
    this.individualForm = new FormGroup({
      firstName:  new FormControl('', Validators.required),
      middleName: new FormControl(''),
      lastName:   new FormControl('', Validators.required),
      dob:        new FormControl(''),
      isdCode:    new FormControl('+880'),
      mobile:     new FormControl('', Validators.required),
      email:      new FormControl('', Validators.email),
    });

    this.corporateForm = new FormGroup({
      entityName:    new FormControl('', Validators.required),
      shortName:     new FormControl(''),
      dateOfIncorp:  new FormControl(''),
      constitution:  new FormControl(null, Validators.required),
      contactPerson: new FormControl(''),
      designation:   new FormControl(''),
      isdCode:       new FormControl('+880'),
      mobile:        new FormControl(''),
      email:         new FormControl('', Validators.email),
    });

    this.bankForm = new FormGroup({
      bankName:      new FormControl('', Validators.required),
      branchName:    new FormControl(''),
      shortName:     new FormControl(''),
      country:       new FormControl(null, Validators.required),
      swiftCode:     new FormControl('', [Validators.minLength(8), Validators.maxLength(11), swiftValidator]),
      routingNo:     new FormControl(''),
      contactPerson: new FormControl(''),
      designation:   new FormControl(''),
      isdCode:       new FormControl('+880'),
      mobile:        new FormControl(''),
    });

    this.commonForm = new FormGroup({
      status:        new FormControl(true),
      effectiveDate: new FormControl('', Validators.required),
      blacklisted:   new FormControl(false),
      remarks:       new FormControl(''),
      currencyScope: new FormControl('ALL'),
    });

    this.updateInfobar();
    this.formSub.add(this.individualForm.valueChanges.subscribe(() => this.updateInfobar()));
    this.formSub.add(this.corporateForm.valueChanges.subscribe(() => this.updateInfobar()));
    this.formSub.add(this.bankForm.valueChanges.subscribe(() => this.updateInfobar()));
    this.formSub.add(
      this.footerActionService.action$.subscribe(action => {
        if (action === 'cancel') this.onCancel();
        if (action === 'draft')  this.saveDraft();
        if (action === 'submit') this.onSubmit();
      })
    );
  }

  private updateInfobar(): void {
    let name = '';
    if (this.category === 'INDIVIDUAL') {
      const first = this.individualForm.get('firstName')?.value || '';
      const last  = this.individualForm.get('lastName')?.value || '';
      name = [first, last].filter(Boolean).join(' ');
    } else if (this.category === 'CORPORATE') {
      name = this.corporateForm.get('entityName')?.value || '';
    } else {
      name = this.bankForm.get('bankName')?.value || '';
    }
    this.infobarService.setFields([
      { label: 'BP ID', value: this.generatedBpId },
      { label: 'NAME',  value: name },
      { label: 'TYPE',  value: this.category },
    ]);
  }

  ngOnDestroy(): void {
    this.formSub.unsubscribe();
    this.infobarService.setFields([]);
  }

  // ── Addresses ─────────────────────────────────────────────────────────────

  addresses: AddressRecord[] = [this.blankAddress()];

  private blankAddress(): AddressRecord {
    return { type: 'COMMUNICATION', housePlot: '', road: '', line2: '', city: '', zipPin: '', state: '', country: '' };
  }

  addAddress(): void { this.addresses.push(this.blankAddress()); }
  removeAddress(i: number): void { if (this.addresses.length > 1) this.addresses.splice(i, 1); }

  // ── Currency scope ────────────────────────────────────────────────────────

  selectedCurrencies: string[] = [];

  toggleCurrency(c: string): void {
    const i = this.selectedCurrencies.indexOf(c);
    if (i === -1) this.selectedCurrencies.push(c); else this.selectedCurrencies.splice(i, 1);
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  get isBlacklisted(): boolean { return this.commonForm.get('blacklisted')?.value as boolean; }
  get statusActive():  boolean { return this.commonForm.get('status')?.value as boolean; }
  get currencyScope(): string  { return this.commonForm.get('currencyScope')?.value as string; }

  get activeForm(): FormGroup {
    if (this.category === 'INDIVIDUAL') return this.individualForm;
    if (this.category === 'CORPORATE')  return this.corporateForm;
    return this.bankForm;
  }

  setCategory(c: BpCategory): void {
    this.category  = c;
    this.addresses = [this.blankAddress()];
    this.updateInfobar();
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  onSubmit(): void {
    this.activeForm.markAllAsTouched();
    this.commonForm.markAllAsTouched();
    if (this.activeForm.invalid || this.commonForm.invalid) {
      const el = document.querySelector('.ng-invalid.ng-touched:not(form)') as HTMLElement | null;
      el?.closest('.de-field')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    this.approvals.increment();
    this.showToast(`BP ${this.generatedBpId} submitted for approval. Check Authorization Inbox.`);
    setTimeout(() => this.router.navigate(['/auth-inbox']), 1800);
  }

  saveDraft(): void { this.showToast('Draft saved successfully.'); }

  onCancel(): void {
    this.router.navigate(['/partners']);
  }

  // ── Toast ─────────────────────────────────────────────────────────────────

  toastVisible = false;
  toastMessage = '';

  private showToast(msg: string): void {
    this.toastMessage = msg;
    this.toastVisible = true;
    setTimeout(() => { this.toastVisible = false; this.cdr.detectChanges(); }, 3500);
  }
}
