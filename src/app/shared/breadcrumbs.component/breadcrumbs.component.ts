import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocalizedFieldPipe } from '../pipes/localized-field.pipe';

export interface BreadcrumbItem {
  label: string;
  arabicLabel?: string;
  link?: string | any[];
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [RouterLink, LocalizedFieldPipe],
  templateUrl: './breadcrumbs.component.html',
  styleUrl: './breadcrumbs.component.css',
})
export class BreadcrumbsComponent {
  @Input({ required: true }) items: BreadcrumbItem[] = [];
}