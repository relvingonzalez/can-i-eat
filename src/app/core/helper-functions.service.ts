import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

/** A location failure whose message is fit to show to the user. */
export class LocationError extends Error {}

@Injectable({
  providedIn: 'root'
})
export class HelperFunctionsService {

	groupBy<T, K extends keyof any>(arr: T[], key: (i: T) => K) {
		return arr.reduce((groups, item) => {
			(groups[key(item)] ||= []).push(item);
			return groups;
		}, {} as Record<K, T[]>);
	}

	getUserLocation(): Observable<GeolocationCoordinates> {
		return new Observable<GeolocationCoordinates>((observer) => {
			if (typeof navigator === 'undefined' || !navigator.geolocation) {
				observer.error(new LocationError("This browser can't share your location. Search by city or ZIP instead."));
				return;
			}
			navigator.geolocation.getCurrentPosition(
				(position) => {
					observer.next(position.coords);
					observer.complete();
				},
				(error) => observer.error(new LocationError(error.code === error.PERMISSION_DENIED
					? 'Location access is blocked for this site. Allow it in your browser, or search by city or ZIP instead.'
					// Some browsers (e.g. Brave on Linux) have no location service, so this fails without a prompt.
					: "Your browser couldn't work out where you are. Search by city or ZIP instead.")),
				{ enableHighAccuracy: false, timeout: 15000, maximumAge: 5 * 60 * 1000 }
			);
		});
	}

	/**
	 * Handle an operation that failed and let the app continue.
	 * @param operation - name of the operation that failed
	 * @param result - optional value to return as the observable result
	 */
	handleError<T>(operation = 'operation', result?: T) {
		return (error: any): Observable<T> => {
			console.error(`${operation} failed`, error);
			return of(result as T);
		};
	}
}
