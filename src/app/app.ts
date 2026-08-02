import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AnalyticsService } from './core/services/analytics.service';
import {  ToastComponent } from './shared/toast/toast';
import { LanguageService } from './core/services/language.service';
import { GoogleTagManagerService } from './core/services/google-tag-manager.service';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,  ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly gtm = inject(GoogleTagManagerService);
private readonly router = inject(Router);
private readonly analytics = inject(AnalyticsService);

    constructor(private language: LanguageService) {
       
  this.gtm.initialize();

  this.router.events
    .pipe(filter(event => event instanceof NavigationEnd))
    .subscribe(() => {

      this.analytics.pageView(document.title);
    });

    }

}
