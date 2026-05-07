import { Component, inject } from '@angular/core';
import { FooterActionService } from '../footer-action.service';

@Component({
  selector: 'app-upper-footer',
  standalone: true,
  imports: [],
  templateUrl: './upper-footer.component.html',
  styleUrl: './upper-footer.component.scss'
})
export class UpperFooterComponent {
  private footerActionService = inject(FooterActionService);

  onCancel(): void    { this.footerActionService.emit('cancel'); }
  onSaveDraft(): void { this.footerActionService.emit('draft');  }
  onSubmit(): void    { this.footerActionService.emit('submit'); }
}
