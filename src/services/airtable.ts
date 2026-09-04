/**
 * Airtable REST API service.
 *
 * All calls use the Airtable v0 REST API with a Personal Access Token.
 * Configure credentials in your .env file (see .env.example).
 *
 * Linked record IDs in Airtable are resolved client-side by fetching all
 * related tables upfront and joining in memory — simple and works within
 * the 100-record default page size for most studios' datasets.
 * For very large datasets (> 1000 records) pagination is handled automatically.
 */

import type {
  Game,
  GameFields,
  ProductGoal,
  ProductGoalFields,
  PlayerExperienceGoal,
  PlayerExperienceGoalFields,
  Study,
  StudyFields,
  Insight,
  InsightFields,
  AirtableRecord,
  AirtableListResponse,
} from "../types";

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID as string;
const API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY as string;

const TABLE_GAMES = (import.meta.env.VITE_TABLE_GAMES as string) || "Games";
const TABLE_PRODUCT_GOALS =
  (import.meta.env.VITE_TABLE_PRODUCT_GOALS as string) || "Product Goals";
const TABLE_PEGS =
  (import.meta.env.VITE_TABLE_PLAYER_EXPERIENCE_GOALS as string) ||
  "Player Experience Goals";
const TABLE_STUDIES   = (import.meta.env.VITE_TABLE_STUDIES   as string) || "Studies";
const TABLE_INSIGHTS  = (import.meta.env.VITE_TABLE_INSIGHTS  as string) || "Insights";

const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}`;

const headers = () => ({
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
});

// ─── Low-level Fetch ──────────────────────────────────────────────────────────

/** Fetch all records from a table, handling Airtable's pagination offset. */
async function fetchAllRecords<T>(
  tableName: string,
  params: Record<string, string> = {}
): Promise<AirtableRecord<T>[]> {
  const records: AirtableRecord<T>[] = [];
  let offset: string | undefined;

  do {
    const query = new URLSearchParams({
      ...params,
      ...(offset ? { offset } : {}),
    });
    const url = `${BASE_URL}/${encodeURIComponent(tableName)}?${query}`;
    const res = await fetch(url, { headers: headers() });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        `Airtable error ${res.status}: ${(err as { error?: { message?: string } }).error?.message ?? res.statusText}`
      );
    }

    const data: AirtableListResponse<T> = await res.json();
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

// ─── Normalizers ──────────────────────────────────────────────────────────────

function normalizeGame(record: AirtableRecord<GameFields>): Game {
  const f = record.fields;
  return {
    id: record.id,
    name: f.Name ?? "",
    description: f.Description ?? "",
    status: f.Status ?? "Active",
    currentPhase: f["Current Phase"] ?? "Concept",
    studio: f.Studio ?? "",
    targetLaunchDate: f["Target Launch Date"] ?? null,
  };
}

function normalizeProductGoal(
  record: AirtableRecord<ProductGoalFields>,
  gamesById: Map<string, Game>
): ProductGoal {
  const f = record.fields;
  const gameId = f.Game?.[0] ?? "";
  const game = gamesById.get(gameId);
  return {
    id: record.id,
    name: f.Name ?? "",
    description: f.Description ?? "",
    gameId,
    gameName: game?.name ?? "",
    priority: f.Priority ?? "Medium",
  };
}

function normalizePEG(
  record: AirtableRecord<PlayerExperienceGoalFields>,
  productGoalsById: Map<string, ProductGoal>,
  gamesById: Map<string, Game>
): PlayerExperienceGoal {
  const f = record.fields;
  const productGoalId = f["Product Goal"]?.[0] ?? "";
  const productGoal = productGoalsById.get(productGoalId);
  const game = productGoal ? gamesById.get(productGoal.gameId) : undefined;
  return {
    id: record.id,
    name: f.Name ?? "",
    description: f.Description ?? "",
    productGoalId,
    productGoalName: productGoal?.name ?? "",
    gameId: productGoal?.gameId ?? "",
    gameName: game?.name ?? "",
    developmentPhase: f["Development Phase"] ?? "Concept",
    status: f.Status ?? "Not Started",
    forecastedCost: f["Forecasted Cost"] ?? 0,
    notes: f.Notes ?? "",
  };
}

function normalizeStudy(
  record: AirtableRecord<StudyFields>,
  pegsById: Map<string, PlayerExperienceGoal>
): Study {
  const f = record.fields;
  const pegId = f["Player Experience Goal"]?.[0] ?? "";
  const peg = pegsById.get(pegId);
  return {
    id: record.id,
    name: f.Name ?? "",
    pegId,
    pegName: peg?.name ?? "",
    gameId: peg?.gameId ?? "",
    gameName: peg?.gameName ?? "",
    type: f.Type ?? "Playtest",
    status: f.Status ?? "Planned",
    date: f.Date ?? null,
    actualCost: f["Actual Cost"] ?? 0,
    forecastedCost: f["Forecasted Cost"] ?? 0,
    insights: f.Insights ?? "",
    participants: f.Participants ?? 0,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchGames(): Promise<Game[]> {
  const records = await fetchAllRecords<GameFields>(TABLE_GAMES);
  return records.map(normalizeGame).sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchProductGoals(
  gamesById: Map<string, Game>
): Promise<ProductGoal[]> {
  const records = await fetchAllRecords<ProductGoalFields>(TABLE_PRODUCT_GOALS);
  return records.map((r) => normalizeProductGoal(r, gamesById));
}

export async function fetchPlayerExperienceGoals(
  productGoalsById: Map<string, ProductGoal>,
  gamesById: Map<string, Game>
): Promise<PlayerExperienceGoal[]> {
  const records = await fetchAllRecords<PlayerExperienceGoalFields>(TABLE_PEGS);
  return records.map((r) => normalizePEG(r, productGoalsById, gamesById));
}

export async function fetchStudies(
  pegsById: Map<string, PlayerExperienceGoal>
): Promise<Study[]> {
  const records = await fetchAllRecords<StudyFields>(TABLE_STUDIES);
  return records
    .map((r) => normalizeStudy(r, pegsById))
    .sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date); // newest first
    });
}

/**
 * Fetch all data in one coordinated call.
 * Returns normalized arrays ready for the app's context.
 */
export async function fetchAllData() {
  const gameRecords = await fetchAllRecords<GameFields>(TABLE_GAMES);
  const games = gameRecords.map(normalizeGame);
  const gamesById = new Map(games.map((g) => [g.id, g]));

  const pgRecords = await fetchAllRecords<ProductGoalFields>(TABLE_PRODUCT_GOALS);
  const productGoals = pgRecords.map((r) => normalizeProductGoal(r, gamesById));
  const productGoalsById = new Map(productGoals.map((pg) => [pg.id, pg]));

  const pegRecords = await fetchAllRecords<PlayerExperienceGoalFields>(TABLE_PEGS);
  const pegs = pegRecords.map((r) => normalizePEG(r, productGoalsById, gamesById));
  const pegsById = new Map(pegs.map((p) => [p.id, p]));

  const studyRecords = await fetchAllRecords<StudyFields>(TABLE_STUDIES);
  const studies = studyRecords
    .map((r) => normalizeStudy(r, pegsById))
    .sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
    });

  const studiesById = new Map(studies.map((s) => [s.id, s]));
  const pegsById2   = new Map(pegs.map((p) => [p.id, p]));
  const insightRecords = await fetchAllRecords<InsightFields>(TABLE_INSIGHTS);
  const insights = insightRecords.map((r) => normalizeInsight(r, studiesById, pegsById2));

  return { games, productGoals, pegs, studies, insights };
}

// ─── Insights ─────────────────────────────────────────────────────────────────

function normalizeInsight(
  record: AirtableRecord<InsightFields>,
  studiesById: Map<string, Study>,
  pegsById: Map<string, PlayerExperienceGoal>
): Insight {
  const f = record.fields;
  const studyIds = f.Study ?? [];
  const pegIds   = f["Player Experience Goal"] ?? [];
  // Use the most-recent study date from all linked studies (or null).
  const linkedStudyDates = studyIds
    .map((sid) => studiesById.get(sid)?.date ?? null)
    .filter((d): d is string => d !== null)
    .sort((a, b) => b.localeCompare(a)); // descending → [0] is latest

  return {
    id:         record.id,
    title:      f["Insight Title"] ?? "",
    insight:    f.Insight ?? "",
    status:     f["Insight Status"] ?? null,
    studyIds,
    studyNames: studyIds.map((sid) => studiesById.get(sid)?.name ?? sid),
    studyDate:  linkedStudyDates[0] ?? null,
    pegIds,
    pegNames:   pegIds.map((pid) => pegsById.get(pid)?.name ?? pid),
    gameNames:  [...new Set(pegIds.map((pid) => pegsById.get(pid)?.gameName ?? ""))],
  };
}

export async function fetchInsights(
  studiesById: Map<string, Study>,
  pegsById: Map<string, PlayerExperienceGoal>
): Promise<Insight[]> {
  const records = await fetchAllRecords<InsightFields>(TABLE_INSIGHTS);
  return records.map((r) => normalizeInsight(r, studiesById, pegsById));
}

// ─── Mutation ─────────────────────────────────────────────────────────────────

/** Update fields on any record. Pass only the fields you want to change. */
export async function patchRecord(
  tableName: string,
  recordId: string,
  fields: Record<string, unknown>
): Promise<void> {
  const url = `${BASE_URL}/${encodeURIComponent(tableName)}/${recordId}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Airtable PATCH error ${res.status}: ${(err as { error?: { message?: string } }).error?.message ?? res.statusText}`
    );
  }
}

/** Create a new record in any table. */
export async function createRecord(
  tableName: string,
  fields: Record<string, unknown>
): Promise<string> {
  const url = `${BASE_URL}/${encodeURIComponent(tableName)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Airtable POST error ${res.status}: ${(err as { error?: { message?: string } }).error?.message ?? res.statusText}`
    );
  }
  const data = await res.json();
  return (data as AirtableRecord<unknown>).id;
}
