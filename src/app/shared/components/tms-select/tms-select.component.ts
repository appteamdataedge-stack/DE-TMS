import {
  Component, Input, Output, EventEmitter, OnInit, OnDestroy,
  ElementRef, ChangeDetectionStrategy, ChangeDetectorRef,
  forwardRef, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'tms-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tms-select.component.html',
  styleUrl: './tms-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => TmsSelectComponent),
    multi: true
  }]
})
export class TmsSelectComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() items: any[] = [];
  @Input() bindValue: string | null = null;
  @Input() bindLabel = 'label';
  @Input() subLabelKey: string | null = null;
  @Input() multiple = false;
  @Input() clearable = true;
  @Input() searchable = true;
  @Input() placeholder = 'Select...';
  @Input() closeOnSelect = true;
  @Input() clearAfterSelect = false;

  @Output() valueChange = new EventEmitter<any>();

  isOpen = false;
  isDisabled = false;
  searchQuery = '';

  private _value: any = null;
  private onChange: (v: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private cdr: ChangeDetectorRef, private host: ElementRef) {}

  ngOnInit(): void {
    document.addEventListener('scroll', this.onScrollClose, { capture: true });
  }

  ngOnDestroy(): void {
    document.removeEventListener('scroll', this.onScrollClose, { capture: true });
  }

  private readonly onScrollClose = (): void => {
    if (this.isOpen) {
      this.isOpen = false;
      this.cdr.markForCheck();
    }
  };

  writeValue(value: any): void {
    this._value = value ?? (this.multiple ? [] : null);
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (v: any) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void       { this.onTouched = fn; }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  get displayItems(): any[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.items;
    return this.items.filter(item => this.getLabel(item).toLowerCase().includes(q));
  }

  getLabel(item: any): string {
    if (item === null || item === undefined) return '';
    if (typeof item === 'string' || typeof item === 'number') return String(item);
    return String(item[this.bindLabel] ?? '');
  }

  getSubLabel(item: any): string | null {
    if (!this.subLabelKey || item === null || item === undefined) return null;
    const v = item[this.subLabelKey];
    return v != null ? String(v) : null;
  }

  getValue(item: any): any {
    if (this.bindValue && item && typeof item === 'object') return item[this.bindValue];
    return item;
  }

  getItemByValue(val: any): any {
    return this.items.find(item => this.getValue(item) === val) ?? null;
  }

  isSelected(item: any): boolean {
    const v = this.getValue(item);
    if (this.multiple) return Array.isArray(this._value) && this._value.includes(v);
    return this._value === v;
  }

  get selectedItems(): any[] {
    if (!this.multiple || !Array.isArray(this._value)) return [];
    return this._value.map((v: any) => this.getItemByValue(v)).filter(Boolean);
  }

  get selectedSingle(): any {
    if (this.multiple) return null;
    return this.getItemByValue(this._value);
  }

  get hasValue(): boolean {
    if (this.multiple) return Array.isArray(this._value) && this._value.length > 0;
    return this._value !== null && this._value !== undefined && this._value !== '';
  }

  openPanel(): void {
    if (this.isDisabled) return;
    this.isOpen = true;
    this.searchQuery = '';
    this.cdr.markForCheck();
    setTimeout(() => this.positionPanel());
  }

  positionPanel(): void {
    const trigger = this.host.nativeElement.querySelector('.tms-trigger') as HTMLElement | null;
    const panel   = this.host.nativeElement.querySelector('.tms-panel')   as HTMLElement | null;
    if (!trigger || !panel) return;
    const rect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const panelHeight = Math.min(220, panel.scrollHeight);

    panel.style.position = 'fixed';
    panel.style.left     = rect.left + 'px';
    panel.style.width    = rect.width + 'px';
    panel.style.zIndex   = '99999';

    if (spaceBelow >= panelHeight) {
      panel.style.top    = (rect.bottom + 2) + 'px';
      panel.style.bottom = 'auto';
    } else {
      panel.style.bottom = (viewportHeight - rect.top + 2) + 'px';
      panel.style.top    = 'auto';
    }
  }

  @HostListener('window:scroll') onWindowScroll(): void {
    if (this.isOpen) this.positionPanel();
  }

  @HostListener('window:resize') onWindowResize(): void {
    if (this.isOpen) this.positionPanel();
  }

  closePanel(): void {
    this.isOpen = false;
    this.onTouched();
    this.cdr.markForCheck();
  }

  togglePanel(event: Event): void {
    event.stopPropagation();
    this.isOpen ? this.closePanel() : this.openPanel();
  }

  selectItem(item: any, event: Event): void {
    event.stopPropagation();
    const v = this.getValue(item);
    if (this.multiple) {
      const arr: any[] = Array.isArray(this._value) ? [...this._value] : [];
      const idx = arr.indexOf(v);
      idx >= 0 ? arr.splice(idx, 1) : arr.push(v);
      this._value = arr;
      this.onChange(this._value);
      this.valueChange.emit(this._value);
      if (this.closeOnSelect) this.closePanel();
      else this.cdr.markForCheck();
    } else {
      const emittedValue = v;
      this._value = this.clearAfterSelect ? null : v;
      this.onChange(this._value);
      this.valueChange.emit(emittedValue);
      this.closePanel();
    }
  }

  removeTag(val: any, event: Event): void {
    event.stopPropagation();
    if (!this.multiple || !Array.isArray(this._value)) return;
    this._value = this._value.filter((v: any) => v !== val);
    this.onChange(this._value);
    this.valueChange.emit(this._value);
    this.cdr.markForCheck();
  }

  clearValue(event: Event): void {
    event.stopPropagation();
    this._value = this.multiple ? [] : null;
    this.onChange(this._value);
    this.valueChange.emit(this._value);
    this.cdr.markForCheck();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.closePanel();
    }
  }
}
