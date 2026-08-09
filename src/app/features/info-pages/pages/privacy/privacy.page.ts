import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './privacy.page.html',
  styleUrl: './privacy.page.css',
})
export class PrivacyPage {}
