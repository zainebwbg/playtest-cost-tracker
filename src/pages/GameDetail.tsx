import { useParams, Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useApp, buildPhaseCostBreakdown } from "../context/AppContext";
import {
  PageHeader,
  LoadingSpinner,
  ErrorBanner,
  PhaseBadge,
  StatusBadge,
  VarianceCell,
  StatCard,
  fmtCurrencyFull,
  fmtCurrency,
  ProgressBar,
} from "../components/ui";

export function GameDetail() {
  const { id } = useParams<{ id: string }>();
  const { loading, error, gameSummaries, productGoals, pegsWithCosts } = useApp();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  const game = gameSummaries.find((g) => g.id === id);
  if (!game) {
    return (
      <div className="px-8 py-6">
        <p className="text-sm text-gray-500">Game not found.</p>
      </div>
    );
  }

  const gamePGs = productGoals.filter((pg) => pg.gameId === id);
  const gamePEGs = pegsWithCosts.filter((peg) => peg.gameId === id);

  const phaseBreakdown = buildPhaseCostBreakdown(pegsWithCosts, id);
  const phaseChartData = phaseBreakdown.map((p) => ({
    name: p.phase,
    Actual: p.actualCost,
    Forecasted: p.forecastedCost,
  }));

  return (
    <div>
      <PageHeader
        title={game.name}
        subtitle={
          game.studio
            ? `${game.studio} · ${game.status}`
            : game.status
        }
        actions={
          <PhaseBadge phase={game.currentPhase} />
        }
      />

      <div className="px-8 py-6 space-y-6">
        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Actual Spend"
            value={fmtCurrencyFull(game.totalActualCost)}
            tone={game.totalActualCost > game.totalForecastedCost ? "danger" : "default"}
          />
          <StatCard
            label="Total Forecasted"
            value={fmtCurrencyFull(game.totalForecastedCost)}
          />
          <StatCard
            label={game.variance >= 0 ? "Budget Remaining" : "Over Budget"}
            value={fmtCurrencyFull(Math.abs(game.variance))}
            tone={game.variance >= 0 ? "success" : "danger"}
          />
          <StatCard
            label="Goals Complete"
            value={`${game.completedPEGs} / ${game.pegCount}`}
            tone="info"
          />
        </div>

        {/* Phase cost chart */}
        {phaseChartData.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Cost by Development Phase
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={phaseChartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis
                  tickFormatter={(v) => fmtCurrency(v as number)}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip formatter={(v) => fmtCurrencyFull(v as number)} />
                <Legend />
                <Bar dataKey="Actual" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Forecasted" fill="#d1d5db" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Product Goals with PEGs */}
        {gamePGs.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 px-5 py-8 text-center">
            <p className="text-sm text-gray-400">
              No product goals linked to this game yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">
              Product Goals &amp; PX Goals
            </h2>
            {gamePGs.map((pg) => {
              const pgPEGs = gamePEGs.filter((peg) => peg.productGoalId === pg.id);
              const pgActual = pgPEGs.reduce((s, p) => s + p.totalActualCost, 0);
              const pgForecast = pgPEGs.reduce((s, p) => s + p.totalForecastedCost, 0);

              return (
                <div
                  key={pg.id}
                  className="bg-white rounded-lg border border-gray-200"
                >
                  {/* Product goal header */}
                  <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {pg.name}
                      </h3>
                      {pg.description && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {pg.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-xs text-gray-400">Actual / Forecast</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {fmtCurrencyFull(pgActual)}{" "}
                        <span className="text-gray-400 font-normal">
                          / {fmtCurrencyFull(pgForecast)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* PEG rows */}
                  {pgPEGs.length === 0 ? (
                    <p className="px-5 py-4 text-xs text-gray-400">
                      No player experience goals linked yet.
                    </p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {pgPEGs.map((peg) => {
                        const pct = peg.totalForecastedCost === 0 ? 0 : Math.min(100, (peg.totalActualCost / peg.totalForecastedCost) * 100);
                        return (
                          <Link
                            key={peg.id}
                            to={`/goals/${peg.id}`}
                            className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 truncate">
                                {peg.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <ProgressBar value={pct} max={100} tone="blue" />
                                <span className="text-xs text-gray-400 flex-shrink-0">
                                  {pct.toFixed(0)}% spent
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <PhaseBadge phase={peg.developmentPhase} />
                              <StatusBadge status={peg.status} />
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">
                                  {fmtCurrencyFull(peg.totalActualCost)}
                                </p>
                                <p className="text-xs text-gray-400">
                                  of {fmtCurrencyFull(peg.totalForecastedCost)}
                                </p>
                              </div>
                              <VarianceCell value={peg.variance} />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
