import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AllergensComponent } from './allergens.component';

describe('AllergensComponent', () => {
  let component: AllergensComponent;
  let fixture: ComponentFixture<AllergensComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AllergensComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AllergensComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
