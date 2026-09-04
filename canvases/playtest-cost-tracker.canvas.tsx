import {
  BarChart,
  PieChart,
  Card,
  CardHeader,
  CardBody,
  Grid,
  Row,
  Stack,
  H1,
  H2,
  Text,
  Stat,
  Pill,
  Spacer,
  Divider,
  useHostTheme,
  useCanvasState,
} from "cursor/canvas";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = "Concept" | "Pre Production" | "Production" | "Alpha" | "Beta" | "Launch";
type GoalStatus = "Planning" | "In Progress" | "Measuring" | "Complete";
type InsightStatus = "Positive" | "Mixed" | "Needs Attention" | "Analysis in Progress";

interface MockInsight {
  id: number;
  pegId: number;
  title: string;
  insight: string;
  studyName: string;
  studyDate: string; // ISO date string — used to sort newest-first
  status: InsightStatus;
}

interface PlayerExperienceGoal {
  id: number;
  game: string;
  gameId: string;
  productGoal: string;
  name: string;
  phase: Phase;
  status: GoalStatus;
  actualCost: number;
  forecastedCost: number;
  studyCount: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INSIGHTS: MockInsight[] = [
  // PEG 1 — "Players feel powerful after leveling up" (Project Apex)
  { id: 1,  pegId: 1,  studyDate: "2025-01-20", studyName: "Power Feel Discovery",      status: "Analysis in Progress", title: "Initial hypothesis needs validation",           insight: "Preliminary sessions suggest VFX may be more important than stat numbers, but sample size is too small to conclude. Scheduling larger Beta study." },
  { id: 2,  pegId: 1,  studyDate: "2025-03-15", studyName: "Beta Playtest Round 1",     status: "Positive",             title: "Level-up VFX is the primary driver",            insight: "Level-up VFX and sound cues drove the power feeling significantly more than stat increases. Players scored 4.2/5 vs 2.8/5 without the animation." },
  { id: 3,  pegId: 1,  studyDate: "2025-05-10", studyName: "Beta Playtest Round 2",     status: "Mixed",                title: "Audio timing is critical",                      insight: "When audio cue was delayed more than 120ms from the visual, immersion broke. Tight A/V sync must be a hard requirement before Gold." },

  // PEG 2 — "Combat feedback is satisfying and responsive" (Project Apex)
  { id: 4,  pegId: 2,  studyDate: "2025-02-08", studyName: "Combat Feel Study A",       status: "Positive",             title: "Hit-stop under 80ms scores highest",            insight: "Hit-stop duration under 80ms scored significantly higher in satisfaction ratings (4.6/5). Anything above 120ms felt sluggish and unresponsive." },
  { id: 5,  pegId: 2,  studyDate: "2025-04-22", studyName: "Combat Feel Study B",       status: "Mixed",                title: "Controller vs KB/M split emerging",            insight: "Controller players rate combat 4.3/5; KB/M players only 3.1/5. Current hitbox sizing may favour analogue input. Needs platform-specific tuning." },

  // PEG 3 — "Social features encourage players to return" (Project Apex)
  { id: 6,  pegId: 3,  studyDate: "2024-11-05", studyName: "Social Discovery Study",    status: "Needs Attention",      title: "Solo players feel isolated early",              insight: "50% of solo players in the Alpha build stopped logging in after day 3. Social hooks do not trigger early enough in the onboarding flow." },
  { id: 7,  pegId: 3,  studyDate: "2025-01-30", studyName: "Social Alpha Playtest",     status: "Positive",             title: "Guild challenges drive 2x return rate",         insight: "Guild challenges drove a 2x return rate vs solo-only players. Players with at least one guild friend retained at 78% vs 41% at day 7." },

  // PEG 4 — "Onboarding is intuitive without a tutorial" (Shadow Realm)
  { id: 8,  pegId: 4,  studyDate: "2025-03-01", studyName: "Onboarding Study Alpha",    status: "Needs Attention",      title: "35+ cohort still requires guidance",            insight: "Players aged 18-24 completed onboarding without any prompts. Players 35+ still required guidance on the crafting system — consider optional contextual hints." },

  // PEG 5 — "World navigation feels natural" (Shadow Realm)
  { id: 9,  pegId: 5,  studyDate: "2025-04-10", studyName: "Navigation Study Alpha",    status: "Analysis in Progress", title: "Minimap iconography under review",               insight: "Early data suggests minimap iconography is causing confusion in zone transitions. Full analysis pending secondary session data." },

  // PEG 6 — "Character customization feels expressive" (Shadow Realm)
  { id: 10, pegId: 6,  studyDate: "2024-09-14", studyName: "Character Discovery Study", status: "Positive",             title: "Visual uniqueness more valued than mechanics",  insight: "Players valued looking unique over having mechanically distinct builds. 82% said being recognisable was their primary motivation." },

  // PEG 7 — "Story choices feel meaningful" (Shadow Realm)
  { id: 11, pegId: 7,  studyDate: "2024-10-20", studyName: "Narrative Discovery",       status: "Mixed",                title: "Choices feel impactful but consequences delayed", insight: "Players reported feeling their choices mattered, but rated consequence feedback low (2.9/5) due to long delays before seeing outcomes." },
  { id: 12, pegId: 7,  studyDate: "2025-02-18", studyName: "Story Choice Study",        status: "Positive",             title: "Consequence feedback within 10 min doubles replay", insight: "Players replayed 40% more when shown consequences of their choices within 10 minutes of the decision point." },

  // PEG 8 — "Speed mechanics feel fair" (Velocity Rush)
  { id: 13, pegId: 8,  studyDate: "2025-05-05", studyName: "Speed Mechanics Discovery", status: "Mixed",                title: "Rubber-band AI divides player cohorts",         insight: "Rubber-band AI received mixed reactions. Skilled players rejected it strongly but casual players preferred it. Needs segmentation-aware tuning." },

  // PEG 10 — "Character progression is rewarding" (Neon City)
  { id: 14, pegId: 10, studyDate: "2024-07-10", studyName: "Progression Early Study",   status: "Needs Attention",      title: "XP bar hidden — players unsure of progress",   insight: "Abstract rating system confused 60% of participants. Players could not articulate what actions made them stronger." },
  { id: 15, pegId: 10, studyDate: "2024-11-22", studyName: "Progression Beta Study",    status: "Mixed",                title: "XP bar added — partial improvement",            insight: "Adding the XP bar raised clarity scores from 2.3 to 3.6/5. Motivation scores improved modestly. Level-up milestone rewards still underwhelm." },
  { id: 16, pegId: 10, studyDate: "2025-03-08", studyName: "Progression Gold Study",    status: "Positive",             title: "Visible XP bars outperform abstract ratings",  insight: "Visible XP bars outperformed abstract rating systems in all age cohorts. 34% higher clarity of progress and 29% higher motivation to play." },

  // PEG 11 — "Multiplayer feels balanced" (Neon City)
  { id: 17, pegId: 11, studyDate: "2024-12-05", studyName: "SBMM Alpha Study",          status: "Needs Attention",      title: "Wide skill gaps frustrating newcomers",         insight: "New players matched against veterans churned 3x faster in the first week. SBMM pool too small to create close matches at low MMR." },
  { id: 18, pegId: 11, studyDate: "2025-04-01", studyName: "SBMM Beta Study",           status: "Positive",             title: "+-15% skill delta maximises session length",    insight: "SBMM tuned to +-15% skill delta maximised session length across both casual and competitive groups. Newcomer churn dropped 55%." },

  // PEG 14 — "Endgame content feels satisfying" (Neon City)
  { id: 19, pegId: 14, studyDate: "2025-05-20", studyName: "Endgame Loop Gold Study",   status: "Needs Attention",      title: "Endgame completion rate below target",          insight: "Current endgame loop completion rate is 68%; target is 80% before ship. Drop-off occurs at the second boss encounter — pacing issue suspected." },
];

const GAME_FILTERS = [
  { id: "all",      label: "All Games" },
  { id: "apex",     label: "Project Apex" },
  { id: "shadow",   label: "Shadow Realm" },
  { id: "velocity", label: "Velocity Rush" },
  { id: "neon",     label: "Neon City" },
];

const GOALS: PlayerExperienceGoal[] = [
  { id: 1,  gameId: "apex",     game: "Project Apex",  productGoal: "Increase Player Retention",    name: "Players feel powerful after leveling up",             phase: "Beta",           status: "Complete",    actualCost: 24000, forecastedCost: 26000, studyCount: 3 },
  { id: 2,  gameId: "apex",     game: "Project Apex",  productGoal: "Improve Combat Feel",          name: "Combat feedback is satisfying and responsive",         phase: "Beta",           status: "Measuring",   actualCost: 28500, forecastedCost: 30000, studyCount: 2 },
  { id: 3,  gameId: "apex",     game: "Project Apex",  productGoal: "Enhance Social Play",          name: "Social features encourage players to return",          phase: "Alpha",          status: "Complete",    actualCost: 20000, forecastedCost: 29000, studyCount: 4 },
  { id: 4,  gameId: "shadow",   game: "Shadow Realm",  productGoal: "Improve Onboarding",           name: "Onboarding is intuitive without a tutorial",           phase: "Alpha",          status: "In Progress", actualCost: 15000, forecastedCost: 20000, studyCount: 2 },
  { id: 5,  gameId: "shadow",   game: "Shadow Realm",  productGoal: "Improve Onboarding",           name: "World navigation feels natural and unambiguous",       phase: "Alpha",          status: "Planning",    actualCost:  5200, forecastedCost: 15000, studyCount: 1 },
  { id: 6,  gameId: "shadow",   game: "Shadow Realm",  productGoal: "Enhance Player Identity",      name: "Character customization feels expressive",             phase: "Pre Production", status: "Complete",    actualCost: 12000, forecastedCost: 12000, studyCount: 2 },
  { id: 7,  gameId: "shadow",   game: "Shadow Realm",  productGoal: "Narrative Engagement",         name: "Story choices feel meaningful and impactful",          phase: "Pre Production", status: "Complete",    actualCost:  9000, forecastedCost: 15000, studyCount: 3 },
  { id: 8,  gameId: "velocity", game: "Velocity Rush", productGoal: "Core Mechanic Fun",            name: "Speed mechanics feel fair and skill-based",            phase: "Concept",        status: "Measuring",   actualCost:  8500, forecastedCost: 15000, studyCount: 1 },
  { id: 9,  gameId: "velocity", game: "Velocity Rush", productGoal: "Replayability",                name: "Track variety keeps players engaged long-term",        phase: "Concept",        status: "Planning",    actualCost:     0, forecastedCost: 15000, studyCount: 0 },
  { id: 10, gameId: "neon",     game: "Neon City",     productGoal: "Progression Systems",          name: "Character progression is rewarding and clear",         phase: "Production",     status: "Complete",    actualCost: 38000, forecastedCost: 40000, studyCount: 5 },
  { id: 11, gameId: "neon",     game: "Neon City",     productGoal: "Multiplayer Balance",          name: "Multiplayer feels balanced across skill levels",       phase: "Beta",           status: "Complete",    actualCost: 22000, forecastedCost: 24000, studyCount: 3 },
  { id: 12, gameId: "neon",     game: "Neon City",     productGoal: "World Building",               name: "City exploration feels alive and dynamic",             phase: "Alpha",          status: "In Progress", actualCost: 18300, forecastedCost: 22000, studyCount: 2 },
  { id: 13, gameId: "neon",     game: "Neon City",     productGoal: "Player Identity",              name: "Customization enhances player identity",               phase: "Beta",           status: "Planning",    actualCost: 12000, forecastedCost: 14000, studyCount: 1 },
  { id: 14, gameId: "neon",     game: "Neon City",     productGoal: "Endgame Content",              name: "Endgame content feels satisfying and worth pursuing",  phase: "Production",     status: "Planning",    actualCost: 14000, forecastedCost: 10000, studyCount: 2 },
];

const GAME_TOTALS = [
  { game: "Project Apex",  actual:  72500, forecast:  85000 },
  { game: "Shadow Realm",  actual:  41200, forecast:  62000 },
  { game: "Velocity Rush", actual:   8500, forecast:  30000 },
  { game: "Neon City",     actual: 104300, forecast: 110000 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PHASES: Phase[] = ["Concept", "Pre Production", "Production", "Alpha", "Beta", "Launch"];

function fmtK(n: number): string {
  if (n === 0) return "$0";
  return `$${(n / 1000).toFixed(0)}K`;
}

function fmtDollar(n: number): string {
  return n === 0 ? "$0" : `$${n.toLocaleString()}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Newest study date first
function sortInsightsDesc(arr: MockInsight[]): MockInsight[] {
  return [...arr].sort((a, b) => b.studyDate.localeCompare(a.studyDate));
}

const STATUS_COLOR: Record<InsightStatus, string> = {
  "Positive":             "#10b981",
  "Mixed":                "#f59e0b",
  "Needs Attention":      "#ef4444",
  "Analysis in Progress": "#9ca3af",
};

function StatusDot({ status }: { status: InsightStatus }) {
  const color = STATUS_COLOR[status];
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: color,
        flexShrink: 0,
      }}
    />
  );
}

function StatusPill({ status }: { status: InsightStatus }) {
  const color = STATUS_COLOR[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 8px",
        borderRadius: 4,
        backgroundColor: color + "20",
        fontSize: 11,
        fontWeight: 600,
        color,
        whiteSpace: "nowrap",
      }}
    >
      <StatusDot status={status} />
      {status}
    </span>
  );
}

/** Left-to-right progression strip: oldest dot → newest dot */
function ProgressionStrip({ insights }: { insights: MockInsight[] }) {
  // oldest first (ascending) for left-to-right reading
  const ordered = sortInsightsDesc(insights).reverse();
  return (
    <Row gap={4} align="center">
      <Text size="small" tone="tertiary">Progression</Text>
      {ordered.map((ins, i) => (
        <Row key={ins.id} gap={3} align="center">
          {i > 0 && (
            <span style={{ display: "inline-block", width: 14, height: 1, backgroundColor: "#d1d5db" }} />
          )}
          <span
            title={`${ins.status} · ${fmtDate(ins.studyDate)}`}
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: STATUS_COLOR[ins.status],
              cursor: "default",
            }}
          />
        </Row>
      ))}
      <Text size="small" tone="tertiary">Latest</Text>
    </Row>
  );
}

function rowToneForStatus(status: GoalStatus): "success" | "info" | "warning" | "neutral" {
  if (status === "Complete")   return "success";
  if (status === "Measuring")  return "info";
  if (status === "In Progress") return "warning";
  return "neutral";
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PlaytestCostTracker() {
  const theme = useHostTheme();

  const [selectedGame, setSelectedGame] = useCanvasState<string>("selectedGame", "all");
  const [costMode,     setCostMode]     = useCanvasState<"actual" | "forecast" | "both">("costMode", "both");
  const [openPegId,    setOpenPegId]    = useCanvasState<number | null>("openPegId", null);

  // Goals filtered by selected game
  const goals = selectedGame === "all" ? GOALS : GOALS.filter((g) => g.gameId === selectedGame);

  // KPI aggregates
  const totalActual    = goals.reduce((s, g) => s + g.actualCost,    0);
  const totalForecast  = goals.reduce((s, g) => s + g.forecastedCost, 0);
  const variance       = totalForecast - totalActual;
  const totalStudies   = goals.reduce((s, g) => s + g.studyCount,    0);
  const completedGoals = goals.filter((g) => g.status === "Complete").length;
  const visibleInsights = INSIGHTS.filter((i) => goals.some((g) => g.id === i.pegId));
  const totalInsights  = visibleInsights.length;

  // Phase cost breakdown (single game)
  const phaseBreakdown = PHASES
    .map((phase) => {
      const inPhase = goals.filter((g) => g.phase === phase);
      return { phase, actual: inPhase.reduce((s, g) => s + g.actualCost, 0), forecast: inPhase.reduce((s, g) => s + g.forecastedCost, 0), count: inPhase.length };
    })
    .filter((p) => p.count > 0);

  // Status donut
  const statuses: GoalStatus[] = ["Complete", "Measuring", "In Progress", "Planning"];
  const statusSlices = statuses
    .map((status) => ({ label: status, value: goals.filter((g) => g.status === status).length, tone: rowToneForStatus(status) as "success" | "info" | "warning" | "neutral" }))
    .filter((s) => s.value > 0);

  // Cost chart
  const chartCategories = selectedGame === "all" ? GAME_TOTALS.map((g) => g.game) : phaseBreakdown.map((p) => p.phase);
  const actualData   = selectedGame === "all" ? GAME_TOTALS.map((g) => g.actual)   : phaseBreakdown.map((p) => p.actual);
  const forecastData = selectedGame === "all" ? GAME_TOTALS.map((g) => g.forecast) : phaseBreakdown.map((p) => p.forecast);
  const chartSeries = [
    ...(costMode !== "forecast" ? [{ name: "Actual",     data: actualData,   tone: "info"    as const }] : []),
    ...(costMode !== "actual"   ? [{ name: "Forecasted", data: forecastData               }] : []),
  ];

  // Insight status summary
  const insightStatuses: InsightStatus[] = ["Positive", "Mixed", "Needs Attention", "Analysis in Progress"];
  const insightStatusCounts = insightStatuses.map((s) => ({
    status: s,
    count:  visibleInsights.filter((i) => i.status === s).length,
  })).filter((s) => s.count > 0);

  return (
    <Stack gap={24} style={{ padding: 28, maxWidth: 1200 }}>

      {/* ── Header ── */}
      <Row align="center">
        <Stack gap={4}>
          <H1>Playtest Cost Tracker</H1>
          <Text tone="secondary" size="small">
            Player experience goal spend across active game titles
          </Text>
        </Stack>
        <Spacer />
        <Row gap={6}>
          <Pill active={costMode === "actual"}   onClick={() => setCostMode("actual")}>Actual</Pill>
          <Pill active={costMode === "forecast"} onClick={() => setCostMode("forecast")}>Forecast</Pill>
          <Pill active={costMode === "both"}     onClick={() => setCostMode("both")}>Both</Pill>
        </Row>
      </Row>

      {/* ── Game Filter ── */}
      <Row gap={8} wrap>
        {GAME_FILTERS.map((f) => (
          <Pill key={f.id} active={selectedGame === f.id} onClick={() => setSelectedGame(f.id)}>
            {f.label}
          </Pill>
        ))}
      </Row>

      <Divider />

      {/* ── KPI Strip ── */}
      <Grid columns={6} gap={16}>
        <Stat value={fmtK(totalForecast)}  label="Total Forecasted" />
        <Stat value={fmtK(totalActual)}    label="Total Actual Spend"     tone={totalActual > totalForecast ? "danger" : undefined} />
        <Stat value={fmtK(Math.abs(variance))} label={variance >= 0 ? "Budget Remaining" : "Over Budget"} tone={variance >= 0 ? "success" : "danger"} />
        <Stat value={`${completedGoals} / ${goals.length}`} label="Goals Complete" tone="info" />
        <Stat value={String(totalStudies)} label="Studies Conducted" />
        <Stat value={String(totalInsights)} label="Insights Captured" tone={totalInsights > 0 ? "success" : undefined} />
      </Grid>

      <Divider />

      {/* ── Charts Row ── */}
      <Grid columns={2} gap={16}>
        <Card>
          <CardHeader>
            {selectedGame === "all" ? "Cost by Game Title" : "Cost by Development Phase"}
          </CardHeader>
          <CardBody>
            <BarChart
              categories={chartCategories}
              series={chartSeries}
              valuePrefix="$"
              height={230}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>Goals by Status</CardHeader>
          <CardBody style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, paddingTop: 12 }}>
            <PieChart data={statusSlices} donut size={180} />
            <Row gap={16} justify="center" wrap>
              {statusSlices.map((s) => (
                <Text key={s.label} size="small" tone="secondary">
                  <Text size="small" weight="semibold" as="span">{s.value}</Text>
                  <Text size="small" as="span"> {s.label}</Text>
                </Text>
              ))}
            </Row>
          </CardBody>
        </Card>
      </Grid>

      <Divider />

      {/* ── Goal Insights ── */}
      <Row align="center">
        <H2>Goal Insights</H2>
        <Spacer />
        {/* Insight status summary */}
        <Row gap={16} wrap>
          {insightStatusCounts.map((s) => (
            <Row key={s.status} gap={6} align="center">
              <StatusDot status={s.status} />
              <Text size="small" tone="secondary">
                <Text size="small" weight="semibold" as="span">{s.count}</Text>
                <Text size="small" as="span"> {s.status}</Text>
              </Text>
            </Row>
          ))}
        </Row>
      </Row>

      {/* PEG cards — one per goal that has insights */}
      <Stack gap={10}>
        {goals.map((goal) => {
          const pegInsights = sortInsightsDesc(INSIGHTS.filter((i) => i.pegId === goal.id));
          const isOpen = openPegId === goal.id;
          const pv     = goal.forecastedCost - goal.actualCost;
          const latestStatus = pegInsights[0]?.status ?? null;

          return (
            <Card
              key={goal.id}
              collapsible
              open={isOpen}
              onOpenChange={(o) => setOpenPegId(o ? goal.id : null)}
            >
              <CardHeader
                trailing={
                  <Row gap={10} align="center">
                    {latestStatus && <StatusPill status={latestStatus} />}
                    <Pill size="sm">{goal.phase}</Pill>
                    <Pill size="sm" active={goal.status === "Complete"}>{goal.status}</Pill>
                    <Text size="small" tone="tertiary">
                      {pegInsights.length} insight{pegInsights.length !== 1 ? "s" : ""}
                    </Text>
                  </Row>
                }
              >
                {goal.name}
              </CardHeader>

              <CardBody>
                <Stack gap={16}>
                  {/* Meta row */}
                  <Row gap={16} wrap>
                    <Row gap={6}>
                      <Text size="small" tone="tertiary">Game</Text>
                      <Text size="small" tone="secondary">{goal.game}</Text>
                    </Row>
                    <Row gap={6}>
                      <Text size="small" tone="tertiary">Product Goal</Text>
                      <Text size="small" tone="secondary">{goal.productGoal}</Text>
                    </Row>
                    <Row gap={6}>
                      <Text size="small" tone="tertiary">Studies</Text>
                      <Text size="small" tone="secondary">{goal.studyCount}</Text>
                    </Row>
                  </Row>

                  {/* Budget row */}
                  <Grid columns={3} gap={12}>
                    <Stat value={fmtDollar(goal.actualCost)}    label="Actual Cost" />
                    <Stat value={fmtDollar(goal.forecastedCost)} label="Forecasted" />
                    <Stat
                      value={(pv >= 0 ? "+" : "") + fmtDollar(pv)}
                      label="Variance"
                      tone={pv >= 0 ? "success" : "danger"}
                    />
                  </Grid>

                  {pegInsights.length > 0 && (
                    <>
                      <Divider />

                      {/* Progression strip */}
                      <ProgressionStrip insights={pegInsights} />

                      <Divider />

                      {/* Insight list — newest first */}
                      <Stack gap={14}>
                        {pegInsights.map((ins, idx) => (
                          <Stack key={ins.id} gap={6}>
                            <Row gap={10} align="center">
                              {/* Latest badge */}
                              {idx === 0 && (
                                <Pill size="sm" active>Latest</Pill>
                              )}
                              <Text size="small" weight="semibold" tone={idx === 0 ? "primary" : "secondary"}>
                                {ins.title}
                              </Text>
                              <Spacer />
                              <StatusPill status={ins.status} />
                            </Row>
                            <Row gap={8} align="center">
                              <Text size="small" tone="tertiary">{ins.studyName}</Text>
                              <Text size="small" tone="tertiary">·</Text>
                              <Text size="small" tone="tertiary">{fmtDate(ins.studyDate)}</Text>
                            </Row>
                            <Text size="small">{ins.insight}</Text>
                            {idx < pegInsights.length - 1 && <Divider />}
                          </Stack>
                        ))}
                      </Stack>
                    </>
                  )}

                  {pegInsights.length === 0 && (
                    <Text size="small" tone="tertiary">
                      No insights captured yet. Add insights in Airtable, linking them to a Study and this goal.
                    </Text>
                  )}
                </Stack>
              </CardBody>
            </Card>
          );
        })}
      </Stack>
    </Stack>
  );
}
