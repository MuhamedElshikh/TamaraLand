import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { StoreSettingsService } from '../../../core/services/store-settings.service';
import { LanguageService } from '../../../core/services/language.service';
import {LucideAngularModule,Facebook,Instagram,MessageCircle} from 'lucide-angular';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, TranslatePipe,LucideAngularModule],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
protected readonly Facebook = Facebook;
protected readonly Instagram = Instagram;
protected readonly MessageCircle = MessageCircle;
  readonly year = new Date().getFullYear();

  private readonly storeSettingsService = inject(StoreSettingsService);

  readonly languageService = inject(LanguageService);

  readonly settings = this.storeSettingsService.settings;
  
}