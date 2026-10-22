export interface SubmissionItem {
  name: string;
  category: string;
  ingredients?: string;
  /** Catalog allergen keys the submitter confirmed from the menu. */
  contains: string[];
}

/** A community-submitted menu, stored in the Firestore "submissions" collection. */
export interface RestaurantSubmission {
  id?: string;
  restaurantName: string;
  city?: string;
  website?: string;
  /** Where the info came from: a link to the restaurant's allergen menu, or a note like "asked the manager". */
  sourceNote?: string;
  osmId?: string;
  lat?: number;
  lon?: number;
  /** Allergens the submitter's source actually lists, so unticked ones aren't read as "free from". */
  covers: string[];
  items: SubmissionItem[];
  status: 'pending' | 'approved' | 'rejected';
  submittedAt?: unknown;
}
