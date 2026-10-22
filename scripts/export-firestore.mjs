#!/usr/bin/env node
/**
 * One-off: copies the hand-entered restaurants from Firestore into src/assets/data/restaurants.json,
 * so the app can ship them as static data. Re-run it if you edit restaurants in the Firebase console.
 *
 *   npm run data:export
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const PROJECT = 'allergysaferestaurantsapp';
const API_KEY = 'AIzaSyA0VcvNUYjF5TnsMl5rvdI7cn11Bv-MH2M';
const OUTPUT = fileURLToPath(new URL('../src/assets/data/restaurants.json', import.meta.url));

/** Firestore REST values are typed ({ stringValue: 'x' }); unwrap them into plain JSON. */
function unwrap(value) {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(unwrap);
  if ('mapValue' in value) return unwrapFields(value.mapValue.fields || {});
  return undefined;
}

function unwrapFields(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, unwrap(value)]));
}

function slug(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-');
}

function uniqueId(seen, id) {
  const count = (seen.get(id) || 0) + 1;
  seen.set(id, count);
  return count > 1 ? `${id}-${count}` : id;
}

const documents = [];
let pageToken = '';
do {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/restaurants?pageSize=100&key=${API_KEY}${pageToken ? `&pageToken=${pageToken}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Firestore export failed: ${res.status} ${await res.text()}`);
  }
  const page = await res.json();
  documents.push(...(page.documents || []));
  pageToken = page.nextPageToken || '';
} while (pageToken);

const restaurants = documents.map(doc => {
  const data = unwrapFields(doc.fields);
  const ids = new Map();
  const menu = (data.menu || []).map(item => ({
    id: uniqueId(ids, slug(`${item.category || 'menu'}-${item.name}`)),
    category: item.category || 'Menu',
    name: item.name,
    ingredients: item.ingredients || '',
  }));
  return {
    id: doc.name.split('/').pop(),
    name: data.name,
    logo: data.logo,
    keywords: (data.keywords || []).map(k => k.toLowerCase()),
    source: 'curated',
    lastVerified: doc.updateTime?.slice(0, 10),
    menu,
  };
}).sort((a, b) => a.name.localeCompare(b.name));

await writeFile(OUTPUT, JSON.stringify({ restaurants }, null, 2) + '\n');
console.log(`Exported ${restaurants.length} restaurants to ${OUTPUT}`);
