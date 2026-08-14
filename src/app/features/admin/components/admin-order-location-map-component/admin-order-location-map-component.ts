import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
} from '@angular/core';

import * as L from 'leaflet';

@Component({
  selector: 'app-admin-order-location-map',
  standalone: true,
  templateUrl: './admin-order-location-map-component.html',
  styleUrl: './admin-order-location-map-component.css',
})
export class AdminOrderLocationMapComponent
  implements AfterViewInit, OnDestroy {

  @Input() latitude!: number;
  @Input() longitude!: number;

  @Input() governorate = '';
  @Input() area = '';
  @Input() street = '';
  @Input() building = '';
  @Input() floor = '';
  @Input() apartment = '';

  private map?: L.Map;
  private marker?: L.Marker;

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initMap(): void {
    const iconDefault = L.icon({
      iconUrl: 'assets/leaflet/marker-icon.png',
      iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
      shadowUrl: 'assets/leaflet/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

    L.Marker.prototype.options.icon = iconDefault;

    this.map = L.map('admin-order-location-map', {
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: true,
    }).setView(
      [this.latitude, this.longitude],
      16
    );

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }
    ).addTo(this.map);

    this.marker = L.marker([
      this.latitude,
      this.longitude,
    ]).addTo(this.map);

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);
  }
}