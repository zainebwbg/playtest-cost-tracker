import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useApp, buildPhaseCostBreakdown, buildPEGCostBreakdown } from "../context/AppContext";
import {
  StatCard,
  PageHeader,
  LoadingSpinner,
  ErrorBanner,
  PhaseBadge,
  StatusBadge,
  InsightStatusBadge,
  VarianceCell,
  fmtCurrency,
  fmtCurrencyFull,
} from "../components/ui";
import type { PEGWithCosts } from "../types";


type CostMode = "actual" | "forecasted" | "both";

export function Dashboard() {
  const { loading, error, gameSummaries, pegsWithCosts, studies, insights, isConfigured } = useApp();
  const [costMode, setCostMode] = useState<CostMode>("both");
  const [selectedGameId, setSelectedGameId] = useState<string>("all");
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);

  const selectGame = useCallback((id: string) => {
    setSelectedGameId(id);
    setSelectedPhase(null); // reset phase drill-down when game changes
  }, []);

  // ─── All hooks must come before any early returns ─────────────────────────
  const filteredPEGs = useMemo<PEGWithCosts[]>(
    () => selectedGameId === "all"
      ? pegsWithCosts
      : pegsWithCosts.filter((p) => p.gameId === selectedGameId),
    [pegsWithCosts, selectedGameId]
  );

  const selectedGame = useMemo(
    () => gameSummaries.find((g) => g.id === selectedGameId) ?? null,
    [gameSummaries, selectedGameId]
  );

  // PEGs whose studies were conducted in the clicked phase
  const phaseDrillPEGs = useMemo<PEGWithCosts[] | null>(() => {
    if (!selectedPhase || selectedGameId === "all") return null;
    const pegIdsInPhase = new Set(
      studies
        .filter((s) => s.developmentPhase === selectedPhase && s.gameId === selectedGameId)
        .flatMap((s) => (s.pegIds.length > 0 ? s.pegIds : s.pegId ? [s.pegId] : []))
    );
    return filteredPEGs.filter((p) => pegIdsInPhase.has(p.id));
  }, [selectedPhase, selectedGameId, studies, filteredPEGs]);

  if (loading) return <LoadingSpinner label="Loading dashboard…" />;
  if (error) return <ErrorBanner message={error} />;

  if (!isConfigured) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Overview of playtest costs across all game titles" />
        <div className="px-8 py-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-6 py-5 max-w-2xl">
            <h2 className="text-sm font-semibold text-amber-800">Airtable not configured</h2>
            <p className="mt-1 text-sm text-amber-700">
              To start tracking real data, set up your Airtable credentials in{" "}
              <Link to="/settings" className="font-medium underline">Settings</Link>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── KPI aggregates ────────────────────────────────────────────────────────
  const totalForecast  = filteredPEGs.reduce((s, p) => s + p.totalForecastedCost, 0);
  const totalActual    = filteredPEGs.reduce((s, p) => s + p.totalActualCost, 0);
  const totalVariance  = totalForecast - totalActual;
  const totalStudies   = filteredPEGs.reduce((s, p) => s + p.studyCount, 0);
  const completedPEGs  = filteredPEGs.filter((p) => p.status === "Complete").length;
  const totalInsights  = filteredPEGs.reduce((s, p) => s + p.insightCount, 0);

  // ─── Chart data ────────────────────────────────────────────────────────────
  const gameFilter = selectedGameId === "all" ? undefined : selectedGameId;

  // Chart 1 — Cost by Game (all) or Cost by Development Phase (specific game)
  // Phase breakdown is now STUDY-based (Development Phase field on each Study)
  const phaseBreakdown = buildPhaseCostBreakdown(studies, gameFilter);

  const costChartData = selectedGameId === "all"
    ? gameSummaries.map((g) => ({
        name: g.name.length > 14 ? g.name.slice(0, 14) + "…" : g.name,
        Actual: g.totalActualCost,
        Forecasted: g.totalForecastedCost,
      }))
    : phaseBreakdown.map((p) => ({
        name: p.phase,
        Actual: p.actualCost,
        Forecasted: p.forecastedCost,
      }));

  const costChartLabel = selectedGameId === "all" ? "Cost by Game Title" : "Cost by Development Phase";

  // Chart 2 — Cost per PX Goal (study costs split evenly across linked goals)
  const pegCostBreakdown = buildPEGCostBreakdown(pegsWithCosts, gameFilter);
  const pegCostChartData = pegCostBreakdown.slice(0, 10).map((p) => ({
    name: p.pegName,
    Actual: p.actualCost,
    Forecasted: p.forecastedCost,
  }));
  const pegCostChartLabel = selectedGameId === "all"
    ? "Cost by PX Goal (Top 10)"
    : "Cost by PX Goal";

  // Recent active goals
  const recentPEGs = [...filteredPEGs]
    .filter((p) => p.status !== "Complete" && p.status !== "Not Started")
    .slice(0, 6);

  // Recent insights
  const recentInsights = [...insights]
    .filter((ins) =>
      selectedGameId === "all" || ins.gameNames.includes(selectedGame?.name ?? "")
    )
    .slice(0, 4);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={
          selectedGame
            ? `${selectedGame.name} · ${selectedGame.currentPhase}`
            : "Overview across all game titles"
        }
        actions={
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {(["actual", "forecasted", "both"] as CostMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setCostMode(mode)}
                className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${
                  costMode === mode
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        }
      />

      {/* ── Game filter pills ── */}
      <div className="px-8 pt-4 pb-0 flex flex-wrap items-center gap-2">
        <button
          onClick={() => selectGame("all")}
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
            onClick={() => selectGame(g.id)}
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

      <div className="px-8 py-5 space-y-6">
        {/* ── KPI Strip ── */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <StatCard label="Total Forecasted"    value={fmtCurrency(totalForecast)}         sub={fmtCurrencyFull(totalForecast)} />
          <StatCard label="Total Actual Spend"  value={fmtCurrency(totalActual)}           sub={fmtCurrencyFull(totalActual)}   tone={totalActual > totalForecast ? "danger" : "default"} />
          <StatCard label={totalVariance >= 0 ? "Budget Remaining" : "Over Budget"} value={fmtCurrency(Math.abs(totalVariance))} tone={totalVariance >= 0 ? "success" : "danger"} />
          <StatCard label="Goals Complete"      value={`${completedPEGs} / ${filteredPEGs.length}`} tone="info" />
          <StatCard label="Studies Conducted"   value={String(totalStudies)} />
          <StatCard label="Insights Captured"   value={String(totalInsights)} tone={totalInsights > 0 ? "success" : "default"} />
        </div>

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1 — Cost by Game or Cost by Development Phase */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-base font-bold text-gray-900 mb-4">{costChartLabel}</h2>
            {costChartData.length === 0 ? (
              <p className="text-sm text-gray-400 py-10 text-center">
                {selectedGameId === "all"
                  ? "No game data yet."
                  : "No studies with a Development Phase recorded yet. Set the phase on each study in Airtable."}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={costChartData}
                  barCategoryGap="30%"
                  style={selectedGameId !== "all" ? { cursor: "pointer" } : undefined}
                  onClick={
                    selectedGameId !== "all"
                      ? (data) => {
                          const phase = data?.activeLabel as string | undefined;
                          if (phase) setSelectedPhase((p) => (p === phase ? null : phase));
                        }
                      : undefined
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => fmtCurrency(v as number)} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => fmtCurrencyFull(v as number)} />
                  <Legend />
                  {(costMode === "actual"     || costMode === "both") && (
                    <Bar dataKey="Actual" radius={[3, 3, 0, 0]}
                      fill={undefined}
                      // Highlight selected phase bar
                    >
                      {costChartData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={selectedPhase && entry.name !== selectedPhase ? "#bfdbfe" : "#3b82f6"}
                        />
                      ))}
                    </Bar>
                  )}
                  {(costMode === "forecasted" || costMode === "both") && (
                    <Bar dataKey="Forecasted" radius={[3, 3, 0, 0]}
                      fill={undefined}
                    >
                      {costChartData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={selectedPhase && entry.name !== selectedPhase ? "#e0f2fe" : "#93c5fd"}
                        />
                      ))}
                    </Bar>
                  )}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Chart 2 — Cost by PX Goal */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-base font-bold text-gray-900 mb-4">{pegCostChartLabel}</h2>
            {pegCostChartData.length === 0 ? (
              <p className="text-sm text-gray-400 py-10 text-center">No cost data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={pegCostChartData} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => fmtCurrency(v as number)} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => fmtCurrencyFull(v as number)} />
                  <Legend />
                  {(costMode === "actual"     || costMode === "both") && <Bar dataKey="Actual"     fill="#3b82f6" radius={[0, 3, 3, 0]} />}
                  {(costMode === "forecasted" || costMode === "both") && <Bar dataKey="Forecasted" fill="#93c5fd" radius={[0, 3, 3, 0]} />}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>


        {/* ── Active Goals ── */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-gray-900">
                {phaseDrillPEGs
                  ? `PX Goals · ${selectedPhase}`
                  : "Active PX Goals"}
              </h2>
              {selectedPhase && (
                <button
                  onClick={() => setSelectedPhase(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  Clear
                </button>
              )}
            </div>
            <Link to="/goals" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(phaseDrillPEGs ?? recentPEGs).length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400">
                {selectedPhase
                  ? `No PX Goals have studies in the ${selectedPhase} phase yet.`
                  : "No active goals for this selection."}
              </p>
            ) : (
              (phaseDrillPEGs ?? recentPEGs).map((peg) => (
                <Link key={peg.id} to={`/goals/${peg.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{peg.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{peg.gameName} · {peg.productGoalName}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge status={peg.status} />
                    <VarianceCell value={peg.variance} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* ── Recent Insights ── */}
        {recentInsights.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Recent Insights</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {recentInsights.map((ins) => (
                <div key={ins.id} className="px-5 py-3.5 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{ins.title || "Untitled"}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{ins.insight}</p>
                    {ins.studyNames.length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">From: {ins.studyNames.join(", ")}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <InsightStatusBadge status={ins.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Game summaries table (all games view only) ── */}
        {selectedGameId === "all" && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Game Summaries</h2>
              <Link to="/games" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View all</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {["Game", "Phase", "PX Goals", "Studies", "Actual Spend", "Forecasted", "Variance"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {gameSummaries.map((g) => (
                    <tr key={g.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedGameId(g.id)}>
                      <td className="px-4 py-3">
                        <Link to={`/games/${g.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-700" onClick={(e) => e.stopPropagation()}>
                          {g.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3"><PhaseBadge phase={g.currentPhase} /></td>
                      <td className="px-4 py-3 text-sm text-gray-600">{g.completedPEGs}/{g.pegCount}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{g.studyCount}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{fmtCurrencyFull(g.totalActualCost)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{fmtCurrencyFull(g.totalForecastedCost)}</td>
                      <td className="px-4 py-3"><VarianceCell value={g.variance} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
