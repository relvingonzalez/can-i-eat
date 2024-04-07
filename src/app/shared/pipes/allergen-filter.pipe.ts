import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'allergenFilter'
})
export class AllergenFilterPipe implements PipeTransform {

  transform(value: any, args?: any): any {

  	if (!args) {
  		return;
  	}
  	var allergens = args,
  		ingredients = value.toUpperCase(),
  		matchedIngredients = '',
  		matchedIngredient = '';

  	for (var i = allergens.length - 1; i >= 0; i--) {
  		if (ingredients.includes(allergens[i].name.toUpperCase())) {
  			matchedIngredient = matchedIngredients ? ', ' + allergens[i].name : allergens[i].name;
  			matchedIngredients += matchedIngredient;
  		}
  	}

    return matchedIngredients || 'none';
  }

}