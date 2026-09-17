// Type surface of the shared university knowledge base.
// The frontend re-exports the canonical `University` interface from `src/types`; the backend uses JSDoc.

export type {
  University,
  UniversityLinks,
  CampusInfo,
  AdmissionsInsight,
  UniversityStats,
  UniversityEnvironment,
} from '../../../src/types/index';
