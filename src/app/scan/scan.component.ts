import { Component, ElementRef, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { IScannerControls } from '@zxing/browser';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';

import { AllergenService } from '../core/allergen.service';
import { buildMatcher, evaluateItem, ItemEvaluation } from '../core/allergen-matcher';
import { FoodFactsService, Product } from '../core/food-facts.service';
import { IngredientTextComponent } from '../shared/components/ingredient-text.component';
import { StatusPillComponent } from '../shared/components/status-pill.component';

type Lookup =
  | { state: 'idle' }
  | { state: 'loading'; code: string }
  | { state: 'not-found'; code: string }
  | { state: 'error'; code: string }
  | { state: 'found'; product: Product; evaluation: ItemEvaluation };

@Component({
  standalone: true,
  selector: 'app-scan',
  templateUrl: './scan.component.html',
  styleUrls: ['./scan.component.scss'],
  imports: [
    AsyncPipe, FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule,
    MatProgressSpinnerModule, IngredientTextComponent, StatusPillComponent,
  ],
})
export class ScanComponent implements OnDestroy {
  @ViewChild('video') video: ElementRef<HTMLVideoElement>;

  private code$ = new BehaviorSubject<string | null>(null);
  private controls?: IScannerControls;
  scanning = false;
  cameraError = '';
  manualCode = '';
  imageFailed = false;

  readonly lookup$: Observable<Lookup> = combineLatest([this.code$, this.allergenService.allergens$]).pipe(
    switchMap(([code, allergens]) => {
      if (!code) {
        return of<Lookup>({ state: 'idle' });
      }
      return this.foodFacts.lookup(code).pipe(
        map((product): Lookup => product
          ? { state: 'found', product, evaluation: evaluateItem(product.item, allergens.map(buildMatcher), product.covers) }
          : { state: 'not-found', code }),
        catchError(() => of<Lookup>({ state: 'error', code })),
        startWith<Lookup>({ state: 'loading', code })
      );
    })
  );

  constructor(private allergenService: AllergenService, private foodFacts: FoodFactsService, private zone: NgZone) {}

  async startCamera(): Promise<void> {
    this.cameraError = '';
    this.scanning = true;
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const reader = new BrowserMultiFormatReader();
      this.controls = await reader.decodeFromConstraints(
        { video: { facingMode: 'environment' } },
        this.video.nativeElement,
        (result) => {
          if (result) {
            this.zone.run(() => {
              this.stopCamera();
              this.search(result.getText());
            });
          }
        }
      );
    } catch {
      this.scanning = false;
      this.cameraError = 'Could not open the camera. Allow camera access, or type the barcode number below.';
    }
  }

  stopCamera(): void {
    this.controls?.stop();
    this.controls = undefined;
    this.scanning = false;
  }

  search(code: string): void {
    const digits = code.replace(/\D/g, '');
    if (digits) {
      this.manualCode = digits;
      this.imageFailed = false;
      this.code$.next(digits);
    }
  }

  reset(): void {
    this.code$.next(null);
    this.manualCode = '';
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }
}
