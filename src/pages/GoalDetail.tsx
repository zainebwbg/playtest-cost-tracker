import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  PageHeader,
  LoadingSpinner,
  ErrorBanner,
  PhaseBadge,
  StatusBadge,
  StudyStatusBadge,
  StudyTypeBadge,
  InsightStatusBadge,
  VarianceCell,
  StatCard,
  fmtCurrencyFull,
  ProgressBar,
} from "../components/ui";

type DetailTab = "insights" | "studies";

export function GoalDetail() {
  const { id } = useParams<{ id: string }>();
  const { loading, error, pegsWithCosts } = useApp();
  const [tab, setTab] = useState<DetailTab>("insights");

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  const peg = pegsWithCosts.find((p) => p.id === id);
  if (!peg) {
    return (
      <div className="px-8 py-6">
        <p className="text-sm text-gray-500">Player experience goal not found.</p>
      </div>
    );
  }

  const spentPct =
    peg.totalForecastedCost === 0
      ? 0
      : Math.min(100, (peg.totalActualCost / peg.totalForecastedCost) * 100);

  const completedStudies = peg.studies.filter((s) => s.status === "Complete").length;
  const insightCount = peg.insights.length;

  // Sort insights newest study-date first
  const insightsSorted = [...peg.insights].sort((a, b) => {
    if (!a.studyDate && !b.studyDate) return 0;
    if (!a.studyDate) return 1;
    if (!b.studyDate) return -1;
    return b.studyDate.localeCompare(a.studyDate);
  });

  function fmtDate(iso: string | null) {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  }

  return (
    <div>
      <PageHeader
        title={peg.name}
        subtitle={`${peg.gameName} · ${peg.productGoalName}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={peg.status} />
          </div>
        }
      />

      {/* Breadcrumb */}
      <div className="px-8 pt-4 flex items-center gap-1.5 text-xs text-gray-400">
        <Link to="/games" className="hover:text-blue-600">
          Games
        </Link>
        <span>/</span>
        <Link to={`/games/${peg.gameId}`} className="hover:text-blue-600">
          {peg.gameName}
        </Link>
        <span>/</span>
        <span className="text-gray-600 truncate max-w-xs">{peg.name}</span>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Actual Cost"
            value={fmtCurrencyFull(peg.totalActualCost)}
            tone={peg.totalActualCost > peg.totalForecastedCost ? "danger" : "default"}
          />
          <StatCard
            label="Forecasted Budget"
            value={fmtCurrencyFull(peg.totalForecastedCost)}
          />
          <StatCard
            label={peg.variance >= 0 ? "Remaining Budget" : "Over Budget"}
            value={fmtCurrencyFull(Math.abs(peg.variance))}
            tone={peg.variance >= 0 ? "success" : "danger"}
          />
          <StatCard
            label="Studies"
            value={`${completedStudies} / ${peg.studyCount}`}
            sub="completed"
            tone="info"
          />
          <StatCard
            label="Insights Captured"
            value={String(insightCount)}
            tone={insightCount > 0 ? "success" : "default"}
          />
        </div>

        {/* Budget progress */}
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Budget utilization</span>
            <span className="text-gray-500">
              {fmtCurrencyFull(peg.totalActualCost)} of{" "}
              {fmtCurrencyFull(peg.totalForecastedCost)} ({spentPct.toFixed(0)}%)
            </span>
          </div>
          <ProgressBar
            value={peg.totalActualCost}
            max={peg.totalForecastedCost}
            tone={spentPct > 100 ? "red" : spentPct > 80 ? "amber" : "blue"}
          />
          {peg.notes && (
            <p className="mt-3 text-xs text-gray-500 italic">{peg.notes}</p>
          )}
        </div>

        {/* ── Tab bar ── */}
        <div className="flex items-center gap-1 border-b border-gray-200">
          {(["insights", "studies"] as DetailTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === t
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "insights"
                ? `Insights (${insightCount})`
                : `Studies (${peg.studyCount})`}
            </button>
          ))}
        </div>

        {/* ── Insights panel (sorted newest → oldest) ── */}
        {tab === "insights" && (
          <div className="space-y-3">
            {insightCount === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 px-5 py-10 text-center">
                <p className="text-sm text-gray-400 mb-2">No insights captured yet.</p>
                <p className="text-xs text-gray-400">
                  Add insights in Airtable → Insights table, link them to a Study and this
                  PX Goal.
                </p>
              </div>
            ) : (
              insightsSorted.map((insight, idx) => (
                <div
                  key={insight.id}
                  className="bg-white rounded-lg border border-gray-200"
                >
                  {/* Insight header */}
                  <div className="px-5 py-3.5 border-b border-gray-100 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {idx === 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700">
                            Latest
                          </span>
                        )}
                        <p className="text-sm font-semibold text-gray-900">
                          {insight.title || "Untitled insight"}
                        </p>
                      </div>
                      {/* Study + date */}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {insight.studyNames.length > 0 && (
                          <>
                            <span className="text-xs text-gray-400">From:</span>
                            {insight.studyNames.map((name, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700"
                              >
                                {name}
                              </span>
                            ))}
                          </>
                        )}
                        {insight.studyDate && (
                          <span className="text-xs text-gray-400">{fmtDate(insight.studyDate)}</span>
                        )}
                      </div>
                    </div>
                    {/* Status badge */}
                    <div className="flex-shrink-0">
                      <InsightStatusBadge status={insight.status} />
                    </div>
                  </div>

                  {/* Insight body */}
                  <div className="px-5 py-4">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {insight.insight || (
                        <span className="italic text-gray-400">No detail entered.</span>
                      )}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Studies panel ── */}
        {tab === "studies" && (
          <div className="space-y-3">
            {peg.studyCount === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 px-5 py-8 text-center">
                <p className="text-sm text-gray-400">No studies linked to this goal yet.</p>
              </div>
            ) : (
              peg.studies.map((study) => {
                /* Insights attached to this specific study */
                const studyInsights = peg.insights.filter((ins) =>
                  ins.studyIds.includes(study.id)
                );
                return (
                  <div key={study.id} className="bg-white rounded-lg border border-gray-200">
                    {/* Study header */}
                    <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-100">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{study.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StudyTypeBadge type={study.type} />
                          <StudyStatusBadge status={study.status} />
                          {study.date && (
                            <span className="text-xs text-gray-400">
                              {new Date(study.date).toLocaleDateString("en-US", {
                                month: "short", day: "numeric", year: "numeric",
                              })}
                            </span>
                          )}
                          {study.participants > 0 && (
                            <span className="text-xs text-gray-400">
                              {study.participants} participants
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-6 flex-shrink-0 text-right">
                        <div>
                          <p className="text-xs text-gray-400">Actual</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {fmtCurrencyFull(study.actualCost)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Forecasted</p>
                          <p className="text-sm text-gray-500">
                            {fmtCurrencyFull(study.forecastedCost)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Variance</p>
                          <VarianceCell value={study.forecastedCost - study.actualCost} />
                        </div>
                      </div>
                    </div>

                    {/* Insights from this study */}
                    {studyInsights.length > 0 && (
                      <div className="px-5 py-3.5 space-y-3 bg-blue-50/40">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Insights from this study ({studyInsights.length})
                        </p>
                        {studyInsights.map((ins) => (
                          <div key={ins.id} className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              {ins.title && (
                                <p className="text-xs font-medium text-gray-700 mb-0.5">
                                  {ins.title}
                                </p>
                              )}
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {ins.insight}
                              </p>
                            </div>
                            <div className="flex-shrink-0 mt-0.5">
                              <InsightStatusBadge status={ins.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Goal Insights — study-level text field (populated before Insights table was set up) */}
                    {study.insights && studyInsights.length === 0 && (
                      <div className="px-5 py-3.5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                          Goal Insights
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {study.insights}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
