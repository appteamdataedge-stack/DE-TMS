import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FooterActionService {
  private action = new Subject<'cancel' | 'draft' | 'submit'>();
  action$ = this.action.asObservable();

  emit(action: 'cancel' | 'draft' | 'submit'): void {
    this.action.next(action);
  }
}
