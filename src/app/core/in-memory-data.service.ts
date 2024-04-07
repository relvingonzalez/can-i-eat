import { InMemoryDbService } from 'angular-in-memory-web-api';
import { Injectable } from '@angular/core';

import { Allergen } from '../shared/models/allergen.model';
import { Restaurant } from '../shared/models/restaurant.model';

@Injectable({
  providedIn: 'root',
})
export class InMemoryDataService implements InMemoryDbService {
  createDb() {
    const allergens = [
      { name: 'peanut' },
      { name: 'sunflower' },
      { name: 'wheat' },
      { name: 'cranberry' },
      { name: 'milk' },
      { name: 'honeydew melon' },
      { name: 'hazelnut' },
      { name: 'egg' },
      { name: 'pineapple' },
      { name: 'almond' }
    ];

    const restaurants = [
      { id: 1, 
        logo: '../assets/images/pizza-hut.png',
        menu: [
          {name: 'Pan:Fresh Crust', ingredients: 'Water, Pan Dough Blend (Salt, Dry Yeast, Sugar, Whey Powder, Distilled Vegetable Monoglycerides, Soybean Oil, Diacetyl Tartaric Acid Esters Of Mono And Diglycerides, Ascorbic Acid, Pentosanase And Amylase), Vegetable Oil, Flour (Wheat Flour, Niacin, Iron, Thiamine  Mononitrate, Riboflavin, Folic Acid), Pan Release(Soybean Oil, Lecithin, Propellant)'},
          {name: 'Stuffed Crust', ingredients: 'Water, Vegetable Oil, Classic Premix(Enriched Bleached Wheat Flour (Bleached Wheat Flour,Malted Barley Flour,Niacin,Ferrous Sulfate,Thiamine Mononitrate,Riboflavin,Folic Acid),Soybean Oil,Salt,Yeast),Pan Release(Soybean Oil,Lecithin,Propellant),Butter Garlic Spray(Corn Oil,Extra Virgin Olive Oil,Natural ButterFlavour,Natural Garlic Flavour,Beta Carotene(Color),Propellant),String CheeseCheese:(Pasteurized Skimmed Milk, Bacterial Culture, Salt, Calcium Chloride,Microbial Enzyme), Modified Milk Ingredients, Water, Natural Flavour, Sodium Phosphates, Potassium Chloride, Salt, Potassium Sorbate'}
        ],
        name: 'Pizza Hut',
        favorite: true
      },
      { id: 2, 
        logo: '../assets/images/olive-garden.png',
        menu: [
          {name: 'Lobster Shrimp Italian Mac & Cheese', ingredients: 'Dairy, Milk, Fish, Crustacean shellfish, shrimp, mollusks, wheat(gluten), soy'},
          {name: 'Rotini with Marinara', ingredients: 'Soy, Sulfites'}
        ],
        name: 'Olive Garden',
        favorite: true
      }
    ];
    return {
      allergens: allergens,
      restaurants: restaurants
    };
  }
}