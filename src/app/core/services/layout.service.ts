import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private _open = new BehaviorSubject(false);

  get sidebarOpen(): boolean { return this._open.value; }

  toggle(): void { this._open.next(!this._open.value); }
  close():  void { this._open.next(false); }
}
