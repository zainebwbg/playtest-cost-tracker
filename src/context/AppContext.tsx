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
  DevelopmentPhase,
} from "../types";

// ─── Computed Helpers ──────────────────────────────────────────────────────────

export function buildPEGsWithCosts(
  pegs: PlayerExperienceGoal[],
  studies: Study[],
  insights: Insight[] = []
): PEGWithCosts[] {
  const studiesByPEG = new Map<string, Study[]>();
  for (const study of studies) {
    const arr = studiesByPEG.get(study.pegId) ?? [];
    arr.push(study);
    studiesByPEG.set(study.pegId, arr);
  }

  // Build a map: pegId -> insights that reference this PEG directly
  const insightsByPEG = new Map<string, Insight[]>();
  for (const insight of insights) {
    for (const pid of insight.pegIds) {
      const arr = insightsByPEG.get(pid) ?? [];
      arr.push(insight);
      insightsByPEG.set(pid, arr);
    }
    // Also index by the PEG linked through each study
    for (const sid of insight.studyIds) {
      const study = studies.find((s) => s.id === sid);
      if (study?.pegId && !insight.pegIds.includes(study.pegId)) {
        const arr = insightsByPEG.get(study.pegId) ?? [];
        arr.push(insight);
        insightsByPEG.set(study.pegId, arr);
      }
    }
  }

  return pegs.map((peg) => {
    const pegStudies  = studiesByPEG.get(peg.id) ?? [];
    const pegInsights = insightsByPEG.get(peg.id) ?? [];
    const totalActualCost    = pegStudies.reduce((s, st) => s + st.actualCost, 0);
    const totalForecastedCost = peg.forecastedCost;
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

export function buildPhaseCostBreakdown(
  pegsWithCosts: PEGWithCosts[],
  gameId?: string
): PhaseCostBreakdown[] {
  const phases: DevelopmentPhase[] = [
    "Concept",
    "Pre Production",
    "Production",
    "Alpha",
    "Beta",
    "Launch",
  ];

  const filtered = gameId
    ? pegsWithCosts.filter((p) => p.gameId === gameId)
    : pegsWithCosts;

  return phases
    .map((phase) => {
      const inPhase = filtered.filter((p) => p.developmentPhase === phase);
      return {
        phase,
        actualCost: inPhase.reduce((s, p) => s + p.totalActualCost, 0),
        forecastedCost: inPhase.reduce((s, p) => s + p.totalForecastedCost, 0),
        pegCount: inPhase.length,
        studyCount: inPhase.reduce((s, p) => s + p.studyCount, 0),
      };
    })
    .filter((p) => p.pegCount > 0);
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
