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

  isSharing = false;
  shareMessage = '';

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {}

  async shareLocation(): Promise<void> {
    if (
      this.latitude == null ||
      this.longitude == null
    ) {
      return;
    }

    const mapsUrl =
      `https://www.google.com/maps/search/?api=1&query=${this.latitude},${this.longitude}`;

    const address = this.buildAddress();

    const shareText = [
      'Customer Delivery Location',
      address ? `Address: ${address}` : '',
      `Location: ${mapsUrl}`,
    ]
      .filter(Boolean)
      .join('\n');

    this.isSharing = true;
    this.shareMessage = '';

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Customer Delivery Location',
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        this.shareMessage = 'Location link copied to clipboard.';
      }
    } catch (error) {
      // User cancelled the native share dialog.
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      try {
        await navigator.clipboard.writeText(shareText);
        this.shareMessage = 'Location link copied to clipboard.';
      } catch {
        this.shareMessage = 'Unable to share the location.';
      }
    } finally {
      this.isSharing = false;
    }
  }

  private buildAddress(): string {
    return [
      this.governorate,
      this.area,
      this.street,
      this.building ? `Bldg ${this.building}` : '',
      this.floor ? `Floor ${this.floor}` : '',
      this.apartment ? `Apt ${this.apartment}` : '',
    ]
      .filter(Boolean)
      .join(' - ');
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
        center: {
          lat: this.latitude,
          lng: this.longitude,
        },
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
      position: {
        lat: this.latitude,
        lng: this.longitude,
      },
      map: this.map,
    });

    setTimeout(() => {
      if (this.map) {
        google.maps.event.trigger(this.map, 'resize');
      }
    }, 100);
  }
}