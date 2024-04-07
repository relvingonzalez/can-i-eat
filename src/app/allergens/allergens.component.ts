import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { Component, OnInit } from '@angular/core';
import { Allergen } from '../shared/models/allergen.model';
import { AllergenService } from '../core/allergen.service';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import {  MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgForOf } from '@angular/common';
import {MatIconModule} from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'app-allergens',
  templateUrl: './allergens.component.html',
  styleUrls: ['./allergens.component.scss'],
  imports: [MatChipsModule, MatInputModule, MatFormField, NgForOf, MatIconModule]
})
export class AllergensComponent implements OnInit {
  private ngUnsubscribe = new Subject();
  addOnBlur: Boolean;
  allergens: Allergen[];
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor(private allergenService: AllergenService) {
    this.addOnBlur = true;
  }

  getAllergens(): void {
    this.allergenService.getAllergens()
      .subscribe(allergens => this.allergens = allergens || []);
  }

  ngOnInit() {
    this.getAllergens();
  }

  add(event: MatChipInputEvent): void {
    const input = event.input;
    const name = event.value;

    if (!name) { return; }

    name.trim();
    this.allergenService.addAllergen({ name } as Allergen)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(allergen => {
        this.allergens.push(allergen);
        // Reset the input value
        if (input) {
          input.value = '';
        }
      });
  }

  delete(allergen: Allergen): void {
    this.allergenService.deleteAllergen(allergen)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(allergen => {
        this.allergens = this.allergens.filter(a => a !== allergen);
      });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next(true);
    this.ngUnsubscribe.complete();
  }
}
