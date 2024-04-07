import { Component, OnInit } from '@angular/core';

import { Observable, Subject } from 'rxjs';

import { Allergen } from '../shared/models/allergen.model';
import { AllergenService } from '../core/allergen.service';
import {RouterModule} from '@angular/router';
import {  MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgFor, AsyncPipe } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-allergen-search',
  templateUrl: './allergen-search.component.html',
  styleUrls: [ './allergen-search.component.scss' ],
  imports: [AsyncPipe, NgFor, RouterModule, MatInputModule, MatFormField],
})
export class AllergenSearchComponent implements OnInit {
  allergens$: Observable<Allergen[]>;
  private searchTerms = new Subject<string>();

  constructor(private allergenService: AllergenService) {}

  // Push a search term into the observable stream.
  search(term: string): void {
    this.searchTerms.next(term);
  }

  ngOnInit(): void {

  }
}
