// The university knowledge base lives in `shared/data/universities/` so the Express backend and the
// React frontend read exactly the same records. This module only re-exports it with the app's types.
import type { University } from '../types';
import {
  UNIVERSITY_DATABASE as SHARED_DATABASE,
  UNIVERSITY_BY_ID as SHARED_BY_ID,
  UNIVERSITY_COUNTS,
} from '../../shared/data/universities/index.js';

export const UNIVERSITY_DATABASE: University[] = SHARED_DATABASE;
export const UNIVERSITY_BY_ID: Map<string, University> = SHARED_BY_ID;
export { UNIVERSITY_COUNTS };

export function getUniversityById(id: string): University | undefined {
  return UNIVERSITY_BY_ID.get(id);
}
