import { MenuItem } from './menu-item.model';

export class Restaurant {
  id: string;
  favorite?: boolean;
  logo: string;
  menu: MenuItem[];
  name: string;
  safetyRating: number;
  keywords: string[];
}

export class FavoriteRestaurant {
  id: string;
  logo: string;
  menu: MenuItem[];
  name: string;
  safetyRating: number;
  keywords: string[];
}
