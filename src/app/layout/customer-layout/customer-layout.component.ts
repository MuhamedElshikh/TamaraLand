import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "../components/navbar/navbar.component";
import { FooterComponent } from "../components/footer/footer.component";
import { StoreSettingsService } from '../../core/services/store-settings.service';
/**
 * Shell layout for customer-facing pages (header, main, footer).
 * @see .ai/STRUCTURE.md
 */
@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './customer-layout.component.html',
  styleUrl: './customer-layout.component.css'
})
export class CustomerLayoutComponent {

  private readonly storeSettingsService = inject(StoreSettingsService);
  readonly settings = this.storeSettingsService.settings;

}
