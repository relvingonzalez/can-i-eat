import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AllergenDetailComponent } from './allergen-detail.component';

describe('AllergenDetailComponent', () => {
  let component: AllergenDetailComponent;
  let fixture: ComponentFixture<AllergenDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AllergenDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AllergenDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
