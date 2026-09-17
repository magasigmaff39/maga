import type { ApplicantProfile, University, FitTier } from '../../src/types/index';

export interface PickedUniversity {
  id: string;
  name: string;
  shortName: string;
  fit: number;
  probability: number;
  tier: FitTier;
  reasons: string[];
}

export declare function scoreUniversityFit(profile: ApplicantProfile, uni: University): number;
export declare function fitReasons(profile: ApplicantProfile, uni: University): string[];
export declare function pickTargetUniversities(profile: ApplicantProfile | null, universities: University[], opts?: { limit?: number }): PickedUniversity[];
