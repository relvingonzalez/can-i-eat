import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { JSONSchema, StorageMap } from '@ngx-pwa/local-storage';

import { Allergen, Profile } from '../shared/models/allergen.model';

const allergensSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      name: { type: 'string' },
    },
    required: ['name'],
  },
} satisfies JSONSchema;

const profilesSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      allergens: allergensSchema,
    },
    required: ['id', 'name', 'allergens'],
  },
} satisfies JSONSchema;

export interface ProfileState {
  profiles: Profile[];
  activeId: string;
}

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Keeps allergy profiles ("Me", "My kid") in browser storage. Everything else reads the
 * active profile's allergens from allergens$.
 */
@Injectable({
  providedIn: 'root'
})
export class AllergenService {
  private state = new BehaviorSubject<ProfileState | null>(null);

  readonly state$ = this.state.pipe(filter((s): s is ProfileState => !!s));
  readonly profiles$ = this.state$.pipe(map(s => s.profiles));
  readonly activeProfile$: Observable<Profile> = this.state$.pipe(
    map(s => s.profiles.find(p => p.id === s.activeId) || s.profiles[0])
  );
  readonly allergens$: Observable<Allergen[]> = this.activeProfile$.pipe(
    map(p => p.allergens),
    distinctUntilChanged((a, b) => a.map(x => x.name).join('|') === b.map(x => x.name).join('|'))
  );

  constructor(protected localStorage: StorageMap) {
    this.load();
  }

  private load(): void {
    forkJoin({
      profiles: this.localStorage.get<Profile[]>('profiles', profilesSchema),
      activeId: this.localStorage.get('activeProfileId', { type: 'string' }),
      // Allergens saved before profiles existed.
      legacy: this.localStorage.get<Allergen[]>('allergens', allergensSchema),
    }).subscribe({
      next: ({ profiles, activeId, legacy }) => {
        if (profiles?.length) {
          this.state.next({ profiles, activeId: activeId || profiles[0].id });
          return;
        }
        const me: Profile = { id: newId(), name: 'Me', allergens: (legacy || []).map(a => ({ name: a.name })) };
        this.save({ profiles: [me], activeId: me.id });
      },
      error: () => {
        const me: Profile = { id: newId(), name: 'Me', allergens: [] };
        this.state.next({ profiles: [me], activeId: me.id });
      },
    });
  }

  private save(state: ProfileState): void {
    this.state.next(state);
    this.localStorage.set('profiles', state.profiles, profilesSchema).subscribe();
    this.localStorage.set('activeProfileId', state.activeId, { type: 'string' }).subscribe();
  }

  private updateActive(update: (profile: Profile) => Profile): void {
    const state = this.state.value;
    if (!state) {
      return;
    }
    this.save({
      ...state,
      profiles: state.profiles.map(p => (p.id === state.activeId ? update(p) : p)),
    });
  }

  addAllergen(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    this.updateActive(p => p.allergens.some(a => sameName(a.name, trimmed))
      ? p
      : { ...p, allergens: [...p.allergens, { name: trimmed }] });
  }

  removeAllergen(name: string): void {
    this.updateActive(p => ({ ...p, allergens: p.allergens.filter(a => !sameName(a.name, name)) }));
  }

  toggleAllergen(name: string): void {
    const active = this.activeProfile();
    if (active?.allergens.some(a => sameName(a.name, name))) {
      this.removeAllergen(name);
    } else {
      this.addAllergen(name);
    }
  }

  activeProfile(): Profile | undefined {
    const state = this.state.value;
    return state?.profiles.find(p => p.id === state.activeId);
  }

  addProfile(name: string, allergens: Allergen[] = []): Profile {
    const profile: Profile = { id: newId(), name: name.trim() || 'New profile', allergens };
    const state = this.state.value || { profiles: [], activeId: profile.id };
    this.save({ profiles: [...state.profiles, profile], activeId: profile.id });
    return profile;
  }

  renameProfile(id: string, name: string): void {
    const state = this.state.value;
    if (!state || !name.trim()) {
      return;
    }
    this.save({ ...state, profiles: state.profiles.map(p => (p.id === id ? { ...p, name: name.trim() } : p)) });
  }

  deleteProfile(id: string): void {
    const state = this.state.value;
    if (!state || state.profiles.length < 2) {
      return;
    }
    const profiles = state.profiles.filter(p => p.id !== id);
    this.save({ profiles, activeId: state.activeId === id ? profiles[0].id : state.activeId });
  }

  setActiveProfile(id: string): void {
    const state = this.state.value;
    if (state && state.profiles.some(p => p.id === id)) {
      this.save({ ...state, activeId: id });
    }
  }
}
