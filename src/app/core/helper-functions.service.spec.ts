import { TestBed } from '@angular/core/testing';

import { HelperFunctionsService } from './helper-functions.service';

describe('HelperFunctionsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: HelperFunctionsService = TestBed.get(HelperFunctionsService);
    expect(service).toBeTruthy();
  });
});
