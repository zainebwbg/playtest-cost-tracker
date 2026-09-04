import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { useApp, buildPhaseCostBreakdown } from "../context/AppContext";
import {
  PageHeader,
  LoadingSpinner,
  ErrorBanner,
  PhaseBadge,
  fmtCurrencyFull,
  fmtCurrency,
  VarianceCell,
} from "../components/ui";
import type { DevelopmentPhase } from "../types";

const PHASES: DevelopmentPhase[] = [
  "Concept",
  "Pre Production",
  "Production",
  "Alpha",
  "Beta",
  "Launch",
];

const STATUS_COLORS_MAP: Record<string, string> = {
  Complete: "#10b981",
  Measuring: "#3b82f6",
  "In Progress": "#f59e0b",
  Planning: "#6b7280",
  "Not Started": "#d1d5db",
};

export function Reports() {
  const { loading, error, gameSummaries, pegsWithCosts, studies } = useApp();
  const [selectedGame, setSelectedGame] = useState<string>("all");

  if (loading) return <LoadingSpinner label="Loading reports…" />;
  if (error) return <ErrorBanner message={error} />;

  const filteredPEGs =
    selectedGame === "all"
      ? pegsWithCosts
      : pegsWithCosts.filter((p) => p.gameId === selectedGame);

  const phaseBreakdown = buildPhaseCostBreakdown(
    pegsWithCosts,
    selectedGame === "all" ? undefined : selectedGame
  );

  // ── Cost variance by game ──────────────────────────────────────────────────
  const varianceData = gameSummaries.map((g) => ({
    name: g.name.length > 12 ? g.name.slice(0, 12) + "…" : g.name,
    Variance: g.variance,
    fill: g.variance >= 0 ? "#10b981" : "#ef4444",
  }));

  // ── Study type distribution ────────────────────────────────────────────────
  const studyTypeCounts: Record<string, number> = {};
  for (const study of studies) {
    studyTypeCounts[study.type] = (studyTypeCounts[study.type] ?? 0) + 1;
  }
  const studyTypeData = Object.entries(studyTypeCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // ── Cost per phase table ───────────────────────────────────────────────────
  const phaseChartData = phaseBreakdown.map((p) => ({
    name: p.phase,
    Actual: p.actualCost,
    Forecasted: p.forecastedCost,
    count: p.pegCount,
  }));

  // ── Over/under budget PEGs ────────────────────────────────────────────────
  const overBudget = filteredPEGs
    .filter((p) => p.variance < 0)
    .sort((a, b) => a.variance - b.variance)
    .slice(0, 10);

  const mostExpensive = [...filteredPEGs]
    .sort((a, b) => b.totalActualCost - a.totalActualCost)
    .slice(0, 10);

  return (
    <div>
      <PageHeader
        title="Cost Reports"
        subtitle="Actual vs. forecasted spend analysis across phases and titles"
        actions={
          <select
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
            className="border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Games</option>
            {gameSummaries.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        }
      />

      <div className="px-8 py-6 space-y-6">
        {/* ── Budget Variance by Game ── */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Budget Variance by Game (positive = under budget)
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={varianceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis
                tickFormatter={(v) => fmtCurrency(v as number)}
                tick={{ fontSize: 11 }}
              />
              <Tooltip formatter={(v) => fmtCurrencyFull(v as number)} />
              <Bar dataKey="Variance" radius={[3, 3, 0, 0]}>
                {varianceData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Phase breakdown + Study types ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Phase breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Actual vs. Forecasted by Phase
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={phaseChartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis
                  tickFormatter={(v) => fmtCurrency(v as number)}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip formatter={(v) => fmtCurrencyFull(v as number)} />
                <Legend />
                <Bar dataKey="Actual" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Forecasted" fill="#d1d5db" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Study type distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Study Type Distribution
            </h2>
            {studyTypeData.length === 0 ? (
              <p className="text-sm text-gray-400 py-10 text-center">
                No studies yet.
              </p>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={studyTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {studyTypeData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={
                            ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#6b7280"][i % 6]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-1.5">
                  {studyTypeData.map((entry, i) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#6b7280"][i % 6],
                        }}
                      />
                      <span className="text-xs text-gray-600">
                        {entry.name}{" "}
                        <span className="font-semibold text-gray-800">
                          ({entry.value})
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Phase summary table ── */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">
              Phase Cost Summary
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {["Phase", "Goals", "Studies", "Actual Spend", "Forecasted", "Variance", "Avg Cost / Goal"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {phaseBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-400">
                      No data available.
                    </td>
                  </tr>
                ) : (
                  phaseBreakdown.map((p) => (
                    <tr key={p.phase} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <PhaseBadge phase={p.phase} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {p.pegCount}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {p.studyCount}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {fmtCurrencyFull(p.actualCost)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {fmtCurrencyFull(p.forecastedCost)}
                      </td>
                      <td className="px-4 py-3">
                        <VarianceCell value={p.forecastedCost - p.actualCost} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {p.pegCount > 0
                          ? fmtCurrencyFull(Math.round(p.actualCost / p.pegCount))
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Over-budget goals ── */}
        {overBudget.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">
                Over-Budget Goals
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {["Goal", "Game", "Phase", "Actual", "Forecasted", "Over by"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {overBudget.map((peg) => (
                    <tr key={peg.id} className="bg-red-50 hover:bg-red-100/50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs truncate">
                        {peg.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {peg.gameName}
                      </td>
                      <td className="px-4 py-3">
                        <PhaseBadge phase={peg.developmentPhase} />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {fmtCurrencyFull(peg.totalActualCost)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {fmtCurrencyFull(peg.totalForecastedCost)}
                      </td>
                      <td className="px-4 py-3">
                        <VarianceCell value={peg.variance} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Most expensive goals ── */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">
              Highest Cost Player Experience Goals
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {["Goal", "Game", "Phase", "Status", "Actual Cost", "Studies", "Variance"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mostExpensive.map((peg) => (
                  <tr key={peg.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs truncate">
                      {peg.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{peg.gameName}</td>
                    <td className="px-4 py-3">
                      <PhaseBadge phase={peg.developmentPhase} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{peg.status}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {fmtCurrencyFull(peg.totalActualCost)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{peg.studyCount}</td>
                    <td className="px-4 py-3">
                      <VarianceCell value={peg.variance} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
