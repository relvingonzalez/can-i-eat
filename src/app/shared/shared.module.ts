import { NgModule } from '@angular/core';

import { AllergenFilterPipe } from './pipes/allergen-filter.pipe';

@NgModule({
  declarations: [
  	AllergenFilterPipe
  ],
  exports: [
  	AllergenFilterPipe
  ]
})
export class SharedModule { }
