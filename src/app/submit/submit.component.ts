import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { ALLERGEN_CATALOG } from '../core/allergen-catalog';
import { FirebaseService } from '../core/firebase.service';
import { RestaurantSubmission, SubmissionItem } from '../shared/models/submission.model';

const MAX_ITEMS = 150;

@Component({
  standalone: true,
  selector: 'app-submit',
  templateUrl: './submit.component.html',
  styleUrls: ['./submit.component.scss'],
  imports: [ReactiveFormsModule, RouterLink, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule],
})
export class SubmitComponent {
  readonly allergens = ALLERGEN_CATALOG.filter(a => a.big9 || a.key === 'gluten');
  state: 'editing' | 'sending' | 'sent' | 'error' = 'editing';

  readonly form = this.fb.nonNullable.group({
    restaurantName: ['', [Validators.required, Validators.maxLength(120)]],
    city: ['', Validators.maxLength(80)],
    website: ['', Validators.maxLength(300)],
    sourceNote: ['', [Validators.required, Validators.maxLength(500)]],
    covers: this.fb.nonNullable.control<string[]>(this.allergens.map(a => a.key)),
    items: this.fb.array([this.newItem()]),
  });

  private place: Pick<RestaurantSubmission, 'osmId' | 'lat' | 'lon'> = {};

  constructor(private fb: FormBuilder, private firebaseService: FirebaseService, route: ActivatedRoute) {
    const params = route.snapshot.queryParamMap;
    this.form.patchValue({ restaurantName: params.get('name') || '', website: params.get('website') || '' });
    const lat = Number(params.get('lat'));
    const lon = Number(params.get('lon'));
    this.place = {
      osmId: params.get('osm') || undefined,
      lat: Number.isFinite(lat) && params.get('lat') ? lat : undefined,
      lon: Number.isFinite(lon) && params.get('lon') ? lon : undefined,
    };
  }

  get items(): FormArray {
    return this.form.controls.items;
  }

  private newItem() {
    return this.fb.nonNullable.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      category: ['', Validators.maxLength(60)],
      ingredients: ['', Validators.maxLength(2000)],
      contains: this.fb.nonNullable.control<string[]>([]),
    });
  }

  addItem(): void {
    if (this.items.length < MAX_ITEMS) {
      this.items.push(this.newItem());
    }
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  toggle(control: FormControl<string[]>, key: string): void {
    const value = control.value;
    control.setValue(value.includes(key) ? value.filter(k => k !== key) : [...value, key]);
  }

  submit(): void {
    if (this.form.invalid || !this.items.length) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const items: SubmissionItem[] = value.items.map(item => ({
      name: item.name.trim(),
      category: item.category.trim() || 'Menu',
      ingredients: item.ingredients.trim() || undefined,
      contains: item.contains,
    }));
    const submission = {
      restaurantName: value.restaurantName.trim(),
      city: value.city.trim() || undefined,
      website: value.website.trim() || undefined,
      sourceNote: value.sourceNote.trim(),
      covers: value.covers,
      items,
      ...this.place,
    };
    this.state = 'sending';
    this.firebaseService.submitRestaurant(submission).subscribe({
      next: () => (this.state = 'sent'),
      error: () => (this.state = 'error'),
    });
  }

  reset(): void {
    this.form.reset();
    this.items.clear();
    this.addItem();
    this.state = 'editing';
  }
}
