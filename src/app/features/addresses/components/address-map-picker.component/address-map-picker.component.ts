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

import { Subject, Subscription } from 'rxjs';

import { TranslatePipe } from '@ngx-translate/core';
import * as L from 'leaflet';

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

  private map?: L.Map;
  private marker?: L.Marker;

  private sub = new Subscription();

  readonly searchControl = new FormControl('');
  readonly searchResults = new Subject<NominatimResult[]>();

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
    this.map?.remove();
  }

  openMap(): void {
    this.mapOpen.set(true);
    this.locationError.set(null);

    setTimeout(() => {
      if (!this.mapInitialized) {
        this.initMap();
      } else {
        this.map?.invalidateSize();
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

  private initMap(): void {
    if (this.mapInitialized) {
      return;
    }

    const iconDefault = L.icon({
      iconUrl: 'assets/leaflet/marker-icon.png',
      iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
      shadowUrl: 'assets/leaflet/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

    L.Marker.prototype.options.icon = iconDefault;

    this.map = L.map('address-map').setView(
      [this.initialLat, this.initialLng],
      14
    );

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }
    ).addTo(this.map);

    this.marker = L.marker(
      [this.initialLat, this.initialLng],
      {
        draggable: true,
      }
    ).addTo(this.map);

    this.marker.on('dragend', () => {
      const pos = this.marker!.getLatLng();

      this.reverseGeocode(
        pos.lat,
        pos.lng
      );
    });

    this.map.on(
      'click',
      (e: L.LeafletMouseEvent) => {
        this.marker!.setLatLng(e.latlng);

        this.reverseGeocode(
          e.latlng.lat,
          e.latlng.lng
        );
      }
    );

    this.mapInitialized = true;

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);
  }

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

    this.map?.setView(
      [lat, lng],
      16
    );

    this.marker?.setLatLng([
      lat,
      lng,
    ]);

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

        this.map?.setView(
          [lat, lng],
          16
        );

        this.marker?.setLatLng([
          lat,
          lng,
        ]);

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