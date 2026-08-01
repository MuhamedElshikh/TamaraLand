import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/** Shared shell for auth screens. */
@Component({
  selector: 'app-auth-form-shell',
  imports: [TranslatePipe],
  standalone: true,
  templateUrl: './auth-form-shell.component.html',
  styleUrl: './auth-form-shell.component.css'
})
export class AuthFormShellComponent {}
