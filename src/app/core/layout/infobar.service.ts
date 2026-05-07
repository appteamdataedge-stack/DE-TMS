import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface InfoField { label: string; value: string; }

@Injectable({ providedIn: 'root' })
export class InfobarService {
  infoFields$ = new BehaviorSubject<InfoField[]>([]);

  setFields(fields: InfoField[]): void {
    this.infoFields$.next(fields);
  }
}
