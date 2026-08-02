import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { NavbarComponent } from "../../../../layout/components/navbar/navbar.component";

/** Shared shell for auth screens. */
@Component({
  selector: 'app-auth-form-shell',
  imports: [TranslatePipe, NavbarComponent],
  standalone: true,
  templateUrl: './auth-form-shell.component.html',
  styleUrl: './auth-form-shell.component.css'
})
export class AuthFormShellComponent {}
