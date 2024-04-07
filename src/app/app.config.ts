import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { HttpClientModule, provideHttpClient, withFetch } from '@angular/common/http';
import { FunctionsModule } from '@angular/fire/functions';

export const appConfig: ApplicationConfig = {

  providers: [provideRouter(routes), provideClientHydration(), provideAnimationsAsync(), provideHttpClient(withFetch()), importProvidersFrom(HttpClientModule, FunctionsModule, provideFirebaseApp(() => initializeApp({"projectId":"allergysaferestaurantsapp","appId":"1:110309948567:web:a4c9a96e3ef9d9de883dd2","databaseURL":"https://allergysaferestaurantsapp.firebaseio.com","storageBucket":"allergysaferestaurantsapp.appspot.com","apiKey":"AIzaSyA0VcvNUYjF5TnsMl5rvdI7cn11Bv-MH2M","authDomain":"allergysaferestaurantsapp.firebaseapp.com","messagingSenderId":"110309948567"}))), importProvidersFrom(provideFirestore(() => getFirestore()))]
};
