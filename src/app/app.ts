import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./layout/components/navbar/navbar.component";
import { FooterComponent } from "./layout/components/footer/footer.component";
import {  ToastComponent } from './shared/toast/toast';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,  ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}
