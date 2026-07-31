import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import {  ToastComponent } from './shared/toast/toast';
import { LanguageService } from './core/services/language.service';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,  ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
    constructor(private language: LanguageService) {}

}
