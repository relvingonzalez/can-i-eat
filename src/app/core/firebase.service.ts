import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { RestaurantSubmission } from '../shared/models/submission.model';
import { Restaurant } from '../shared/models/restaurant.model';

const PROJECT = 'allergysaferestaurantsapp';
const API_KEY = 'AIzaSyA0VcvNUYjF5TnsMl5rvdI7cn11Bv-MH2M';
const DOCUMENTS = `projects/${PROJECT}/databases/(default)/documents`;
const API = `https://firestore.googleapis.com/v1/${DOCUMENTS}`;

type FirestoreValue =
  | { stringValue: string }
  | { doubleValue: number }
  | { integerValue: string }
  | { booleanValue: boolean }
  | { timestampValue: string }
  | { nullValue: null }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } };

interface FirestoreDocument {
  name: string;
  fields: Record<string, FirestoreValue>;
}

function toValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') return { doubleValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toValue) } };
  return { mapValue: { fields: toFields(value as Record<string, unknown>) } };
}

function toFields(data: Record<string, unknown>): Record<string, FirestoreValue> {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined).map(([k, v]) => [k, toValue(v)]));
}

function fromValue(value: FirestoreValue): any {
  if ('stringValue' in value) return value.stringValue;
  if ('doubleValue' in value) return value.doubleValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(fromValue);
  if ('mapValue' in value) return fromFields(value.mapValue.fields || {});
  return null;
}

function fromFields(fields: Record<string, FirestoreValue>): Record<string, any> {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, fromValue(v)]));
}

function newDocumentId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return Array.from(bytes, b => chars[b % chars.length]).join('');
}

/**
 * Community submissions in Firestore, via its REST API (no SDK, so nothing heavy in the bundle).
 * Restaurant data ships with the app in src/assets/data; see scripts/ for how it is produced.
 * Access is governed by firestore.rules.
 */
@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private http = inject(HttpClient);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  submitRestaurant(submission: Omit<RestaurantSubmission, 'status' | 'submittedAt'>): Observable<string> {
    const id = newDocumentId();
    const body = {
      writes: [{
        update: { name: `${DOCUMENTS}/submissions/${id}`, fields: toFields({ ...submission, status: 'pending' }) },
        currentDocument: { exists: false },
        updateTransforms: [{ fieldPath: 'submittedAt', setToServerValue: 'REQUEST_TIME' }],
      }],
    };
    return this.http.post(`${API}:commit?key=${API_KEY}`, body).pipe(map(() => id));
  }

  /** Submissions the maintainer approved (by setting status to "approved" in the Firebase console). */
  approvedRestaurants(): Observable<Restaurant[]> {
    if (!this.isBrowser) {
      return of([]);
    }
    const body = {
      structuredQuery: {
        from: [{ collectionId: 'submissions' }],
        where: { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'approved' } } },
        limit: 500,
      },
    };
    return this.http.post<{ document?: FirestoreDocument }[]>(`${API}:runQuery?key=${API_KEY}`, body).pipe(
      map(rows => rows
        .filter(row => row.document)
        .map(row => toRestaurant({
          ...fromFields(row.document!.fields),
          id: row.document!.name.split('/').pop(),
        } as RestaurantSubmission)))
    );
  }
}

function toRestaurant(submission: RestaurantSubmission): Restaurant {
  const name = submission.restaurantName;
  const sourceIsUrl = /^https?:\/\//.test(submission.sourceNote || '');
  return {
    id: `community-${submission.id}`,
    name,
    city: submission.city,
    website: submission.website,
    keywords: [name, submission.city || ''].join(' ').toLowerCase().split(/\s+/).filter(Boolean),
    source: 'community',
    sourceUrl: sourceIsUrl ? submission.sourceNote : submission.website,
    notes: submission.sourceNote && !sourceIsUrl ? [`Submitter's source: ${submission.sourceNote}`] : [],
    covers: submission.covers || [],
    lastVerified: typeof submission.submittedAt === 'string' ? submission.submittedAt.slice(0, 10) : undefined,
    menu: (submission.items || []).map((item, i) => ({
      id: `item-${i}`,
      name: item.name,
      category: item.category || 'Menu',
      ingredients: item.ingredients,
      contains: item.contains || [],
    })),
  };
}
