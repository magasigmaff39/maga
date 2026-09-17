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
  | 'media_design'
  | 'engineering'
  | 'natural_sciences'
  | 'humanities'
  | 'education'
  | 'linguistics';

export type TargetRegion = 'kazakhstan' | 'europe' | 'asia' | 'usa_canada';

export type BudgetTier = 'grant_only' | 'up_to_5k' | 'up_to_15k' | 'above_25k';

export type AdvisorTone = 'supportive' | 'strategic' | 'academic';

export type AppLanguage = 'kk' | 'en' | 'ru';

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

  // Personal context for the AI advisor (all optional — filled in the AI panel)
  careerGoal?: string;          // desired profession / long-term goal
  allergies?: string;           // pollen, food, dust, medications
  healthNotes?: string;         // chronic conditions, mobility, mental health support needs
  dietaryNeeds?: string;        // halal, vegetarian, etc.
  climatePreference?: 'any' | 'warm' | 'cold' | 'mild';
  cityPreference?: 'any' | 'megacity' | 'mid_city' | 'campus_town';
  personalNotes?: string;       // free text the applicant wants the AI to consider
  languagesSpoken?: string[];
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

/** Official and social links of a university. Only verified public handles are stored. */
export interface UniversityLinks {
  website: string;
  admissions: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  telegram?: string;
  linkedin?: string;
  facebook?: string;
  x?: string;
}

/** Campus, neighbourhood and infrastructure facts. */
export interface CampusInfo {
  neighborhoodSafety: number;      // 1 (dangerous) – 10 (very safe); estimate based on public crime indices
  neighborhoodNotes: string;       // where the campus is, how the district feels, transport
  equipment: string[];             // labs, makerspaces, supercomputers, studios
  dormitories: string;             // availability, price, guarantee for freshmen
  internalProjects: string[];      // research centres, incubators, flagship student projects
  studentClubs: string[];
}

/** What the admissions office rewards and what it penalises. */
export interface AdmissionsInsight {
  testPolicy: 'required' | 'optional' | 'blind' | 'unt' | 'internal_exam' | 'mixed';
  interview: boolean;
  likes: string[];
  dislikes: string[];
  commonPitfalls: string[];        // typical inconveniences / mistakes for applicants
  essayPrompts?: string[];
}

export interface UniversityStats {
  totalStudents?: number;
  internationalShare?: string;
  avgSat?: string;                 // e.g. '1500–1570'
  avgIelts?: number;
  studentFacultyRatio?: string;
  graduateEmployment?: string;
  medianStartingSalaryUSD?: number;
}

/** Environment facts relevant for allergies, diet and comfort. */
export interface UniversityEnvironment {
  climate: string;
  allergyNotes: string;            // pollen season, dust, humidity
  airQuality: string;
  foodOptions: string[];           // halal, vegetarian, kosher, gluten-free
  languagesOfInstruction: string[];
  cityPopulation?: string;
}

export interface University {
  id: string;
  name: string;
  nativeName: string;
  shortName: string;
  city: string;
  country: string;
  flag: string;
  region: TargetRegion;
  type?: 'public' | 'private' | 'autonomous' | 'national';
  founded?: number;
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
  requiredDocuments?: string[];

  // Deadlines
  earlyDeadline?: string;
  regularDeadline: string;
  officialPortalUrl: string;

  // Extended knowledge base (optional so legacy entries keep compiling)
  links?: UniversityLinks;
  campus?: CampusInfo;
  admissions?: AdmissionsInsight;
  stats?: UniversityStats;
  environment?: UniversityEnvironment;

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

// ---------------------------------------------------------------------------
// Backend-driven entities (tasks, documents, AI, chance estimation)
// ---------------------------------------------------------------------------

export type TaskCategory = 'sat' | 'ielts' | 'unt' | 'documents' | 'essay' | 'application' | 'olympiad' | 'portfolio' | 'other';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface UserTask {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: TaskCategory;
  status: TaskStatus;
  dueDate: string | null;        // ISO date (YYYY-MM-DD)
  completedAt: string | null;    // ISO datetime
  createdAt: string;
  updatedAt?: string;
  source?: string;
  /** Derived on the server: done_on_time | done_late | overdue | upcoming | no_deadline */
  timeliness: 'done_on_time' | 'done_late' | 'overdue' | 'upcoming' | 'no_deadline';
}

export type DocumentKind =
  | 'passport'
  | 'transcript'
  | 'diploma'
  | 'ielts'
  | 'sat'
  | 'unt'
  | 'recommendation'
  | 'essay'
  | 'cv'
  | 'portfolio'
  | 'financial'
  | 'medical'
  | 'photo'
  | 'portfolio_proof'
  | 'other';

export interface UploadedDocument {
  id: string;
  userId: string;
  kind: DocumentKind;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  note?: string;
  /** Short factual summary produced by the AI when it read the scan */
  aiSummary?: string;
  downloadUrl: string;
}

export interface DocumentChecklistItem {
  kind: DocumentKind;
  title: string;
  description: string;
  required: boolean;
  uploaded: UploadedDocument | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
  sources?: string[];
}

export interface ChanceFactor {
  label: string;
  impact: number;        // -30 … +30 percentage points
  note: string;
}

export interface ChanceEstimate {
  universityId: string;
  universityName: string;
  probability: number;    // 0 – 100
  tier: FitTier;
  factors: ChanceFactor[];
  /** Present when tests are missing: what score would move the applicant to each tier */
  projections?: {
    ifIelts?: { score: number; probability: number }[];
    ifSat?: { score: number; probability: number }[];
    ifUnt?: { score: number; probability: number }[];
  };
  prepPlan?: PrepPlan[];
}

export interface PrepPlan {
  exam: 'IELTS' | 'SAT' | 'UNT';
  targetScore: string;
  weeks: number;
  hoursPerWeek: number;
  milestones: string[];
  resources: { title: string; url: string }[];
}


// ---------------------------------------------------------------------------
// Portfolio
// ---------------------------------------------------------------------------

export type PortfolioItemType = 'olympiad' | 'competition' | 'project' | 'research' | 'leadership' | 'volunteering' | 'internship' | 'course' | 'publication' | 'sport' | 'art' | 'other';
export type PortfolioLevel = 'school' | 'city' | 'regional' | 'republican' | 'international';
export type PortfolioResult = 'participant' | 'finalist' | 'honorable_mention' | 'bronze' | 'silver' | 'gold' | 'winner' | 'none';
export type PortfolioFieldId = 'tech' | 'engineering' | 'science' | 'medicine' | 'business' | 'law' | 'humanities' | 'creative';
export type PortfolioCriterionId = 'academic' | 'depth' | 'achievements' | 'initiative' | 'impact' | 'evidence' | 'readiness';
/** highlight = 9–10, build the essay around it; keep = leave in; drop = may be excluded from the application */
export type PortfolioRecommendation = 'highlight' | 'keep' | 'drop';

/** Significance of one entry on the 1–10 scale, written by the AI evaluator (or the offline rules). */
export interface PortfolioItemRating {
  score: number;
  verdict: string;
  recommendation: PortfolioRecommendation;
  useInEssay: boolean;
  field: PortfolioFieldId;
  evaluatedAt: string;
}

export interface PortfolioItem {
  id: string;
  userId: string;
  type: PortfolioItemType;
  title: string;
  organization: string;
  level: PortfolioLevel | null;
  result: PortfolioResult | null;
  role: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  hoursPerWeek: number | null;
  links: string[];
  documentId: string | null;
  subjects: string[];
  olympiadId: string | null;
  /** Left out of the final application by the applicant (does not count towards the score). */
  excluded: boolean;
  ai: PortfolioItemRating | null;
  /** Deterministic 1–10 estimate (list endpoint only) */
  preScore?: number;
  createdAt: string;
  updatedAt: string;
}

export type PortfolioItemInput = Partial<Omit<PortfolioItem, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'ai'>> & { title: string };

export interface PortfolioScore {
  field: PortfolioFieldId;
  fieldTitle: string;
  total: number;
  tier?: 'exceptional' | 'strong' | 'developing' | 'early';
  criteria: { id: PortfolioCriterionId; title: string; score: number; weight: number; evidence: string[] }[];
  spike: string[];
  gaps: string[];
  itemCount: number;
  excludedCount?: number;
}

export interface PortfolioEvaluation {
  field: PortfolioFieldId;
  fieldTitle: string;
  computed: PortfolioScore;
  /** true when the engine picked the universities from the applicant's preferences (no manual list) */
  targetsAuto?: boolean;
  targets: { id: string; name: string; shortName?: string; fit?: number; probability?: number; tier?: FitTier; reasons?: string[] }[];
  overallScore: number;
  tier: 'exceptional' | 'strong' | 'developing' | 'early';
  headline: string;
  summary: string;
  criteria: { id: PortfolioCriterionId; title: string; score: number; computed: number; weight: number; comment: string; evidence: string[] }[];
  perUniversity: { id: string; name: string; fit: number; verdict: string; whatTheyValue: string; gaps: string[]; chance: number | null; links?: University['links'] }[];
  strengths: string[];
  gaps: string[];
  fieldAdvice: string;
  actionPlan: { title: string; why: string; deadline: string; category: TaskCategory; priority: 'high' | 'medium' | 'low' }[];
  suggestedCompetitions: { id: string; name: string; url: string; why: string }[];
  essayAngles: string[];
  redFlags: string[];
  /** One verdict per portfolio entry (1–10) */
  items: (PortfolioItemRating & { id: string; title: string })[];
  model: string;
  evaluatedAt?: string;
}

// ---------------------------------------------------------------------------
// Olympiads
// ---------------------------------------------------------------------------

export type OlympiadCategory = 'olympiad' | 'science_project' | 'hackathon' | 'robotics' | 'essay' | 'debate' | 'business' | 'program' | 'university';

export interface Olympiad {
  id: string;
  name: string;
  shortName: string;
  nameEn: string;
  category: OlympiadCategory;
  subjects: string[];
  majors: IntendedMajor[];
  organizer: string;
  level: 'school' | 'city' | 'regional' | 'republican' | 'international';
  region: 'kazakhstan' | 'cis' | 'international' | 'online';
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
  /** Present in recommendation responses */
  fit?: number;
  reasons?: string[];
  nextActiveInMonths?: number;
}

export interface OlympiadAdvice {
  recommendations: { id: string; fit: number; reasons: string[]; nextActiveInMonths: number }[];
  summary: string;
  picks: { id: string; name: string; url: string; why: string; whenToRegister: string; prepPlan: string; targetResult: string }[];
  yearPlan: string;
  warnings: string[];
  model: string;
}

// ---------------------------------------------------------------------------
// AI comparison
// ---------------------------------------------------------------------------

export interface UniversityComparison {
  universities: { id: string; name: string; chance: number | null; tier: FitTier | null; tuition: number; living: number; estimatedNetCost: number; safety: number | null; deadline: string; testPolicy: string | null; internationalShare: number | string | null; employment: number | string | null; links?: University['links'] }[];
  verdict: string;
  ranking: { id: string; name: string; rank: number; score: number; summary: string; pros: string[]; cons: string[]; bestFor: string; chance: number | null }[];
  matrixHighlights: { criterion: string; winnerId: string; note: string }[];
  strategy: string;
  risks: string[];
  nextSteps: { title: string; deadline: string; category: TaskCategory }[];
  model: string;
}

/** What the user currently sees — sent along with AI requests so the advisor has full context. */
export interface UiState {
  step?: number;
  selectedForCompare?: string[];
  viewingUniversityId?: string;
  roadmapDone?: string;
  essayDraft?: string;
  language?: AppLanguage;
}
