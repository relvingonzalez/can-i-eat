import { Injectable } from '@angular/core';
import { HelperFunctionsService } from './helper-functions.service';
import { map } from 'rxjs/operators';

type CallbackFunction = (a: google.maps.places.PlaceResult[] | null, b: google.maps.places.PlacesServiceStatus, c: google.maps.places.PlaceSearchPagination | null) => void;

@Injectable({
  providedIn: 'root'
})
export class GoogleService {

	constructor(
		private helperFunctionsService: HelperFunctionsService
    ) { }

	getNearbyRestaurants(callback: CallbackFunction): any {
		return this.helperFunctionsService.getUserLocation()
		  .pipe(
		    map((coords: GeolocationCoordinates) => {
		    let userLocation = new google.maps.LatLng(coords.latitude, coords.longitude);

		    let request = {
		    	location: userLocation,
		    	radius: 5000,
		    	type: 'restaurant'
		    };

		    let service = new google.maps.places.PlacesService(document.createElement('div'));
		    service.nearbySearch(request, callback);
		}));

	}
}
