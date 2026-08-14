import { Component, EventEmitter, Input, Output, OnInit, AfterViewInit, OnDestroy, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, filter } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import * as L from 'leaflet';

export interface PickedLocation {
  lat: number;
  lng: number;
  formattedAddress: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

@Component({
  selector: 'app-address-map-picker',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './address-map-picker.component.html',
  styleUrl: './address-map-picker.component.css',
})
export class AddressMapPickerComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly http = inject(HttpClient);

  @Input() initialLat = 30.0444; // القاهرة كـ default
  @Input() initialLng = 31.2357;
  @Output() locationPicked = new EventEmitter<PickedLocation>();

  private map!: L.Map;
  private marker!: L.Marker;
  private sub = new Subscription();

  readonly searchControl = new FormControl('');
  readonly searchResults = new Subject<NominatimResult[]>();
  results: NominatimResult[] = [];
  showResults = false;

  ngOnInit(): void {
    this.sub.add(
      this.searchControl.valueChanges
        .pipe(
          filter((val): val is string => !!val && val.length > 2),
          debounceTime(600), // مهم عشان Nominatim rate limit = طلب/ثانية
          distinctUntilChanged(),
          switchMap((query) => this.searchAddress(query))
        )
        .subscribe((results) => {
          this.results = results;
          this.showResults = results.length > 0;
        })
    );
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.map?.remove();
  }

  private initMap(): void {
    // fix لمشكلة أيقونات Leaflet الافتراضية مع Angular/Webpack
    const iconDefault = L.icon({
      iconUrl: 'assets/leaflet/marker-icon.png',
      iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
      shadowUrl: 'assets/leaflet/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });
    L.Marker.prototype.options.icon = iconDefault;

   this.map = L.map('address-map').setView([this.initialLat, this.initialLng], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(this.map);

  // الإضافة المهمة: نجبر الماب يعيد حساب حجمه بعد ما الـ DOM يستقر
  setTimeout(() => {
    this.map.invalidateSize();
  }, 100);


    this.marker = L.marker([this.initialLat, this.initialLng], { draggable: true }).addTo(this.map);

    this.marker.on('dragend', () => {
      const pos = this.marker.getLatLng();
      this.reverseGeocode(pos.lat, pos.lng);
    });

    // اختياري: كليك على أي مكان في الماب يحرّك الـ marker
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.marker.setLatLng(e.latlng);
      this.reverseGeocode(e.latlng.lat, e.latlng.lng);
    });
  }

  private searchAddress(query: string) {
    return this.http.get<NominatimResult[]>('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query,
        format: 'json',
        countrycodes: 'eg', // نقصر البحث على مصر
        limit: '5',
      },
    });
  }

  selectResult(result: NominatimResult): void {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    this.map.setView([lat, lng], 16);
    this.marker.setLatLng([lat, lng]);

    this.searchControl.setValue(result.display_name, { emitEvent: false });
    this.showResults = false;

    this.locationPicked.emit({ lat, lng, formattedAddress: result.display_name });
  }

  private reverseGeocode(lat: number, lng: number): void {
    this.http
      .get<{ display_name: string }>('https://nominatim.openstreetmap.org/reverse', {
        params: { lat: lat.toString(), lon: lng.toString(), format: 'json' },
      })
      .subscribe({
        next: (res) => {
          this.locationPicked.emit({ lat, lng, formattedAddress: res.display_name });
        },
        error: () => {
          this.locationPicked.emit({ lat, lng, formattedAddress: '' });
        },
      });
  }
  readonly isLocating = signal(false);
  readonly locationError = signal<string | null>(null);

  useMyLocation(): void {
    if (!navigator.geolocation) {
      this.locationError.set('المتصفح ده مش بيدعم تحديد الموقع.');
      return;
    }

    this.isLocating.set(true);
    this.locationError.set(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        this.map.setView([lat, lng], 16);
        this.marker.setLatLng([lat, lng]);

        this.reverseGeocode(lat, lng);
        this.isLocating.set(false);
      },
      (error) => {
        this.isLocating.set(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            this.locationError.set('محتاجين إذن الوصول لموقعك عشان نقدر نحدده.');
            break;
          case error.POSITION_UNAVAILABLE:
            this.locationError.set('مش قادرين نحدد موقعك دلوقتي.');
            break;
          case error.TIMEOUT:
            this.locationError.set('استغرق تحديد الموقع وقت طويل، جرب تاني.');
            break;
          default:
            this.locationError.set('حصل خطأ في تحديد الموقع.');
        }
      },
      {
        enableHighAccuracy: true, // دقة أعلى (بيستخدم GPS لو متاح)
        timeout: 10000,           // يستنى 10 ثواني بالكتير
        maximumAge: 0,            // ميستخدمش موقع محفوظ قديم
      }
    );
  }
}