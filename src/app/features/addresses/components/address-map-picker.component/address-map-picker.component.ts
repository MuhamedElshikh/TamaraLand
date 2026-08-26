import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  AfterViewInit,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  filter,
} from 'rxjs/operators';

import { Subscription } from 'rxjs';

import { TranslatePipe } from '@ngx-translate/core';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { environment } from '../../../../../environments/environment';

export interface PickedLocation {
  lat: number;
  lng: number;
  formattedAddress: string;

  governorate?: string;
  area?: string;
  street?: string;
  building?: string;
}

interface NominatimAddress {
  state?: string;
  state_district?: string;
  city?: string;
  town?: string;
  municipality?: string;

  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  city_district?: string;

  road?: string;
  house_number?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
}

@Component({
  selector: 'app-address-map-picker',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './address-map-picker.component.html',
  styleUrl: './address-map-picker.component.css',
})
export class AddressMapPickerComponent
  implements OnInit, AfterViewInit, OnDestroy {

  private readonly http = inject(HttpClient);

  @Input() initialLat = 30.0444;
  @Input() initialLng = 31.2357;

  @Input() initialLocationSelected = false;
  @Input() initialLocationText = '';

  @Output() locationPicked = new EventEmitter<PickedLocation>();

  private map?: google.maps.Map;
  private marker?: google.maps.Marker;

  private static googleMapsOptionsSet = false;

  private sub = new Subscription();

  readonly searchControl = new FormControl('');

  results: NominatimResult[] = [];
  showResults = false;

  readonly mapOpen = signal(false);
  readonly isLocating = signal(false);
  readonly locationError = signal<string | null>(null);

  readonly selectedLocationText = signal('');

  private mapInitialized = false;

  ngOnInit(): void {
    if (this.initialLocationSelected) {
      this.selectedLocationText.set(
        this.initialLocationText || 'Location selected'
      );
    }

    this.sub.add(
      this.searchControl.valueChanges
        .pipe(
          filter(
            (val): val is string =>
              !!val && val.trim().length > 2
          ),
          debounceTime(600),
          distinctUntilChanged(),
          switchMap((query) =>
            this.searchAddress(query.trim())
          )
        )
        .subscribe((results) => {
          this.results = results;
          this.showResults = results.length > 0;
        })
    );
  }

  ngAfterViewInit(): void {
    // Map is intentionally NOT initialized here.
    // It will initialize only when the user opens it.
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  openMap(): void {
    this.mapOpen.set(true);
    this.locationError.set(null);

    setTimeout(() => {
      if (!this.mapInitialized) {
        this.initMap();
      } else if (this.map) {
        google.maps.event.trigger(this.map, 'resize');
      }
    });
  }

  closeMap(): void {
    this.mapOpen.set(false);
    this.showResults = false;
    this.results = [];

    this.searchControl.setValue('', {
      emitEvent: false,
    });
  }

  toggleMap(): void {
    if (this.mapOpen()) {
      this.closeMap();
    } else {
      this.openMap();
    }
  }

  private async initMap(): Promise<void> {
    if (this.mapInitialized) {
      return;
    }

    if (!AddressMapPickerComponent.googleMapsOptionsSet) {
      setOptions({
        key: environment.googleMapsApiKey,
        v: 'weekly',
        language: 'ar',
        region: 'EG',
      });

      AddressMapPickerComponent.googleMapsOptionsSet = true;
    }

    // بنحمّل مكتبتين بس (maps + marker) — من غير places ولا geocoding
    const [{ Map }, { Marker }] = await Promise.all([
      importLibrary('maps'),
      importLibrary('marker'),
    ]);

    this.map = new Map(
      document.getElementById('address-map') as HTMLElement,
      {
        center: { lat: this.initialLat, lng: this.initialLng },
        zoom: 14,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }
    );

    this.marker = new Marker({
      position: { lat: this.initialLat, lng: this.initialLng },
      map: this.map,
      draggable: true,
    });

    this.marker.addListener('dragend', () => {
      const pos = this.marker!.getPosition();

      if (pos) {
        this.reverseGeocode(pos.lat(), pos.lng());
      }
    });

    this.map.addListener(
      'click',
      (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) {
          return;
        }

        this.marker!.setPosition(e.latLng);

        this.reverseGeocode(
          e.latLng.lat(),
          e.latLng.lng()
        );
      }
    );

    this.mapInitialized = true;

    setTimeout(() => {
      if (this.map) {
        google.maps.event.trigger(this.map, 'resize');
      }
    }, 100);
  }

  // ===========================================================
  // البحث + الـ reverse geocoding — الاتنين عن طريق Nominatim
  // (مجاني بالكامل، من غير أي علاقة بجوجل)
  // ===========================================================

  private searchAddress(query: string) {
    return this.http.get<NominatimResult[]>(
      'https://nominatim.openstreetmap.org/search',
      {
        params: {
          q: query,
          format: 'json',
          addressdetails: '1',
          countrycodes: 'eg',
          limit: '5',
          'accept-language': 'ar',
        },
      }
    );
  }

  selectResult(result: NominatimResult): void {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    this.map?.setCenter({ lat, lng });
    this.map?.setZoom(16);
    this.marker?.setPosition({ lat, lng });

    this.showResults = false;

    this.reverseGeocode(lat, lng);
  }

  private reverseGeocode(
    lat: number,
    lng: number
  ): void {

    this.http
      .get<{
        display_name: string;
        address?: NominatimAddress;
      }>(
        'https://nominatim.openstreetmap.org/reverse',
        {
          params: {
            lat: lat.toString(),
            lon: lng.toString(),
            format: 'json',
            addressdetails: '1',
            'accept-language': 'ar',
          },
        }
      )
      .subscribe({
        next: (res) => {

          const address = res.address;

          const location: PickedLocation = {
            lat,
            lng,

            formattedAddress:
              res.display_name,

            governorate:
              this.extractGovernorate(address),

            area:
              this.extractArea(address),

            street:
              address?.road,

            building:
              address?.house_number,
          };

          this.selectedLocationText.set(
            res.display_name
          );

          this.locationPicked.emit(location);

          this.closeMap();
        },

        error: () => {

          this.selectedLocationText.set(
            `${lat.toFixed(6)}, ${lng.toFixed(6)}`
          );

          this.locationPicked.emit({
            lat,
            lng,
            formattedAddress: '',
          });
        },
      });
  }

  private extractGovernorate(
    address?: NominatimAddress
  ): string | undefined {

    if (!address) {
      return undefined;
    }

    return (
      address.state ||
      address.state_district ||
      address.city ||
      address.town ||
      address.municipality
    );
  }

  private extractArea(
    address?: NominatimAddress
  ): string | undefined {

    if (!address) {
      return undefined;
    }

    return (
      address.suburb ||
      address.neighbourhood ||
      address.quarter ||
      address.city_district
    );
  }

  useMyLocation(): void {

    if (!navigator.geolocation) {
      this.locationError.set(
        'المتصفح ده مش بيدعم تحديد الموقع.'
      );
      return;
    }

    this.isLocating.set(true);
    this.locationError.set(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {

        const lat =
          position.coords.latitude;

        const lng =
          position.coords.longitude;

        this.map?.setCenter({ lat, lng });
        this.map?.setZoom(16);
        this.marker?.setPosition({ lat, lng });

        this.reverseGeocode(
          lat,
          lng
        );

        this.isLocating.set(false);
      },

      (error) => {

        this.isLocating.set(false);

        switch (error.code) {

          case error.PERMISSION_DENIED:
            this.locationError.set(
              'محتاجين إذن الوصول لموقعك عشان نقدر نحدده.'
            );
            break;

          case error.POSITION_UNAVAILABLE:
            this.locationError.set(
              'مش قادرين نحدد موقعك دلوقتي.'
            );
            break;

          case error.TIMEOUT:
            this.locationError.set(
              'استغرق تحديد الموقع وقت طويل، جرب تاني.'
            );
            break;

          default:
            this.locationError.set(
              'حصل خطأ في تحديد الموقع.'
            );
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }
}