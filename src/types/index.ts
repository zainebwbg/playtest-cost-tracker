// ─── Domain Enums ─────────────────────────────────────────────────────────────

export type DevelopmentPhase =
  | "Concept"
  | "Pre Production"
  | "Production"
  | "Alpha"
  | "Beta"
  | "Launch";

export type GoalStatus =
  | "Not Started"
  | "Planning"
  | "In Progress"
  | "Measuring"
  | "Complete";

export type StudyType =
  | "Playtest"
  | "Survey"
  | "Interview"
  | "Diary Study"
  | "Analytics Review"
  | "Heuristic Evaluation";

export type StudyStatus = "Planned" | "In Progress" | "Complete" | "Cancelled";

export type GameStatus = "Active" | "On Hold" | "Shipped" | "Cancelled";

export type Priority = "High" | "Medium" | "Low";

// ─── Airtable Raw Records ──────────────────────────────────────────────────────

/** Raw record shape returned by the Airtable REST API. */
export interface AirtableRecord<T = Record<string, unknown>> {
  id: string;
  createdTime: string;
  fields: T;
}

export interface AirtableListResponse<T> {
  records: AirtableRecord<T>[];
  offset?: string;
}

// ─── Airtable Field Shapes ─────────────────────────────────────────────────────
// These mirror the exact field names in your Airtable base.

export interface GameFields {
  Name: string;
  Description?: string;
  Status: GameStatus;
  "Current Phase": DevelopmentPhase;
  Studio?: string;
  "Target Launch Date"?: string;
}

export interface ProductGoalFields {
  Name: string;
  Description?: string;
  Game: string[]; // linked record IDs
  Priority: Priority;
}

export interface PlayerExperienceGoalFields {
  Name: string;
  Description?: string;
  "Product Goal": string[]; // linked record IDs
  "Development Phase": DevelopmentPhase;
  Status: GoalStatus;
  "Forecasted Cost": number;
  Notes?: string;
}

export interface StudyFields {
  Name: string;
  "Player Experience Goal": string[]; // linked record IDs (can be many)
  "Development Phase"?: DevelopmentPhase;
  Type: StudyType;
  Status: StudyStatus;
  Date?: string;
  "Actual Cost": number;
  "Forecasted Cost": number;
  Insights?: string;
  Participants?: number;
}

// ─── Normalized App Models ─────────────────────────────────────────────────────
// Flat, resolved versions of Airtable records for use in UI components.

export interface Game {
  id: string;
  name: string;
  description: string;
  status: GameStatus;
  currentPhase: DevelopmentPhase;
  studio: string;
  targetLaunchDate: string | null;
}

export interface ProductGoal {
  id: string;
  name: string;
  description: string;
  gameId: string;
  gameName: string;
  priority: Priority;
}

export interface PlayerExperienceGoal {
  id: string;
  name: string;
  description: string;
  productGoalId: string;
  productGoalName: string;
  gameId: string;
  gameName: string;
  developmentPhase: DevelopmentPhase;
  status: GoalStatus;
  forecastedCost: number;
  notes: string;
}

export interface Study {
  id: string;
  name: string;
  /** All linked PX Goal IDs (cost split evenly across them). */
  pegIds: string[];
  pegNames: string[];
  /** First pegId — kept for backward compatibility. */
  pegId: string;
  pegName: string;
  gameId: string;
  gameName: string;
  /** Phase this study was conducted in — the basis for "Cost by Phase" chart. */
  developmentPhase: DevelopmentPhase | null;
  type: StudyType;
  status: StudyStatus;
  date: string | null;
  actualCost: number;
  forecastedCost: number;
  insights: string;
  participants: number;
}

// ─── Derived / Computed Types ──────────────────────────────────────────────────

export interface PEGWithCosts extends PlayerExperienceGoal {
  studies: Study[];
  insights: Insight[];
  totalActualCost: number;
  totalForecastedCost: number;
  variance: number; // forecastedCost - totalActualCost (positive = under budget)
  studyCount: number;
  insightCount: number;
}

export interface GameSummary extends Game {
  productGoalCount: number;
  pegCount: number;
  totalForecastedCost: number;
  totalActualCost: number;
  variance: number;
  studyCount: number;
  completedPEGs: number;
}

/** Cost rolled up by the Development Phase recorded on each Study. */
export interface PhaseCostBreakdown {
  phase: string; // DevelopmentPhase or "Unset"
  actualCost: number;
  forecastedCost: number;
  studyCount: number;
}

/** Cost allocated to a single PX Goal (split evenly across all PEGs on each study). */
export interface PEGCostBreakdown {
  pegId: string;
  pegName: string;
  gameName: string;
  actualCost: number;
  forecastedCost: number;
  studyCount: number;
}

// ─── Insight ───────────────────────────────────────────────────────────────────

export type InsightStatus =
  | "Positive"
  | "Mixed"
  | "Needs Attention"
  | "Analysis in Progress";

export interface InsightFields {
  "Insight Title": string;
  Insight: string;
  "Insight Status"?: InsightStatus;
  Study?: string[];                    // linked record IDs (Studies)
  "Player Experience Goal"?: string[]; // linked record IDs (PEGs)
}

export interface Insight {
  id: string;
  title: string;
  insight: string;
  status: InsightStatus | null;
  /** IDs of linked Studies records */
  studyIds: string[];
  studyNames: string[];
  /** ISO date string from the primary linked study (used for ordering) */
  studyDate: string | null;
  /** IDs of linked Player Experience Goals records */
  pegIds: string[];
  pegNames: string[];
  gameNames: string[];
}

// ─── Filter / UI State ─────────────────────────────────────────────────────────

export interface GoalFilters {
  gameId: string | null;
  phase: DevelopmentPhase | null;
  status: GoalStatus | null;
  costMode: "actual" | "forecasted" | "both";
}
