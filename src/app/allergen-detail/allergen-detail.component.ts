import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Location, NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, Input } from '@angular/core';
import { Allergen } from '../shared/models/allergen.model';
import { AllergenService }  from '../core/allergen.service';
import { UpperCasePipe} from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  standalone: true,
  selector: 'app-allergen-detail',
  templateUrl: './allergen-detail.component.html',
  styleUrls: ['./allergen-detail.component.scss'],
  imports: [NgIf, FormsModule, UpperCasePipe],
})
export class AllergenDetailComponent implements OnInit {
  @Input() allergen: Allergen;
  private ngUnsubscribe = new Subject();

  constructor(
    private route: ActivatedRoute,
    private allergenService: AllergenService,
    private location: Location
  ) {}

  ngOnInit() {
  	this.getAllergen();
  }

  getAllergen(): void {
    const name = this.route.snapshot.paramMap.get('name');
    this.allergenService.getAllergen(name)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(allergen => {
        if (allergen) {
          this.allergen = allergen;
        }
      })
  }

  goBack(): void {
    this.location.back();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next(true);
    this.ngUnsubscribe.complete();
  }
}
