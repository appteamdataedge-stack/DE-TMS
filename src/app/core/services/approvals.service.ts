import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApprovalsService {
  private _count = new BehaviorSubject<number>(3);

  get count(): number { return this._count.value; }

  increment(): void {
    this._count.next(this._count.value + 1);
  }

  decrement(): void {
    if (this._count.value > 0) this._count.next(this._count.value - 1);
  }
}
