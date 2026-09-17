import type { DocumentKind, TargetRegion } from '../../src/types/index';

export interface KnowledgeItem {
  id: string;
  title: string;
  desc: string;
}

export interface Inconvenience extends KnowledgeItem {
  regions: TargetRegion[];
  fix: string;
}

export interface DocumentChecklistTemplate {
  kind: DocumentKind;
  title: string;
  description: string;
  required: boolean;
  regions: TargetRegion[];
}

export interface PrepPlanTemplate {
  exam: 'IELTS' | 'SAT' | 'UNT';
  bands: number[];
  weeksPerHalfBand?: number;
  weeksPer100Points?: number;
  weeksPer15Points?: number;
  hoursPerWeek: number;
  milestones: string[];
  resources: { title: string; url: string }[];
}

export interface CalendarEvent {
  date: string;
  label: string;
  region: TargetRegion;
}

export declare const UNIVERSAL_LIKES: KnowledgeItem[];
export declare const UNIVERSAL_DISLIKES: KnowledgeItem[];
export declare const COMMON_INCONVENIENCES: Inconvenience[];
export declare const DOCUMENT_CHECKLIST: DocumentChecklistTemplate[];
export declare const PREP_PLANS: { IELTS: PrepPlanTemplate; SAT: PrepPlanTemplate; UNT: PrepPlanTemplate };
export declare const ADMISSIONS_CALENDAR: CalendarEvent[];
