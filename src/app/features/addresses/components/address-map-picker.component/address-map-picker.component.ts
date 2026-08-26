import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  AfterViewInit,
  OnDestroy,
  signal,
} from '@angular/core';

import { FormControl, ReactiveFormsModule } from '@angular/forms';

import {
  debounceTime,
  distinctUntilChanged,
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

@Component({
  selector: 'app-address-map-picker',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './address-map-picker.component.html',
  styleUrl: './address-map-picker.component.css',
})
export class AddressMapPickerComponent
  implements OnInit, AfterViewInit, OnDestroy {

  @Input() initialLat = 30.0444;
  @Input() initialLng = 31.2357;

  @Input() initialLocationSelected = false;
  @Input() initialLocationText = '';

  @Output() locationPicked = new EventEmitter<PickedLocation>();

  private map?: google.maps.Map;
  private marker?: google.maps.Marker;
  private geocoder?: google.maps.Geocoder;
  private autocompleteService?: google.maps.places.AutocompleteService;
  private placesService?: google.maps.places.PlacesService;
  private sessionToken?: google.maps.places.AutocompleteSessionToken;

  private sub = new Subscription();

  readonly searchControl = new FormControl('');

  results: google.maps.places.AutocompletePrediction[] = [];
  showResults = false;

  readonly mapOpen = signal(false);
  readonly isLocating = signal(false);
  readonly locationError = signal<string | null>(null);

  readonly selectedLocationText = signal('');
private static googleMapsOptionsSet = false;
  private mapInitialized = false;
  private googleMapsLoaded = false;
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
          distinctUntilChanged()
        )
        .subscribe((query) => {
          this.searchAddress(query.trim());
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

  const [{ Map }, , , { Marker }] = await Promise.all([
    importLibrary('maps'),
    importLibrary('places'),
    importLibrary('geocoding'),
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

  this.geocoder = new google.maps.Geocoder();
  this.autocompleteService = new google.maps.places.AutocompleteService();
  this.placesService = new google.maps.places.PlacesService(this.map);

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

  private searchAddress(query: string): void {
    if (!this.autocompleteService) {
      return;
    }

    if (!this.sessionToken) {
      this.sessionToken =
        new google.maps.places.AutocompleteSessionToken();
    }

    this.autocompleteService.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: 'eg' },
        language: 'ar',
        sessionToken: this.sessionToken,
      },
      (predictions, status) => {
        if (
          status !== google.maps.places.PlacesServiceStatus.OK ||
          !predictions
        ) {
          this.results = [];
          this.showResults = false;
          return;
        }

        this.results = predictions;
        this.showResults = predictions.length > 0;
      }
    );
  }

  selectResult(
    result: google.maps.places.AutocompletePrediction
  ): void {
    if (!this.placesService) {
      return;
    }

    this.placesService.getDetails(
      {
        placeId: result.place_id,
        fields: ['geometry', 'address_component', 'formatted_address'],
        sessionToken: this.sessionToken,
      },
      (place, status) => {
        this.sessionToken = undefined;

        if (
          status !== google.maps.places.PlacesServiceStatus.OK ||
          !place?.geometry?.location
        ) {
          return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        this.map?.setCenter({ lat, lng });
        this.map?.setZoom(16);
        this.marker?.setPosition({ lat, lng });

        this.showResults = false;

        const location: PickedLocation = {
          lat,
          lng,
          formattedAddress: place.formatted_address || '',
          governorate: this.extractComponent(
            place.address_components,
            'administrative_area_level_1'
          ),
          area:
            this.extractComponent(
              place.address_components,
              'sublocality_level_1'
            ) ??
            this.extractComponent(
              place.address_components,
              'neighborhood'
            ),
          street: this.extractComponent(
            place.address_components,
            'route'
          ),
          building: this.extractComponent(
            place.address_components,
            'street_number'
          ),
        };

        this.selectedLocationText.set(location.formattedAddress);
        this.locationPicked.emit(location);
        this.closeMap();
      }
    );
  }

  private reverseGeocode(lat: number, lng: number): void {
    if (!this.geocoder) {
      return;
    }

    this.geocoder.geocode(
      { location: { lat, lng }, language: 'ar' },
      (results, status) => {
        if (
          status !== google.maps.GeocoderStatus.OK ||
          !results ||
          results.length === 0
        ) {
          this.selectedLocationText.set(
            `${lat.toFixed(6)}, ${lng.toFixed(6)}`
          );

          this.locationPicked.emit({
            lat,
            lng,
            formattedAddress: '',
          });

          return;
        }

        const place = results[0];

        const location: PickedLocation = {
          lat,
          lng,
          formattedAddress: place.formatted_address,
          governorate: this.extractComponent(
            place.address_components,
            'administrative_area_level_1'
          ),
          area:
            this.extractComponent(
              place.address_components,
              'sublocality_level_1'
            ) ??
            this.extractComponent(
              place.address_components,
              'neighborhood'
            ),
          street: this.extractComponent(
            place.address_components,
            'route'
          ),
          building: this.extractComponent(
            place.address_components,
            'street_number'
          ),
        };

        this.selectedLocationText.set(location.formattedAddress);
        this.locationPicked.emit(location);
        this.closeMap();
      }
    );
  }

  private extractComponent(
    components: google.maps.GeocoderAddressComponent[] | undefined,
    type: string
  ): string | undefined {
    return components?.find((c) => c.types.includes(type))?.long_name;
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
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        this.map?.setCenter({ lat, lng });
        this.map?.setZoom(16);
        this.marker?.setPosition({ lat, lng });

        this.reverseGeocode(lat, lng);

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