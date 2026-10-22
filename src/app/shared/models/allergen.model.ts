export interface Allergen {
  name: string;
}

export interface Profile {
  id: string;
  name: string;
  allergens: Allergen[];
}
