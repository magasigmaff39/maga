import type { IntendedMajor } from '../../src/types';

export type OlympiadCategory = 'olympiad' | 'science_project' | 'hackathon' | 'robotics' | 'essay' | 'debate' | 'business' | 'program' | 'university';
export type OlympiadLevel = 'school' | 'city' | 'regional' | 'republican' | 'international';
export type OlympiadRegion = 'kazakhstan' | 'cis' | 'international' | 'online';

export interface Olympiad {
  id: string;
  name: string;
  shortName: string;
  nameEn: string;
  category: OlympiadCategory;
  subjects: string[];
  majors: IntendedMajor[];
  organizer: string;
  level: OlympiadLevel;
  region: OlympiadRegion;
  grades: number[];
  eligibility: string;
  timeline: { registration: string; stages: string; finals: string };
  monthsActive: number[];
  format: 'individual' | 'team' | 'project';
  online: boolean;
  cost: string;
  languages: string[];
  benefits: string[];
  recognition: { kazakhstan: number; usa: number; europe: number; asia: number };
  difficulty: number;
  officialUrl: string;
  description: string;
  tips: string;
  pathwayTo?: string[];
}

export declare const OLYMPIAD_SUBJECTS: { id: string; label: string }[];
export declare const OLYMPIAD_CATEGORIES: Record<OlympiadCategory, string>;
export declare const OLYMPIAD_DATABASE: Olympiad[];
export declare const OLYMPIAD_BY_ID: Map<string, Olympiad>;
export declare const OLYMPIAD_COUNTS: { total: number; kazakhstan: number; international: number };
