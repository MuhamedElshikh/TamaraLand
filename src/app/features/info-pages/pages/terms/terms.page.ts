import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './terms.page.html',
  styleUrl: './terms.page.css',
})
export class TermsPage {}
