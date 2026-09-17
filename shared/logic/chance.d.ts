import type { ApplicantProfile, University, ChanceEstimate, ChanceFactor, FitTier, PrepPlan } from '../../src/types/index';

export declare function normalizeGpa(gpa: number, scale: '4.0' | '5.0'): number;
export declare function parseAcceptanceRate(rate: string | undefined): number;
export declare function estimateChance(
  profile: ApplicantProfile,
  uni: University,
  overrides?: { ielts?: number; sat?: number; unt?: number },
): { probability: number; tier: FitTier; factors: ChanceFactor[] };
export declare function estimateWithProjections(profile: ApplicantProfile, uni: University): ChanceEstimate;
export declare function buildPrepPlan(exam: 'IELTS' | 'SAT' | 'UNT', current: number, target: number): PrepPlan;
export declare function estimateForAll(profile: ApplicantProfile, universities: University[]): ChanceEstimate[];
