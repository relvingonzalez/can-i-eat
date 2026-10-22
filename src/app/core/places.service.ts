import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NEVER, Observable, race, timer } from 'rxjs';
import { catchError, map, switchMap, timeout } from 'rxjs/operators';

export interface Coordinates {
  lat: number;
  lon: number;
  label?: string;
}

export interface Place {
  id: string;
  name: string;
  brand?: string;
  lat: number;
  lon: number;
  cuisine?: string;
  /** e.g. ["gluten free", "vegan"] from OpenStreetMap diet:* tags */
  diets: string[];
  website?: string;
  address?: string;
  distanceKm: number;
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

/** Public Overpass servers. They are free but sometimes slow or busy. */
const OVERPASS_PRIMARY = 'https://overpass-api.de/api/interpreter';
const OVERPASS_MIRROR = 'https://maps.mail.ru/osm/tools/overpass/api/interpreter';
/** Ask the mirror too if the primary hasn't answered by then; first answer wins. */
const MIRROR_DELAY_MS = 8000;
const OVERPASS_TIMEOUT_MS = 45000;
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Nearby restaurants from OpenStreetMap via the free Overpass API (no key, fair use). */
@Injectable({
  providedIn: 'root'
})
export class PlacesService {
  constructor(private http: HttpClient) {}

  /** Address, city or ZIP -> coordinates, via OpenStreetMap's free Nominatim geocoder (one lookup per search). */
  geocode(query: string): Observable<Coordinates | undefined> {
    const params = { q: query, format: 'jsonv2', limit: '1' };
    return this.http.get<{ lat: string; lon: string; display_name: string }[]>(NOMINATIM_URL, { params }).pipe(
      map(results => results[0] && { lat: Number(results[0].lat), lon: Number(results[0].lon), label: results[0].display_name })
    );
  }

  nearby(lat: number, lon: number, radiusMeters: number): Observable<Place[]> {
    const query = `[out:json][timeout:25];
      nwr["amenity"~"^(restaurant|fast_food|cafe|food_court|ice_cream)$"]["name"](around:${radiusMeters},${lat},${lon});
      out center tags 300;`;
    const body = new URLSearchParams({ data: query }).toString();
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });

    const request = (url: string) =>
      this.http.post<{ elements: OverpassElement[] }>(url, body, { headers }).pipe(catchError(() => NEVER));

    return race(
      request(OVERPASS_PRIMARY),
      timer(MIRROR_DELAY_MS).pipe(switchMap(() => request(OVERPASS_MIRROR))),
    ).pipe(
      timeout(OVERPASS_TIMEOUT_MS),
      map(response => response.elements
        .map(element => this.toPlace(element, lat, lon))
        .filter((place): place is Place => !!place)
        .sort((a, b) => a.distanceKm - b.distanceKm))
    );
  }

  private toPlace(element: OverpassElement, fromLat: number, fromLon: number): Place | undefined {
    const tags = element.tags || {};
    const lat = element.lat ?? element.center?.lat;
    const lon = element.lon ?? element.center?.lon;
    if (!tags['name'] || lat === undefined || lon === undefined) {
      return undefined;
    }
    const diets = Object.entries(tags)
      .filter(([key, value]) => key.startsWith('diet:') && (value === 'yes' || value === 'only'))
      .map(([key, value]) => `${key.slice(5).replace(/_/g, ' ')}${value === 'only' ? ' only' : ''}`);
    const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
    return {
      id: `${element.type}/${element.id}`,
      name: tags['name'],
      brand: tags['brand'],
      lat,
      lon,
      cuisine: tags['cuisine']?.split(';').map(c => c.replace(/_/g, ' ')).join(', '),
      diets,
      website: tags['website'] || tags['contact:website'],
      address: [street, tags['addr:city']].filter(Boolean).join(', ') || undefined,
      distanceKm: distanceKm(fromLat, fromLon, lat, lon),
    };
  }
}
