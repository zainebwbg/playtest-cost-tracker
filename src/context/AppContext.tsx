/**
 * Global app state: loaded once on mount, available everywhere.
 * Handles data fetching, loading/error states, and derived computations.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { fetchAllData } from "../services/airtable";
import type {
  Game,
  ProductGoal,
  PlayerExperienceGoal,
  Study,
  Insight,
  PEGWithCosts,
  GameSummary,
  PhaseCostBreakdown,
  PEGCostBreakdown,
  DevelopmentPhase,
} from "../types";

// ─── Computed Helpers ──────────────────────────────────────────────────────────

export function buildPEGsWithCosts(
  pegs: PlayerExperienceGoal[],
  studies: Study[],
  insights: Insight[] = []
): PEGWithCosts[] {
  // ── Which studies touch each PEG? ────────────────────────────────────────
  const studiesByPEG = new Map<string, Study[]>();
  for (const study of studies) {
    // Use all linked pegIds (not just the first one)
    const linkedIds = study.pegIds.length > 0 ? study.pegIds : (study.pegId ? [study.pegId] : []);
    for (const pid of linkedIds) {
      const arr = studiesByPEG.get(pid) ?? [];
      arr.push(study);
      studiesByPEG.set(pid, arr);
    }
  }

  // ── Actual + Forecasted cost: split each study's costs evenly across linked PEGs ──
  const actualCostByPEG     = new Map<string, number>();
  const forecastedCostByPEG = new Map<string, number>();
  for (const study of studies) {
    const linkedIds = study.pegIds.length > 0 ? study.pegIds : (study.pegId ? [study.pegId] : []);
    if (linkedIds.length === 0) continue;
    const actualShare     = study.actualCost     / linkedIds.length;
    const forecastedShare = study.forecastedCost / linkedIds.length;
    for (const pid of linkedIds) {
      actualCostByPEG.set(pid,     (actualCostByPEG.get(pid)     ?? 0) + actualShare);
      forecastedCostByPEG.set(pid, (forecastedCostByPEG.get(pid) ?? 0) + forecastedShare);
    }
  }

  // ── Insights: index directly by PEG ──────────────────────────────────────
  const insightsByPEG = new Map<string, Insight[]>();
  for (const insight of insights) {
    for (const pid of insight.pegIds) {
      const arr = insightsByPEG.get(pid) ?? [];
      arr.push(insight);
      insightsByPEG.set(pid, arr);
    }
  }

  return pegs.map((peg) => {
    const pegStudies       = studiesByPEG.get(peg.id) ?? [];
    const pegInsights      = insightsByPEG.get(peg.id) ?? [];
    const totalActualCost     = actualCostByPEG.get(peg.id)     ?? 0;
    // Forecasted cost = sum of linked study forecasted costs split evenly across PEGs
    const totalForecastedCost = forecastedCostByPEG.get(peg.id) ?? 0;
    return {
      ...peg,
      studies:  pegStudies,
      insights: pegInsights,
      totalActualCost,
      totalForecastedCost,
      variance: totalForecastedCost - totalActualCost,
      studyCount:   pegStudies.length,
      insightCount: pegInsights.length,
    };
  });
}

export function buildGameSummaries(
  games: Game[],
  productGoals: ProductGoal[],
  pegsWithCosts: PEGWithCosts[]
): GameSummary[] {
  return games.map((game) => {
    const gamePGs = productGoals.filter((pg) => pg.gameId === game.id);
    const gamePEGs = pegsWithCosts.filter((peg) => peg.gameId === game.id);
    const totalForecastedCost = gamePEGs.reduce((s, p) => s + p.totalForecastedCost, 0);
    const totalActualCost = gamePEGs.reduce((s, p) => s + p.totalActualCost, 0);
    const studyCount = gamePEGs.reduce((s, p) => s + p.studyCount, 0);
    const completedPEGs = gamePEGs.filter((p) => p.status === "Complete").length;

    return {
      ...game,
      productGoalCount: gamePGs.length,
      pegCount: gamePEGs.length,
      totalForecastedCost,
      totalActualCost,
      variance: totalForecastedCost - totalActualCost,
      studyCount,
      completedPEGs,
    };
  });
}

/**
 * Groups STUDIES by their "Development Phase" field and sums costs.
 * Optionally filter to one game.
 */
export function buildPhaseCostBreakdown(
  studies: Study[],
  gameId?: string
): PhaseCostBreakdown[] {
  const PHASE_ORDER: DevelopmentPhase[] = [
    "Concept", "Pre Production", "Production", "Alpha", "Beta", "Launch",
  ];

  const filtered = gameId
    ? studies.filter((s) => s.gameId === gameId)
    : studies;

  const byPhase = new Map<string, Study[]>();
  for (const s of filtered) {
    const ph = s.developmentPhase || "Unset";
    if (!byPhase.has(ph)) byPhase.set(ph, []);
    byPhase.get(ph)!.push(s);
  }

  return [...byPhase.entries()]
    .map(([phase, sts]) => ({
      phase,
      actualCost:     sts.reduce((acc, s) => acc + s.actualCost,     0),
      forecastedCost: sts.reduce((acc, s) => acc + s.forecastedCost, 0),
      studyCount:     sts.length,
    }))
    .sort((a, b) => {
      const ia = PHASE_ORDER.indexOf(a.phase as DevelopmentPhase);
      const ib = PHASE_ORDER.indexOf(b.phase as DevelopmentPhase);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
}

/**
 * Builds a cost-per-PX-Goal breakdown for the given PEGs.
 * Costs are already split at build time in buildPEGsWithCosts.
 * Optionally filter to one game.
 */
export function buildPEGCostBreakdown(
  pegsWithCosts: PEGWithCosts[],
  gameId?: string
): PEGCostBreakdown[] {
  const filtered = gameId
    ? pegsWithCosts.filter((p) => p.gameId === gameId)
    : pegsWithCosts;

  return filtered
    .filter((p) => p.totalActualCost > 0 || p.totalForecastedCost > 0)
    .map((p) => ({
      pegId:          p.id,
      pegName:        p.name.length > 22 ? p.name.slice(0, 22) + "…" : p.name,
      gameName:       p.gameName,
      actualCost:     p.totalActualCost,
      forecastedCost: p.totalForecastedCost,
      studyCount:     p.studyCount,
    }))
    .sort((a, b) => b.actualCost - a.actualCost);
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppState {
  games: Game[];
  productGoals: ProductGoal[];
  pegs: PlayerExperienceGoal[];
  studies: Study[];
  insights: Insight[];
  pegsWithCosts: PEGWithCosts[];
  gameSummaries: GameSummary[];
  loading: boolean;
  error: string | null;
  lastRefreshed: Date | null;
  refresh: () => Promise<void>;
  isConfigured: boolean;
}

const AppContext = createContext<AppState | null>(null);

function isAirtableConfigured(): boolean {
  const key = import.meta.env.VITE_AIRTABLE_API_KEY as string;
  const base = import.meta.env.VITE_AIRTABLE_BASE_ID as string;
  return Boolean(key && base && !key.includes("XXXX") && !base.includes("XXXX"));
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [games, setGames] = useState<Game[]>([]);
  const [productGoals, setProductGoals] = useState<ProductGoal[]>([]);
  const [pegs, setPegs] = useState<PlayerExperienceGoal[]>([]);
  const [studies, setStudies] = useState<Study[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const configured = isAirtableConfigured();

  const refresh = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllData();
      setGames(data.games);
      setProductGoals(data.productGoals);
      setPegs(data.pegs);
      setStudies(data.studies);
      setInsights(data.insights);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load data from Airtable."
      );
    } finally {
      setLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const pegsWithCosts = buildPEGsWithCosts(pegs, studies, insights);
  const gameSummaries = buildGameSummaries(games, productGoals, pegsWithCosts);

  return (
    <AppContext.Provider
      value={{
        games,
        productGoals,
        pegs,
        studies,
        insights,
        pegsWithCosts,
        gameSummaries,
        loading,
        error,
        lastRefreshed,
        refresh,
        isConfigured: configured,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
