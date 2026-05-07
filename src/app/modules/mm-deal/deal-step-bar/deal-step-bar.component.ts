import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Step {
  n: number;
  label: string;
  sub: string;
}

@Component({
  selector: 'de-deal-step-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deal-step-bar.component.html',
  styleUrl: './deal-step-bar.component.scss'
})
export class DealStepBarComponent {
  @Input() currentStep = 1;

  steps: Step[] = [
    { n: 1, label: 'Deal Basics',      sub: 'Direction & instrument' },
    { n: 2, label: 'Deposit & Dates',  sub: 'Tenor & value dates'    },
    { n: 3, label: 'Interest & Calc',  sub: 'Rate & settlement'      },
  ];

  state(n: number): 'complete' | 'active' | 'pending' {
    if (n < this.currentStep)  return 'complete';
    if (n === this.currentStep) return 'active';
    return 'pending';
  }
}
