/**
 * Goal Insights — shows all captured insights organised by Player Experience Goal.
 * Insights within each PEG are sorted newest-first (by study date).
 * A coloured status-progression strip shows how the goal's health has evolved
 * from the earliest study to the most recent one.
 */
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  PageHeader,
  LoadingSpinner,
  ErrorBanner,
  PhaseBadge,
  StatusBadge,
  InsightStatusBadge,
  fmtCurrencyFull,
} from "../components/ui";
import type { DevelopmentPhase, GoalStatus, Insight, PEGWithCosts } from "../types";

// ─── Insight status colours (for the progression strip) ──────────────────────

const STATUS_DOT: Record<string, string> = {
  "Positive":             "bg-emerald-500",
  "Mixed":                "bg-amber-400",
  "Needs Attention":      "bg-red-500",
  "Analysis in Progress": "bg-gray-400",
};

const STATUS_RING: Record<string, string> = {
  "Positive":             "ring-emerald-200",
  "Mixed":                "ring-amber-200",
  "Needs Attention":      "ring-red-200",
  "Analysis in Progress": "ring-gray-200",
};

const PHASES: DevelopmentPhase[] = [
  "Concept", "Pre Production", "Production", "Alpha", "Beta", "Launch",
];
const STATUSES: GoalStatus[] = [
  "Not Started", "Planning", "In Progress", "Measuring", "Complete",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sortInsightsNewestFirst(insights: Insight[]): Insight[] {
  return [...insights].sort((a, b) => {
    if (!a.studyDate && !b.studyDate) return 0;
    if (!a.studyDate) return 1;
    if (!b.studyDate) return -1;
    return b.studyDate.localeCompare(a.studyDate);
  });
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Coloured dots showing the status trajectory, oldest → newest (left to right). */
function ProgressionStrip({ insights }: { insights: Insight[] }) {
  // oldest first for visual left-to-right reading
  const ordered = sortInsightsNewestFirst(insights).reverse();
  if (ordered.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5 mt-2">
      <span className="text-xs text-gray-400 mr-0.5 flex-shrink-0">Progression:</span>
      {ordered.map((ins, i) => (
        <div key={ins.id} className="flex items-center gap-1">
          {i > 0 && <div className="w-4 h-px bg-gray-200" />}
          <div
            title={`${ins.status ?? "Unknown"} · ${fmtDate(ins.studyDate)}`}
            className={`w-3 h-3 rounded-full ring-2 ring-offset-1 ${
              STATUS_DOT[ins.status ?? ""] ?? "bg-gray-300"
            } ${STATUS_RING[ins.status ?? ""] ?? "ring-gray-100"}`}
          />
        </div>
      ))}
      <span className="text-xs text-gray-400 ml-1 flex-shrink-0">Latest</span>
    </div>
  );
}

/** A single PEG card with its insight history. */
function PEGInsightCard({
  peg,
  showGame,
}: {
  peg: PEGWithCosts;
  showGame: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const sorted = sortInsightsNewestFirst(peg.insights);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* ── PEG header ── */}
      <div className="px-5 py-4 flex items-start justify-between gap-4 border-b border-gray-100">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/goals/${peg.id}`}
              className="text-sm font-semibold text-gray-900 hover:text-blue-600 leading-snug"
            >
              {peg.name}
            </Link>
            <PhaseBadge phase={peg.developmentPhase} />
            <StatusBadge status={peg.status} />
          </div>
          {showGame && (
            <p className="text-xs text-gray-400 mt-1">{peg.gameName}</p>
          )}

          {/* Status progression strip */}
          {sorted.length > 0 && <ProgressionStrip insights={sorted} />}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Budget summary */}
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400">Budget spent</p>
            <p className="text-sm font-medium text-gray-900">
              {fmtCurrencyFull(peg.totalActualCost)}
              <span className="text-xs text-gray-400 font-normal">
                {" "}/ {fmtCurrencyFull(peg.totalForecastedCost)}
              </span>
            </p>
          </div>

          {/* Collapse toggle */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            title={expanded ? "Collapse" : "Expand"}
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "" : "-rotate-90"}`}
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Insight list (newest first) ── */}
      {expanded && (
        <div>
          {sorted.length === 0 ? (
            <div className="px-5 py-5 text-center">
              <p className="text-sm text-gray-400">No insights captured yet for this goal.</p>
              <p className="text-xs text-gray-300 mt-1">
                Add insights in Airtable → Insights table, linking them to a Study and this PEG.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {sorted.map((ins, idx) => (
                <div key={ins.id} className="px-5 py-4 flex items-start gap-4">
                  {/* Index + status dot */}
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0 pt-0.5">
                    <span className="text-xs font-bold text-gray-300 tabular-nums w-5 text-center">
                      {idx === 0 ? "🆕" : `#${sorted.length - idx}`}
                    </span>
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        STATUS_DOT[ins.status ?? ""] ?? "bg-gray-300"
                      }`}
                    />
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    {/* Row: study name + date */}
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      {ins.studyNames.length > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                          {ins.studyNames.join(", ")}
                        </span>
                      )}
                      {ins.studyDate && (
                        <span className="text-xs text-gray-400">{fmtDate(ins.studyDate)}</span>
                      )}
                    </div>

                    {/* Insight title */}
                    {ins.title && (
                      <p className="text-sm font-medium text-gray-800 leading-snug mb-1">
                        {ins.title}
                      </p>
                    )}

                    {/* Insight body */}
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {ins.insight || <span className="italic text-gray-300">No detail entered.</span>}
                    </p>
                  </div>

                  {/* Status badge */}
                  <div className="flex-shrink-0 pt-0.5">
                    <InsightStatusBadge status={ins.status} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer: link to GoalDetail */}
          <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs text-gray-400">
              {sorted.length} insight{sorted.length !== 1 ? "s" : ""} · {peg.studyCount} study{peg.studyCount !== 1 ? "ies" : ""}
            </span>
            <Link
              to={`/goals/${peg.id}`}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View full progression
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export function Goals() {
  const { loading, error, pegsWithCosts, gameSummaries } = useApp();

  const [selectedGameId, setSelectedGameId] = useState<string>("all");
  const [phaseFilter,    setPhaseFilter]    = useState<DevelopmentPhase | "all">("all");
  const [statusFilter,   setStatusFilter]   = useState<GoalStatus | "all">("all");
  const [search,         setSearch]         = useState("");

  // Filter PEGs
  const filteredPEGs = useMemo<PEGWithCosts[]>(() => {
    return pegsWithCosts.filter((p) => {
      if (selectedGameId !== "all" && p.gameId !== selectedGameId) return false;
      if (phaseFilter    !== "all" && p.developmentPhase !== phaseFilter)  return false;
      if (statusFilter   !== "all" && p.status           !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.gameName.toLowerCase().includes(q) &&
          !p.productGoalName.toLowerCase().includes(q) &&
          !p.insights.some(
            (ins) =>
              ins.title.toLowerCase().includes(q) ||
              ins.insight.toLowerCase().includes(q)
          )
        )
          return false;
      }
      return true;
    });
  }, [pegsWithCosts, selectedGameId, phaseFilter, statusFilter, search]);

  // Group by game for display
  const groups = useMemo(() => {
    if (selectedGameId !== "all") {
      const game = gameSummaries.find((g) => g.id === selectedGameId);
      return [{ gameId: selectedGameId, gameName: game?.name ?? selectedGameId, pegs: filteredPEGs }];
    }
    return gameSummaries
      .map((g) => ({ gameId: g.id, gameName: g.name, pegs: filteredPEGs.filter((p) => p.gameId === g.id) }))
      .filter(({ pegs }) => pegs.length > 0);
  }, [gameSummaries, filteredPEGs, selectedGameId]);

  const totalInsights = filteredPEGs.reduce((s, p) => s + p.insightCount, 0);
  const showGame      = selectedGameId === "all";

  if (loading) return <LoadingSpinner label="Loading insights…" />;
  if (error)   return <ErrorBanner message={error} />;

  return (
    <div>
      <PageHeader
        title="Goal Insights"
        subtitle={`${totalInsights} insight${totalInsights !== 1 ? "s" : ""} across ${filteredPEGs.length} player experience goal${filteredPEGs.length !== 1 ? "s" : ""}`}
      />

      {/* ── Game filter pills ── */}
      <div className="px-8 pt-4 pb-0 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedGameId("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            selectedGameId === "all"
              ? "bg-blue-600 border-blue-600 text-white"
              : "bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
          }`}
        >
          All Games
        </button>
        {gameSummaries.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedGameId(g.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              selectedGameId === g.id
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="px-8 py-4 flex flex-wrap gap-3 bg-white border-b border-gray-100">
        <input
          type="text"
          placeholder="Search goals or insights…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
        />
        <select
          value={phaseFilter}
          onChange={(e) => setPhaseFilter(e.target.value as DevelopmentPhase | "all")}
          className="border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Phases</option>
          {PHASES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as GoalStatus | "all")}
          className="border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {(phaseFilter !== "all" || statusFilter !== "all" || search) && (
          <button
            onClick={() => { setPhaseFilter("all"); setStatusFilter("all"); setSearch(""); }}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Content ── */}
      <div className="px-8 py-5 space-y-8">
        {groups.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 px-5 py-12 text-center">
            <p className="text-sm text-gray-400">No goals match your filters.</p>
          </div>
        ) : (
          groups.map(({ gameId, pegs, gameName }) => {
            const game = gameSummaries.find((g) => g.id === gameId);
            const displayName = gameName ?? game?.name ?? gameId;
            const totalGroupInsights = pegs.reduce((s, p) => s + p.insightCount, 0);

            return (
              <div key={gameId}>
                {/* Game section header (only in all-games view) */}
                {showGame && (
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-base font-semibold text-gray-800">{displayName}</h2>
                    {game && <PhaseBadge phase={game.currentPhase} />}
                    <span className="text-xs text-gray-400">
                      {totalGroupInsights} insight{totalGroupInsights !== 1 ? "s" : ""} · {pegs.length} PEG{pegs.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}

                {/* PEG cards */}
                <div className="space-y-4">
                  {pegs.map((peg) => (
                    <PEGInsightCard key={peg.id} peg={peg} showGame={!showGame} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
