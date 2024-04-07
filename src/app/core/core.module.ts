import { NgModule } from '@angular/core';

import { AllergenService } from './allergen.service';
import { FirebaseService } from './firebase.service';
import { GoogleService } from './google.service';
import { HelperFunctionsService } from './helper-functions.service';
import { InMemoryDataService } from './in-memory-data.service';
import { MessageService } from './message.service';
import { RestaurantService } from './restaurant.service';

@NgModule({
  declarations: [],
  imports: [],
  providers: [
  	AllergenService,
  	FirebaseService,
  	GoogleService,
  	HelperFunctionsService,
  	InMemoryDataService,
  	MessageService,
  	RestaurantService
  ]
})
export class CoreModule { }
