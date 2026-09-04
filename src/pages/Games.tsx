import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  PageHeader,
  LoadingSpinner,
  ErrorBanner,
  PhaseBadge,
  StatCard,
  VarianceCell,
  fmtCurrencyFull,
  ProgressBar,
} from "../components/ui";
import type { GameStatus } from "../types";

const STATUS_DOT: Record<GameStatus, string> = {
  Active: "bg-green-400",
  "On Hold": "bg-amber-400",
  Shipped: "bg-blue-400",
  Cancelled: "bg-red-400",
};

export function Games() {
  const { loading, error, gameSummaries } = useApp();

  if (loading) return <LoadingSpinner label="Loading games…" />;
  if (error) return <ErrorBanner message={error} />;

  const totalForecast = gameSummaries.reduce((s, g) => s + g.totalForecastedCost, 0);
  const totalActual = gameSummaries.reduce((s, g) => s + g.totalActualCost, 0);

  return (
    <div>
      <PageHeader
        title="Game Titles"
        subtitle={`${gameSummaries.length} game${gameSummaries.length !== 1 ? "s" : ""} in development`}
      />

      <div className="px-8 py-6 space-y-6">
        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Active Games" value={String(gameSummaries.filter((g) => g.status === "Active").length)} />
          <StatCard label="Total Forecasted" value={fmtCurrencyFull(totalForecast)} />
          <StatCard label="Total Actual Spend" value={fmtCurrencyFull(totalActual)} tone={totalActual > totalForecast ? "danger" : "default"} />
        </div>

        {/* Game cards */}
        {gameSummaries.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 px-6 py-10 text-center">
            <p className="text-sm text-gray-500">
              No games found. Add your first game in Airtable.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {gameSummaries.map((game) => {
              const pct = game.pegCount === 0 ? 0 : Math.round((game.completedPEGs / game.pegCount) * 100);
              return (
                <Link
                  key={game.id}
                  to={`/games/${game.id}`}
                  className="bg-white rounded-lg border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all block"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[game.status]}`}
                        />
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {game.name}
                        </h3>
                      </div>
                      {game.studio && (
                        <p className="text-xs text-gray-400 ml-4">{game.studio}</p>
                      )}
                    </div>
                    <PhaseBadge phase={game.currentPhase} />
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Goals complete</span>
                      <span className="font-medium">
                        {game.completedPEGs}/{game.pegCount} ({pct}%)
                      </span>
                    </div>
                    <ProgressBar
                      value={game.completedPEGs}
                      max={game.pegCount}
                      tone={pct === 100 ? "green" : pct > 60 ? "blue" : "amber"}
                    />
                  </div>

                  {/* Cost metrics */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400">Actual Spend</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {fmtCurrencyFull(game.totalActualCost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Forecasted</p>
                      <p className="text-sm font-medium text-gray-500 mt-0.5">
                        {fmtCurrencyFull(game.totalForecastedCost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Variance</p>
                      <VarianceCell value={game.variance} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Studies Run</p>
                      <p className="text-sm font-medium text-gray-700 mt-0.5">
                        {game.studyCount}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
