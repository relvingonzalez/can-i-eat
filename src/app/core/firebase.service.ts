import { Injectable, inject } from '@angular/core';
import { Firestore, collection, DocumentSnapshot, CollectionReference, collectionData, DocumentReference, doc, docSnapshots, query, where } from '@angular/fire/firestore';
import { Functions } from '@angular/fire/functions';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { AllergenService } from './allergen.service';
import { Restaurant } from '../shared/models/restaurant.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  doc: DocumentReference;

  firestore: Firestore = inject(Firestore);
	restaurants: Observable<any[]>;
	restaurantCollection: CollectionReference;
	restaurant: Observable<any>;
	name$: BehaviorSubject<string|null>;

	constructor(private db: Firestore, private fns: Functions) {
		this.restaurantCollection = collection(this.firestore, 'restaurants');
	}

	private extractRestaurantData(payload: DocumentSnapshot<any>) {
		const data = payload.data() as Restaurant;
		const id = payload.id;
		data.id = id;
		return data;
	}

	private extractRestaurantsData(actions: any[] = []) {
		return actions.map(a => {
			return a;
		});
	}

	GetRestaurant(id: string): Observable<Restaurant> {
    this.doc = doc(this.firestore, `restaurants/${id}`);
    this.restaurant = docSnapshots(this.doc)
    .pipe(
      map((data) =>this.extractRestaurantData(data)
    ));

		return this.restaurant;
	}

	// Read Restaurants List
	GetRestaurantsList()  {
    this.restaurants = collectionData(this.restaurantCollection, { idField: 'id' })
    .pipe(
      map((data) =>this.extractRestaurantsData(data)
    ));

		return this.restaurants;
	}

	// Read Restaurants List by name
	GetRestaurantsListByNames(restaurants: any[])  {
    const q = query(this.restaurantCollection, where("name", "in", restaurants.map(r => r.name)));
    this.restaurants = collectionData(q, { idField: 'id' })
		return this.restaurants;
	}

	SearchRestaurants(searchQuery: string) {

    const q = query(this.restaurantCollection, where("keywords", "array-contains", searchQuery.toLowerCase()));
    this.restaurants = collectionData(q, { idField: 'id' })
    .pipe(
      tap(restaurants => this.extractRestaurantsData(restaurants))
    )

		return this.restaurants;
	}
}
