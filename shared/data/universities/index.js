// Single entry point for the university knowledge base.
// Imported by the frontend (Vite) as `shared/data/universities/index.js` and by the backend (Node ESM).

import { KAZAKHSTAN_UNIVERSITIES } from './kazakhstan.js';
import { USA_UNIVERSITIES } from './usa.js';
import { EUROPE_UNIVERSITIES } from './europe.js';
import { ASIA_UNIVERSITIES } from './asia.js';

/** @type {import('./schema').University[]} */
export const UNIVERSITY_DATABASE = [
  ...KAZAKHSTAN_UNIVERSITIES,
  ...USA_UNIVERSITIES,
  ...EUROPE_UNIVERSITIES,
  ...ASIA_UNIVERSITIES,
];

/** @type {Map<string, import('./schema').University>} */
export const UNIVERSITY_BY_ID = new Map(UNIVERSITY_DATABASE.map((u) => [u.id, u]));

export const UNIVERSITY_COUNTS = {
  total: UNIVERSITY_DATABASE.length,
  kazakhstan: KAZAKHSTAN_UNIVERSITIES.length,
  usa_canada: USA_UNIVERSITIES.length,
  europe: EUROPE_UNIVERSITIES.length,
  asia: ASIA_UNIVERSITIES.length,
};

/** Validates that every record has the fields the matching engine depends on. Throws on the first problem. */
export function validateUniversityDatabase() {
  const seen = new Set();
  for (const u of UNIVERSITY_DATABASE) {
    if (seen.has(u.id)) throw new Error(`Duplicate university id: ${u.id}`);
    seen.add(u.id);
    for (const key of ['name', 'city', 'country', 'region', 'minGpa', 'minIelts', 'acceptanceRate', 'regularDeadline', 'officialPortalUrl']) {
      if (u[key] === undefined || u[key] === null || u[key] === '') {
        throw new Error(`University ${u.id} is missing required field "${key}"`);
      }
    }
    if (!Array.isArray(u.supportedMajors) || u.supportedMajors.length === 0) {
      throw new Error(`University ${u.id} has no supportedMajors`);
    }
  }
  return true;
}

export { KAZAKHSTAN_UNIVERSITIES, USA_UNIVERSITIES, EUROPE_UNIVERSITIES, ASIA_UNIVERSITIES };
