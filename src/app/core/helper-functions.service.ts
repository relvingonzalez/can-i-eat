import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MessageService } from './message.service';

@Injectable({
  providedIn: 'root'
})
export class HelperFunctionsService {

  	constructor(
    	private messageService: MessageService
   	) { }

	/** Log a RestaurantService message with the MessageService */
	log(message: string) {
		this.messageService.add(`${message}`);
	}

	groupBy<T, K extends keyof any>(arr: T[], key: (i: T) => K){
		return    arr.reduce((groups, item) => {
		(groups[key(item)] ||= []).push(item);
		return groups;
		}, {} as Record<K, T[]>);
	}

	getUserLocation(): Observable<GeolocationCoordinates> {
		return new Observable<GeolocationCoordinates>((observer) => {
				if (navigator.geolocation) {
					navigator.geolocation.getCurrentPosition((position) => {
						const coords = position.coords;
						observer.next(position.coords);
						observer.complete();
					});
				} else {
					observer.error('Geolocation is not supported by this browser.');
				}
		});
	}

	/**
	 * Handle Http operation that failed.
	 * Let the app continue.
	 * @param operation - name of the operation that failed
	 * @param result - optional value to return as the observable result
	 */
	handleError<T> (operation = 'operation', result?: T) {
	  return (error: any): Observable<T> => {

	    // TODO: send the error to remote logging infrastructure
	    console.error(error); // log to console instead

	    // TODO: better job of transforming error for user consumption
	    this.log(`${operation} failed: ${error.message}`);

	    // Let the app keep running by returning an empty result.
	    return of(result as T);
	  };
	}
}
