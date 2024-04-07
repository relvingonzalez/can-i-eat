import { Injectable } from '@angular/core';
import { Observable, Subject, of } from 'rxjs';
import { MessageService } from './message.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {  map, mergeMap } from 'rxjs/operators';
import { JSONSchema, StorageMap } from "@ngx-pwa/local-storage";

import { Allergen } from '../shared/models/allergen.model';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

const schema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      derivatives: {
        type: 'array',
        items: {
            type: 'string',
        },
      }
    },
    required: ['name']
  },
} satisfies JSONSchema;

@Injectable({
  providedIn: 'root'
})
export class AllergenService {
  private derivatives = new Map();
  private allergensSource = new Subject<Allergen[]>();
  data$ = this.allergensSource.asObservable();

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
    protected localStorage: StorageMap) {
    this.createDerivativesMap();
  }


  /** Log a AllergenService message with the MessageService */
  private log(message: string) {
    this.messageService.add(`AllergenService: ${message}`);
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T> (operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      this.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  private createDerivativesMap() {
    this.derivatives.set('milk', ['cheese', 'dairy']);
    this.derivatives.set('dairy', ['milk', 'cheese']);
    this.derivatives.set('gluten', ['wheat', 'barley', 'rye', 'malt']);
  }

  // stream of updated allergens
  next(data: Allergen[]) {
    this.allergensSource.next(data);
  }

  // add derivatives here
  findDerivatives(allergen: Allergen): string[] {
    var allergenName = allergen.name.toLowerCase();
    return this.derivatives.get(allergenName) || [];
  }

  getProblemIngredients(allergens: Allergen[], ingredients: string) {
    var passed = true,
        problemIngredients = '';

    for(let allergen of allergens) {
      var allergenName = allergen.name.toLowerCase();
      if(ingredients.includes(allergenName) || allergen.derivatives.some(derivative => ingredients.includes(derivative))) {
        problemIngredients = problemIngredients ? `${problemIngredients}, ${allergenName}` : allergenName;
      }
    };
    return problemIngredients;
  }

  getAllergens(): Observable<Allergen[]> {
  	return this.localStorage.get<Allergen[]>('allergens', schema)
    .pipe(
      map((allergens) => {
        if (allergens !== undefined) {
          this.next(allergens);
          return allergens;
        }
        return [];
      })
    );
  }

  getAllergen(name: string | null) : Observable<Allergen | undefined> {
    return this.getAllergens().pipe(map((allergens) => {
      return allergens.find(allergen => allergen.name === name);
    }));
  }

  /** POST: add a new Allergen to the server */
  addAllergen(allergen: Allergen) : Observable<Allergen> {
    return this.getAllergens()
    .pipe(
      map((allergens) => allergens),
      mergeMap((allergens) => {
        allergen.derivatives = this.findDerivatives(allergen);
        allergens.push(allergen);
        this.next(allergens);
        return this.localStorage.set('allergens', allergens)
          .pipe(map(() => allergen));
      })
    )
  }

  /** DELETE: delete the allergen from the server */
  deleteAllergen(allergen: Allergen) : Observable<Allergen>{
    return this.getAllergens()
      .pipe(
        map((allergens) => allergens),
        mergeMap((allergens)=> {
          allergens.splice(allergens.findIndex(a => a.name === allergen.name), 1);
          this.next(allergens);
          return this.localStorage.set('allergens', allergens)
            .pipe(map(() => allergen));
        })
    );
  }
}
