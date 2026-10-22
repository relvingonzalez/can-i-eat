import { Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type * as Leaflet from 'leaflet';
import { Observable, Subscription, combineLatest, of, throwError } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

import { HelperFunctionsService, LocationError } from '../core/helper-functions.service';
import { Coordinates, Place, PlacesService } from '../core/places.service';
import { RestaurantService } from '../core/restaurant.service';
import { Restaurant } from '../shared/models/restaurant.model';
import { RestaurantAvatarComponent } from '../shared/components/restaurant-avatar.component';

interface Match {
  place: Place;
  restaurant: Restaurant;
}

const RADII = [1000, 2000, 5000];

@Component({
  standalone: true,
  selector: 'app-nearby',
  templateUrl: './nearby.component.html',
  styleUrls: ['./nearby.component.scss'],
  imports: [DecimalPipe, FormsModule, RouterLink, MatButtonModule, MatButtonToggleModule, MatIconModule, MatProgressSpinnerModule, RestaurantAvatarComponent],
})
export class NearbyComponent implements OnDestroy {
  @ViewChild('map') mapElement: ElementRef<HTMLElement>;

  readonly radii = RADII;
  radius = RADII[1];
  state: 'idle' | 'locating' | 'loading' | 'done' | 'error' = 'idle';
  error = '';
  address = '';
  /** Where the last search was centered, e.g. "Irvine, California". Empty for the user's own location. */
  searchedLabel = '';
  matches: Match[] = [];
  private center?: Coordinates;
  others: Place[] = [];
  private map?: Leaflet.Map;
  private markers?: Leaflet.LayerGroup;
  private subscription?: Subscription;

  constructor(
    private helper: HelperFunctionsService,
    private places: PlacesService,
    private restaurantService: RestaurantService,
    private router: Router,
    private zone: NgZone,
  ) {}

  /** Search around the user's current location. */
  search(): void {
    this.run(this.helper.getUserLocation().pipe(map(coords => ({ lat: coords.latitude, lon: coords.longitude }))));
  }

  /** Search around a typed address, city or ZIP. */
  searchAddress(): void {
    const query = this.address.trim();
    if (!query) {
      return;
    }
    this.run(this.places.geocode(query).pipe(
      switchMap(place => place ? [place] : throwError(() => new LocationError(`We couldn't find "${query}". Try a city name or ZIP code.`)))
    ));
  }

  private run(center$: Observable<Coordinates>): void {
    this.state = 'locating';
    this.error = '';
    this.subscription?.unsubscribe();
    this.subscription = center$.pipe(
      switchMap(center => {
        this.center = center;
        this.searchedLabel = center.label?.split(',').slice(0, 2).join(',') || '';
        this.state = 'loading';
        this.showMap(center.lat, center.lon);
        return combineLatest([
          this.places.nearby(center.lat, center.lon, this.radius),
          this.restaurantService.restaurants$.pipe(take(1)),
        ]);
      })
    ).subscribe({
      next: ([places, restaurants]) => {
        this.matches = [];
        this.others = [];
        for (const place of places) {
          const restaurant = this.restaurantService.findByName(restaurants, place.name, place.brand);
          if (restaurant) {
            this.matches.push({ place, restaurant });
          } else {
            this.others.push(place);
          }
        }
        // Places with allergy-friendly tags first.
        this.others.sort((a, b) => (b.diets.length ? 1 : 0) - (a.diets.length ? 1 : 0) || a.distanceKm - b.distanceKm);
        this.state = 'done';
        this.drawMarkers();
      },
      error: (error: Error) => {
        this.state = 'error';
        this.error = error instanceof LocationError
          ? error.message
          : "OpenStreetMap's free servers are busy right now. Please try again in a minute, or pick a smaller area.";
      },
    });
  }

  setRadius(radius: number): void {
    this.radius = radius;
    if (this.state === 'done' && this.center) {
      this.run(of(this.center));
    }
  }

  submitQueryParams(place: Place) {
    return { name: place.name, osm: place.id, lat: place.lat.toFixed(5), lon: place.lon.toFixed(5), website: place.website };
  }

  /** Leaflet is CommonJS, so the namespace may come wrapped in a default export. */
  private async leaflet(): Promise<typeof Leaflet> {
    const module: any = await import('leaflet');
    return module.default ?? module;
  }

  private async showMap(lat: number, lon: number): Promise<void> {
    const L = await this.leaflet();
    if (!this.map) {
      this.map = L.map(this.mapElement.nativeElement, { scrollWheelZoom: false });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(this.map);
      this.markers = L.layerGroup().addTo(this.map);
    }
    this.markers!.clearLayers();
    this.map.setView([lat, lon], this.radius > 3000 ? 13 : 14);
    L.circleMarker([lat, lon], { radius: 8, color: '#fff', weight: 3, fillColor: '#1565c0', fillOpacity: 1 })
      .bindTooltip('You are here').addTo(this.markers!);
  }

  private async drawMarkers(): Promise<void> {
    const L = await this.leaflet();
    if (!this.map || !this.markers) {
      return;
    }
    // The map container was hidden until now, so let Leaflet measure it again.
    setTimeout(() => this.map?.invalidateSize());
    for (const place of this.others) {
      L.circleMarker([place.lat, place.lon], { radius: 5, color: '#78909c', weight: 1, fillColor: '#b0bec5', fillOpacity: .9 })
        .bindTooltip(place.name).addTo(this.markers);
    }
    for (const { place, restaurant } of this.matches) {
      const rating = restaurant.safetyRating || 0;
      const color = rating >= 60 ? '#1b7f3b' : rating >= 30 ? '#f4b400' : '#c62828';
      L.circleMarker([place.lat, place.lon], { radius: 10, color: '#fff', weight: 2, fillColor: color, fillOpacity: 1 })
        .bindTooltip(`${restaurant.name}: ${rating}% safe`)
        .on('click', () => this.zone.run(() => this.router.navigate(['/restaurant/detail', restaurant.id])))
        .addTo(this.markers);
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.map?.remove();
  }
}
