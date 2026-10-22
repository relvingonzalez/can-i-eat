#!/usr/bin/env node
/**
 * Scrapes official allergen/ingredient pages and writes src/assets/data/chains.json.
 *
 *   npm run data:scrape                 # all adapters
 *   npm run data:scrape -- sweetgreen   # only adapters whose id contains "sweetgreen"
 *
 * If an adapter fails, or returns far fewer items than last time, the previous data for that
 * restaurant is kept so a site redesign can never wipe a menu.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import chickFilA from './adapters/chick-fil-a.mjs';
import inNOut from './adapters/in-n-out.mjs';
import sweetgreen from './adapters/sweetgreen.mjs';

const ADAPTERS = [chickFilA, inNOut, sweetgreen];
const OUTPUT = fileURLToPath(new URL('../../src/assets/data/chains.json', import.meta.url));
const MIN_RATIO = 0.5;

async function readPrevious() {
  try {
    const data = JSON.parse(await readFile(OUTPUT, 'utf8'));
    return new Map(data.restaurants.map(r => [r.id, r]));
  } catch {
    return new Map();
  }
}

const filter = process.argv[2];
const previous = await readPrevious();
const results = new Map(previous);
const today = new Date().toISOString().slice(0, 10);
let failures = 0;

for (const adapter of ADAPTERS.filter(a => !filter || a.id.includes(filter))) {
  const old = previous.get(adapter.id);
  try {
    const scraped = await adapter.scrape();
    const count = scraped.menu.length;
    if (!count || (old && count < old.menu.length * MIN_RATIO)) {
      throw new Error(`only ${count} items (previously ${old?.menu.length ?? 0}); keeping old data`);
    }
    const { scrape, ...meta } = adapter;
    results.set(adapter.id, { ...meta, ...scraped, logo: scraped.logo || old?.logo, source: 'official', lastVerified: today });
    console.log(`✔ ${adapter.name}: ${count} items`);
  } catch (error) {
    failures++;
    console.error(`✘ ${adapter.name}: ${error.message}`);
  }
}

const restaurants = [...results.values()].sort((a, b) => a.name.localeCompare(b.name));
await writeFile(OUTPUT, JSON.stringify({ restaurants }, null, 2) + '\n');
console.log(`Wrote ${restaurants.length} restaurants to ${OUTPUT}`);

if (failures && failures === ADAPTERS.length) {
  process.exit(1);
}
