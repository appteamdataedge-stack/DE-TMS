import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { InfobarService, InfoField } from '../infobar.service';

@Component({
  selector: 'de-bottom-nav',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bottom-nav.html',
  styleUrl: './bottom-nav.scss'
})
export class BottomNavComponent implements OnInit, OnDestroy {
  private infobarService = inject(InfobarService);

  fields: InfoField[] = [];

  private subs = new Subscription();

  ngOnInit(): void {
    this.subs.add(
      this.infobarService.infoFields$.subscribe(f => { this.fields = f; })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
