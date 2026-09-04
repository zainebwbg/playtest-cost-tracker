/**
 * Shared UI primitives used across pages.
 */

import clsx from "clsx";
import type { DevelopmentPhase, GoalStatus, InsightStatus, Priority, StudyStatus, StudyType } from "../types";

// ─── Formatters ───────────────────────────────────────────────────────────────

export function fmtCurrency(n: number): string {
  if (n === 0) return "$0";
  if (Math.abs(n) >= 1_000_000)
    return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)
    return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function fmtCurrencyFull(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtVariance(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${fmtCurrencyFull(n)}`;
}

// ─── Phase Badge ──────────────────────────────────────────────────────────────

const PHASE_COLORS: Record<DevelopmentPhase, string> = {
  "Concept":        "bg-purple-100 text-purple-700",
  "Pre Production": "bg-violet-100 text-violet-700",
  "Production":     "bg-blue-100 text-blue-700",
  "Alpha":          "bg-cyan-100 text-cyan-700",
  "Beta":           "bg-amber-100 text-amber-700",
  "Launch":         "bg-green-100 text-green-700",
};

export function PhaseBadge({ phase }: { phase: DevelopmentPhase }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        PHASE_COLORS[phase] ?? "bg-gray-100 text-gray-700"
      )}
    >
      {phase}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<GoalStatus, string> = {
  "Not Started": "bg-gray-100 text-gray-500",
  Planning: "bg-gray-100 text-gray-600",
  "In Progress": "bg-amber-100 text-amber-700",
  Measuring: "bg-blue-100 text-blue-700",
  Complete: "bg-green-100 text-green-700",
};

export function StatusBadge({ status }: { status: GoalStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600"
      )}
    >
      {status}
    </span>
  );
}

const STUDY_STATUS_COLORS: Record<StudyStatus, string> = {
  Planned: "bg-gray-100 text-gray-500",
  "In Progress": "bg-blue-100 text-blue-700",
  Complete: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-600",
};

export function StudyStatusBadge({ status }: { status: StudyStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        STUDY_STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600"
      )}
    >
      {status}
    </span>
  );
}

// ─── Priority Badge ───────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<Priority, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-gray-100 text-gray-500",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        PRIORITY_COLORS[priority]
      )}
    >
      {priority}
    </span>
  );
}

// ─── Variance Cell ────────────────────────────────────────────────────────────

export function VarianceCell({ value }: { value: number }) {
  const over = value < 0;
  return (
    <span
      className={clsx(
        "text-sm font-medium",
        over ? "text-red-600" : "text-green-600"
      )}
    >
      {fmtVariance(value)}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}

const TONE_CLASSES: Record<string, string> = {
  default: "text-gray-900",
  success: "text-green-600",
  warning: "text-amber-600",
  danger: "text-red-600",
  info: "text-blue-600",
};

export function StatCard({ label, value, sub, tone = "default" }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </p>
      <p className={clsx("mt-1 text-2xl font-bold", TONE_CLASSES[tone])}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

// ─── Page Header ─────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between px-8 py-6 border-b border-gray-200 bg-white">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-10 h-10 mb-3">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────

export function LoadingSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
      <svg
        className="animate-spin w-8 h-8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <circle cx="12" cy="12" r="10" strokeWidth="2" opacity={0.2} />
        <path
          d="M12 2a10 10 0 0110 10"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <p className="text-sm">{label}</p>
    </div>
  );
}

// ─── Error Banner ─────────────────────────────────────────────────────────────

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mx-8 mt-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
      <p className="text-sm text-red-700 font-medium">Error loading data</p>
      <p className="text-xs text-red-600 mt-0.5">{message}</p>
    </div>
  );
}

// ─── Insight Status Badge ─────────────────────────────────────────────────────

const INSIGHT_STATUS_STYLES: Record<InsightStatus, { dot: string; bg: string; text: string }> = {
  "Positive":             { dot: "bg-green-500",  bg: "bg-green-50",  text: "text-green-700"  },
  "Mixed":                { dot: "bg-amber-400",  bg: "bg-amber-50",  text: "text-amber-700"  },
  "Needs Attention":      { dot: "bg-red-500",    bg: "bg-red-50",    text: "text-red-700"    },
  "Analysis in Progress": { dot: "bg-gray-400",   bg: "bg-gray-100",  text: "text-gray-600"   },
};

export function InsightStatusBadge({ status }: { status: InsightStatus | null }) {
  if (!status) return null;
  const s = INSIGHT_STATUS_STYLES[status];
  return (
    <span className={clsx("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", s.bg, s.text)}>
      <span className={clsx("w-2 h-2 rounded-full flex-shrink-0", s.dot)} />
      {status}
    </span>
  );
}

// ─── Study Type Badge ─────────────────────────────────────────────────────────

const STUDY_TYPE_ICONS: Record<StudyType, string> = {
  Playtest: "PT",
  Survey: "SV",
  Interview: "IN",
  "Diary Study": "DS",
  "Analytics Review": "AR",
  "Heuristic Evaluation": "HE",
};

export function StudyTypeBadge({ type }: { type: StudyType }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
      {STUDY_TYPE_ICONS[type] ?? type.slice(0, 2).toUpperCase()} {type}
    </span>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

export function ProgressBar({
  value,
  max,
  tone = "blue",
}: {
  value: number;
  max: number;
  tone?: "blue" | "green" | "amber" | "red";
}) {
  const pct = max === 0 ? 0 : Math.min(100, (value / max) * 100);
  const barColors = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };
  return (
    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
      <div
        className={clsx("h-full rounded-full transition-all", barColors[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
