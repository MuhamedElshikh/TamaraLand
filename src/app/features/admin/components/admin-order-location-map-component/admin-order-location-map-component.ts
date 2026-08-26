import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
} from '@angular/core';

import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { environment } from '../../../../../environments/environment';

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

  private map?: google.maps.Map;
  private marker?: google.maps.Marker;

  private static googleMapsOptionsSet = false;

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    // مفيش حاجة تتشال يدويًا مع Google Maps
    // (مختلف عن Leaflet اللي كان محتاج map.remove())
  }

  private async initMap(): Promise<void> {
    if (!AdminOrderLocationMapComponent.googleMapsOptionsSet) {
      setOptions({
        key: environment.googleMapsApiKey,
        v: 'weekly',
        language: 'ar',
        region: 'EG',
      });

      AdminOrderLocationMapComponent.googleMapsOptionsSet = true;
    }

    const [{ Map }, { Marker }] = await Promise.all([
      importLibrary('maps'),
      importLibrary('marker'),
    ]);

    this.map = new Map(
      document.getElementById('admin-order-location-map') as HTMLElement,
      {
        center: { lat: this.latitude, lng: this.longitude },
        zoom: 16,
        zoomControl: true,
        draggable: true,
        scrollwheel: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }
    );

    this.marker = new Marker({
      position: { lat: this.latitude, lng: this.longitude },
      map: this.map,
    });

    setTimeout(() => {
      if (this.map) {
        google.maps.event.trigger(this.map, 'resize');
      }
    }, 100);
  }
}