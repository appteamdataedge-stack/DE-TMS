import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TmsSelectComponent } from '../../shared/components/tms-select/tms-select.component';
import { animate, style, transition, trigger } from '@angular/animations';

type FieldType = 'TEXT' | 'BOOLEAN' | 'NUMBER' | 'DATE' | 'DROPDOWN';

interface UdfDefinition {
  id: string;
  name: string;
  fieldType: FieldType;
  screen: string;
  required: boolean;
  maxLength?: number;
  status: 'ACTIVE' | 'INACTIVE';
}

@Component({
  selector: 'app-udf-maintenance',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TmsSelectComponent],
  animations: [
    trigger('slideOver', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('250ms cubic-bezier(0.4,0,0.2,1)', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4,0,0.2,1)', style({ transform: 'translateX(100%)' }))
      ])
    ]),
    trigger('backdropFade', [
      transition(':enter', [style({ opacity: 0 }), animate('200ms ease', style({ opacity: 1 }))]),
      transition(':leave', [animate('150ms ease', style({ opacity: 0 }))])
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
  templateUrl: './udf-maintenance.component.html',
  styleUrl:    './udf-maintenance.component.scss'
})
export class UdfMaintenanceComponent implements OnInit {

  private cdr = inject(ChangeDetectorRef);

  // ── Create panel state ────────────────────────────────────────────────────

  createPanelOpen = false;

  // ── Static options ────────────────────────────────────────────────────────

  readonly fieldTypeOptions = [
    { value: 'TEXT',     label: 'Text'     },
    { value: 'BOOLEAN',  label: 'Boolean'  },
    { value: 'NUMBER',   label: 'Number'   },
    { value: 'DATE',     label: 'Date'     },
    { value: 'DROPDOWN', label: 'Dropdown' },
  ];

  readonly screenOptions = [
    { value: 'BP',         label: 'Business Partner' },
    { value: 'PRODUCT',    label: 'Product'          },
    { value: 'INSTRUMENT', label: 'Instrument'       },
    { value: 'PORTFOLIO',  label: 'Portfolio'        },
  ];

  readonly fieldTypeBadge: Record<FieldType, string> = {
    TEXT:     'de-badge--navy',
    BOOLEAN:  'de-badge--teal',
    NUMBER:   'de-badge--amber',
    DATE:     'de-badge--purple',
    DROPDOWN: 'de-badge--green',
  };

  readonly screenLabel: Record<string, string> = {
    BP:         'Business Partner',
    PRODUCT:    'Product',
    INSTRUMENT: 'Instrument',
    PORTFOLIO:  'Portfolio',
  };

  // ── UDF List ──────────────────────────────────────────────────────────────

  udfs: UdfDefinition[] = [
    { id: 'UDF-001', name: 'Regulatory Category',   fieldType: 'TEXT',    screen: 'BP',         required: false, maxLength: 50, status: 'ACTIVE'   },
    { id: 'UDF-002', name: 'Locally Incorporated',  fieldType: 'BOOLEAN', screen: 'BP',         required: false,               status: 'ACTIVE'   },
    { id: 'UDF-003', name: 'Risk Classification',   fieldType: 'DROPDOWN',screen: 'BP',         required: true,                status: 'ACTIVE'   },
    { id: 'UDF-004', name: 'License Number',        fieldType: 'TEXT',    screen: 'PRODUCT',    required: false, maxLength: 20, status: 'ACTIVE'   },
    { id: 'UDF-005', name: 'Capital Adequacy Ratio',fieldType: 'NUMBER',  screen: 'BP',         required: false,               status: 'INACTIVE' },
  ];

  get activeCount() { return this.udfs.filter(u => u.status === 'ACTIVE').length; }

  // ── Form ──────────────────────────────────────────────────────────────────

  form!: FormGroup;

  ngOnInit(): void {
    this.form = new FormGroup({
      name:      new FormControl('',   [Validators.required, Validators.maxLength(60)]),
      fieldType: new FormControl(null,  Validators.required),
      screen:    new FormControl(null,  Validators.required),
      maxLength: new FormControl<number | null>(null, [Validators.min(1), Validators.max(500)]),
      required:  new FormControl(false),
      status:    new FormControl(true),
    });

    // When field type changes, show/hide maxLength
    this.form.get('fieldType')!.valueChanges.subscribe((type: FieldType | null) => {
      const ctrl = this.form.get('maxLength')!;
      if (type !== 'TEXT') {
        ctrl.setValue(null);
        ctrl.clearValidators();
      } else {
        ctrl.setValidators([Validators.min(1), Validators.max(500)]);
      }
      ctrl.updateValueAndValidity();
    });
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get isTextField()   { return this.form.get('fieldType')?.value === 'TEXT'; }
  get statusActive()  { return this.form.get('status')?.value as boolean; }
  get isRequired()    { return this.form.get('required')?.value as boolean; }

  // ── Actions ───────────────────────────────────────────────────────────────

  openCreatePanel(): void  { this.createPanelOpen = true; this.form.reset({ status: true, required: false }); }
  closeCreatePanel(): void { this.createPanelOpen = false; }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const val = this.form.getRawValue();
    const nextId = `UDF-${String(this.udfs.length + 1).padStart(3, '0')}`;
    const newUdf: UdfDefinition = {
      id:        nextId,
      name:      val.name,
      fieldType: val.fieldType,
      screen:    val.screen,
      required:  val.required,
      status:    val.status ? 'ACTIVE' : 'INACTIVE',
      ...(val.fieldType === 'TEXT' && val.maxLength ? { maxLength: val.maxLength } : {})
    };
    this.udfs = [...this.udfs, newUdf];
    this.createPanelOpen = false;
    this.showToast(`UDF "${newUdf.name}" created successfully.`, 'success');
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
