import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AllergenSearchComponent } from './allergen-search.component';

describe('AllergenSearchComponent', () => {
  let component: AllergenSearchComponent;
  let fixture: ComponentFixture<AllergenSearchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AllergenSearchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AllergenSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
