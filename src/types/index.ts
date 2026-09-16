export type EducationGrade = 'grade_9' | 'grade_10' | 'grade_11' | 'college' | 'gap_year';

export type IntendedMajor = 
  | 'cs_ai' 
  | 'software_eng' 
  | 'data_science' 
  | 'robotics' 
  | 'business_finance' 
  | 'economics' 
  | 'medicine_bio' 
  | 'international_law' 
  | 'media_design';

export type TargetRegion = 'kazakhstan' | 'europe' | 'asia' | 'usa_canada';

export type BudgetTier = 'grant_only' | 'up_to_5k' | 'up_to_15k' | 'above_25k';

export type AdvisorTone = 'supportive' | 'strategic' | 'academic';

export interface ApplicantProfile {
  name: string;
  grade: EducationGrade;
  age: number;
  schoolType: 'nis' | 'bil' | 'rfms' | 'gymnasium' | 'standard' | 'international';
  gpa: number; // Scale 1.0 - 4.0 or 2.0 - 5.0
  gpaScale: '4.0' | '5.0';
  profileSubjects: string[];
  
  // Standardized tests
  hasIelts: boolean;
  ieltsScore?: number;
  hasSat: boolean;
  satScore?: number;
  hasUnt: boolean;
  untScore?: number;
  
  // Extracurriculars & awards
  olympiadLevel: 'none' | 'school' | 'city' | 'republican' | 'international';
  olympiadDetails?: string;
  leadershipActivities: string[];
  extracurriculars: string[];
  targetUniversityIds: string[];
  
  // Goals & Constraints
  targetMajors: IntendedMajor[];
  targetRegions: TargetRegion[];
  budgetTier: BudgetTier;
  targetYear: '2026' | '2027';
  advisorTone: AdvisorTone;
}

export interface ReadinessScore {
  overall: number; // 0 - 100
  academic: number;
  language: number;
  portfolio: number;
  financialFeasibility: number;
}

export interface DiagnosticResult {
  readiness: ReadinessScore;
  strengths: { title: string; desc: string; icon: string }[];
  bottlenecks: { title: string; desc: string; severity: 'high' | 'medium' | 'info'; action: string }[];
  strategicAdvice: string;
  recommendedCategoryFocus: string;
}

export type FitTier = 'Dream' | 'Target' | 'Safety';

export interface University {
  id: string;
  name: string;
  nativeName: string;
  shortName: string;
  city: string;
  country: string;
  flag: string;
  region: TargetRegion;
  worldRank?: string;
  nationalRank?: string;
  description: string;
  logo: string;
  coverImage: string;
  
  // Programs
  flagshipPrograms: string[];
  supportedMajors: IntendedMajor[];
  
  // Financials
  tuitionUSDPerYear: number;
  livingCostUSDPerYear: number;
  hasFullGrantOrScholarship: boolean;
  scholarshipName: string;
  scholarshipDescription: string;
  financialAidType: 'state_grant' | 'merit' | 'need_blind' | 'need_based' | 'bilateral';
  
  // Criteria & Admissions
  minGpa: number;
  minIelts: number;
  minSat?: number;
  minUnt?: number;
  acceptanceRate: string;
  admissionRequirements: string[];
  
  // Deadlines
  earlyDeadline?: string;
  regularDeadline: string;
  officialPortalUrl: string;
  
  // Matching specifics
  fitTier: FitTier;
  matchScore: number; // 0 - 100
  whyItFits: string;
  advantages: string[];
  cautions: string[];
  isDemoVerified: boolean;
}

export interface RoadmapSubtask {
  id: string;
  title: string;
  isCompleted: boolean;
  deadline?: string;
}

export interface RoadmapStep {
  id: string;
  title: string;
  category: 'exams' | 'documents' | 'essay' | 'deadlines' | 'extracurricular';
  timeFrame: 'immediate' | '1-2_months' | '3-6_months' | 'final';
  targetDate: string;
  description: string;
  isKeyMilestone: boolean;
  subtasks: RoadmapSubtask[];
  actionLink?: string;
  guidanceTip: string;
  templateAvailable?: boolean;
}

export interface PresetPersona {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  profile: ApplicantProfile;
}
