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

@Component({
  selector: 'app-counterparty-create',
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
    ])
  ],
  templateUrl: './counterparty-create.component.html',
  styleUrl:    './counterparty-create.component.scss'
})
export class CounterpartyCreateComponent implements OnInit, OnDestroy {

  private approvalsService    = inject(ApprovalsService);
  private router              = inject(Router);
  private cdr                 = inject(ChangeDetectorRef);
  private infobarService      = inject(InfobarService);
  private footerActionService = inject(FooterActionService);
  private formSub             = new Subscription();

  readonly bpId  = `BP-${new Date().getFullYear()}-009`;
  readonly today = new Date().toISOString().split('T')[0];

  // ── Options ───────────────────────────────────────────────────────────────

  readonly categoryOptions = [
    { value: 'BANK',      label: 'Bank'             },
    { value: 'NBFI',      label: 'NBFI'             },
    { value: 'CORPORATE', label: 'Corporate'        },
  ];

  readonly typeOptions = [
    { value: 'STATE_BANK',    label: 'State-owned Bank'         },
    { value: 'PRIVATE_BANK',  label: 'Private Bank'             },
    { value: 'ISLAMIC_BANK',  label: 'Islamic Bank'             },
    { value: 'FOREIGN_BANK',  label: 'Foreign Bank'             },
    { value: 'SPECIALIZED',   label: 'Specialized Bank'         },
    { value: 'MICROFINANCE',  label: 'Microfinance Institution' },
    { value: 'INSURANCE',     label: 'Insurance Company'        },
    { value: 'SECURITIES',    label: 'Securities Firm'          },
  ];

  readonly countryOptions = [
    { value: 'BD', label: 'Bangladesh'    },
    { value: 'US', label: 'United States' },
    { value: 'GB', label: 'United Kingdom'},
    { value: 'SG', label: 'Singapore'     },
    { value: 'JP', label: 'Japan'         },
    { value: 'DE', label: 'Germany'       },
    { value: 'CN', label: 'China'         },
    { value: 'IN', label: 'India'         },
    { value: 'AE', label: 'UAE'           },
    { value: 'SA', label: 'Saudi Arabia'  },
  ];

  readonly creditRatingOptions = [
    { value: 'AAA',  label: 'AAA'  }, { value: 'AA_PLUS', label: 'AA+' },
    { value: 'AA',   label: 'AA'   }, { value: 'AA_MINUS',label: 'AA-' },
    { value: 'A_PLUS',label: 'A+'  }, { value: 'A',       label: 'A'   },
    { value: 'A_MINUS',label:'A-'  }, { value: 'BBB_PLUS',label:'BBB+' },
    { value: 'BBB',  label: 'BBB'  }, { value: 'BBB_MINUS',label:'BBB-'},
    { value: 'BB',   label: 'BB'   }, { value: 'B',       label: 'B'   },
    { value: 'CCC',  label: 'CCC'  }, { value: 'D',       label: 'D'   },
  ];

  readonly sectorOptions = [
    { value: 'BANKING',    label: 'Banking & Finance'   },
    { value: 'GOVT',       label: 'Government'          },
    { value: 'INSURANCE',  label: 'Insurance'           },
    { value: 'TELECOM',    label: 'Telecommunications'  },
    { value: 'ENERGY',     label: 'Energy & Utilities'  },
    { value: 'MANUFACTURING',label:'Manufacturing'      },
    { value: 'TRADE',      label: 'Trade & Commerce'    },
  ];

  // ── Form ──────────────────────────────────────────────────────────────────

  form!: FormGroup;

  ngOnInit(): void {
    this.form = new FormGroup({
      name:        new FormControl('',   [Validators.required, Validators.maxLength(100)]),
      shortName:   new FormControl(''),
      category:    new FormControl('BANK', Validators.required),
      type:        new FormControl(null,   Validators.required),
      country:     new FormControl(null,   Validators.required),
      swift:       new FormControl('',   [Validators.minLength(8), Validators.maxLength(11)]),
      creditRating:new FormControl(null),
      creditLimit: new FormControl<number | null>(null),
      sector:      new FormControl(null),
      contactName: new FormControl(''),
      phone:       new FormControl(''),
      email:       new FormControl('',   [Validators.email]),
      blacklisted: new FormControl(false),
      status:      new FormControl(true),
      // UDFs
      udfRegulatoryCategory:  new FormControl(''),
      udfLocallyIncorporated: new FormControl(false),
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
      { label: 'BP ID',     value: this.bpId },
      { label: 'CATEGORY',  value: this.form.get('category')?.value || '' },
      { label: 'NAME',      value: this.form.get('name')?.value || '' },
    ]);
  }

  ngOnDestroy(): void {
    this.formSub.unsubscribe();
    this.infobarService.setFields([]);
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get selectedCategory()     { return this.form.get('category')?.value as string; }
  get isBlacklisted()        { return this.form.get('blacklisted')?.value as boolean; }
  get statusActive()         { return this.form.get('status')?.value as boolean; }
  get locallyIncorporated()  { return this.form.get('udfLocallyIncorporated')?.value as boolean; }

  setCategory(val: string):  void { this.form.patchValue({ category: val }); }

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
      `Counterparty ${this.bpId} submitted for approval. Check Authorization Inbox.`,
      'success'
    );
    setTimeout(() => this.router.navigate(['/auth-inbox']), 1800);
  }

  saveDraft(): void {
    this.showToast('Draft saved successfully.', 'info');
  }

  onCancel(): void {
    this.router.navigate(['/counterparties']);
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
