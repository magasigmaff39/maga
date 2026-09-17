import type { IntendedMajor } from '../../src/types';

export type PortfolioItemType = 'olympiad' | 'competition' | 'project' | 'research' | 'leadership' | 'volunteering' | 'internship' | 'course' | 'publication' | 'sport' | 'art' | 'other';
export type PortfolioLevel = 'school' | 'city' | 'regional' | 'republican' | 'international';
export type PortfolioResult = 'participant' | 'finalist' | 'honorable_mention' | 'bronze' | 'silver' | 'gold' | 'winner' | 'none';
export type PortfolioFieldId = 'tech' | 'engineering' | 'science' | 'medicine' | 'business' | 'law' | 'humanities' | 'creative';
export type PortfolioCriterionId = 'academic' | 'depth' | 'achievements' | 'initiative' | 'impact' | 'evidence' | 'readiness';

export interface FieldRubric {
  id: PortfolioFieldId;
  title: string;
  weights: Record<PortfolioCriterionId, number>;
  signature: string[];
  regional: { usa: string; europe: string; asia: string; kazakhstan: string };
  redFlags: string[];
  benchmarks: { top: string; strong: string; baseline: string };
}

export declare const PORTFOLIO_ITEM_TYPES: { id: PortfolioItemType; label: string; hint: string }[];
export declare const PORTFOLIO_LEVELS: { id: PortfolioLevel; label: string; weight: number }[];
export declare const PORTFOLIO_RESULTS: { id: PortfolioResult; label: string; weight: number }[];
export declare const PORTFOLIO_CRITERIA: { id: PortfolioCriterionId; title: string; description: string; weight: number }[];
export declare const MAJOR_TO_FIELD: Record<IntendedMajor, PortfolioFieldId>;
export declare const FIELD_RUBRICS: Record<PortfolioFieldId, FieldRubric>;
export declare const FIELD_LIST: { id: PortfolioFieldId; title: string }[];
export declare function fieldForMajors(majors?: IntendedMajor[]): PortfolioFieldId;
