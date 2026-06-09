"use client";

import Papa from "papaparse";
import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type InsuranceReportRow = {
  claimId: string;
  date: string;
  agent: string;
  status: string;
  tat: string;
  sla: string;
};

type KpiCard = {
  label: string;
  value: string;
  change: string;
  detail: string;
  tone: string;
};

type ChartPoint = {
  name: string;
  value: number;
};

type DailyClaimPoint = {
  date: string;
  claims: number;
};

type AgentProductivityPoint = {
  agent: string;
  claims: number;
};

type ExecutiveSummary = {
  summary: string;
  risks: string[];
  recommendations: string[];
  slaObservations: string[];
};

const requiredColumns = ["claimId", "date", "agent", "status", "tat", "sla"] as const;

const navItems = [
  "Dashboard",
  "Reports",
  "Data Intake",
  "AI Review",
  "Compliance",
  "Settings",
];

const insights = [
  {
    title: "Anomaly detected in auto claims",
    body: "Repair estimate variance is 18% above the 90-day baseline for Texas commercial auto policies.",
    tag: "High priority",
  },
  {
    title: "Approval velocity improved",
    body: "Straight-through processing rose after duplicate policy-holder records were consolidated.",
    tag: "Positive trend",
  },
  {
    title: "Missing broker codes",
    body: "1,248 life policy rows need broker code enrichment before month-end carrier reporting.",
    tag: "Action needed",
  },
];

const demoRows: InsuranceReportRow[] = [
  {
    claimId: "CLM-84291",
    date: "2026-06-03",
    agent: "Maya Patel",
    status: "Approved",
    tat: "16h",
    sla: "Met",
  },
  {
    claimId: "CLM-84292",
    date: "2026-06-03",
    agent: "Noah Williams",
    status: "Approved",
    tat: "11h",
    sla: "Met",
  },
  {
    claimId: "CLM-84293",
    date: "2026-06-04",
    agent: "Sophia Chen",
    status: "Rejected",
    tat: "31h",
    sla: "Missed",
  },
  {
    claimId: "CLM-84294",
    date: "2026-06-04",
    agent: "Ethan Brooks",
    status: "Approved",
    tat: "19h",
    sla: "Met",
  },
  {
    claimId: "CLM-84295",
    date: "2026-06-05",
    agent: "Ava Martin",
    status: "Pending",
    tat: "22h",
    sla: "Met",
  },
  {
    claimId: "CLM-84296",
    date: "2026-06-05",
    agent: "Maya Patel",
    status: "Approved",
    tat: "14h",
    sla: "Yes",
  },
  {
    claimId: "CLM-84297",
    date: "2026-06-06",
    agent: "Noah Williams",
    status: "Rejected",
    tat: "28h",
    sla: "No",
  },
  {
    claimId: "CLM-84298",
    date: "2026-06-06",
    agent: "Sophia Chen",
    status: "Pending",
    tat: "20h",
    sla: "Yes",
  },
  {
    claimId: "CLM-84299",
    date: "2026-06-07",
    agent: "Ethan Brooks",
    status: "Approved",
    tat: "13h",
    sla: "Yes",
  },
  {
    claimId: "CLM-84300",
    date: "2026-06-07",
    agent: "Ava Martin",
    status: "Approved",
    tat: "17h",
    sla: "Met",
  },
];

const chartColors = {
  approved: "#059669",
  rejected: "#e11d48",
  pending: "#d97706",
  cyan: "#0891b2",
  slate: "#334155",
};

const statusStyles: Record<string, string> = {
  Approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Review: "bg-cyan-50 text-cyan-700 ring-cyan-200",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatTooltipValue(value: unknown) {
  return typeof value === "number" ? formatNumber(value) : String(value ?? "");
}

function normalizeStatus(status: string) {
  return status.trim().toLowerCase();
}

function getSlaScore(sla: string) {
  const value = sla.trim().toLowerCase();
  const numeric = Number(value.replace("%", ""));

  if (Number.isFinite(numeric)) {
    if (numeric <= 1) {
      return numeric * 100;
    }

    return Math.min(numeric, 100);
  }

  if (["met", "yes", "y", "true", "pass", "passed", "on time", "ontime"].includes(value)) {
    return 100;
  }

  if (["missed", "no", "n", "false", "fail", "failed", "late"].includes(value)) {
    return 0;
  }

  return 0;
}

function isSlaMet(sla: string) {
  return getSlaScore(sla) >= 95;
}

function buildKpis(rows: InsuranceReportRow[]): KpiCard[] {
  const total = rows.length;
  const approved = rows.filter((row) => normalizeStatus(row.status) === "approved").length;
  const rejected = rows.filter((row) => normalizeStatus(row.status) === "rejected").length;
  const slaAverage =
    total === 0 ? 0 : rows.reduce((sum, row) => sum + getSlaScore(row.sla), 0) / total;

  return [
    {
      label: "Total Records",
      value: formatNumber(total),
      change: total > 0 ? "CSV live" : "No data",
      detail: "Insurance report rows loaded",
      tone: "border-cyan-200 bg-cyan-50 text-cyan-700",
    },
    {
      label: "Approved",
      value: formatNumber(approved),
      change: total > 0 ? `${Math.round((approved / total) * 100)}%` : "0%",
      detail: "Rows marked as approved",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    {
      label: "Rejected",
      value: formatNumber(rejected),
      change: total > 0 ? `${Math.round((rejected / total) * 100)}%` : "0%",
      detail: "Rows marked as rejected",
      tone: "border-rose-200 bg-rose-50 text-rose-700",
    },
    {
      label: "SLA %",
      value: `${slaAverage.toFixed(1)}%`,
      change: slaAverage >= 95 ? "On track" : "Watch",
      detail: "Average SLA score from uploaded rows",
      tone: "border-amber-200 bg-amber-50 text-amber-700",
    },
  ];
}

function validateRows(rows: InsuranceReportRow[]) {
  return rows.filter((row) =>
    requiredColumns.some((column) => String(row[column] ?? "").trim().length > 0),
  );
}

function buildStatusBreakdown(rows: InsuranceReportRow[]): ChartPoint[] {
  const statusCounts = {
    Approved: 0,
    Rejected: 0,
    Pending: 0,
  };

  rows.forEach((row) => {
    const status = normalizeStatus(row.status);

    if (status === "approved") {
      statusCounts.Approved += 1;
    } else if (status === "rejected") {
      statusCounts.Rejected += 1;
    } else if (status === "pending") {
      statusCounts.Pending += 1;
    }
  });

  return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
}

function buildDailyClaims(rows: InsuranceReportRow[]): DailyClaimPoint[] {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    const date = row.date.trim() || "Unknown";
    counts.set(date, (counts.get(date) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, claims]) => ({ date, claims }));
}

function buildSlaPerformance(rows: InsuranceReportRow[]): ChartPoint[] {
  return [
    {
      name: "Yes",
      value: rows.filter((row) => isSlaMet(row.sla)).length,
    },
    {
      name: "No",
      value: rows.filter((row) => !isSlaMet(row.sla)).length,
    },
  ];
}

function buildAgentProductivity(rows: InsuranceReportRow[]): AgentProductivityPoint[] {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    const agent = row.agent.trim() || "Unassigned";
    counts.set(agent, (counts.get(agent) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .sort(([, claimsA], [, claimsB]) => claimsB - claimsA)
    .slice(0, 8)
    .map(([agent, claims]) => ({ agent, claims }));
}

function buildExecutiveSummary(rows: InsuranceReportRow[]): ExecutiveSummary {
  const total = rows.length;
  const approved = rows.filter((row) => normalizeStatus(row.status) === "approved").length;
  const rejected = rows.filter((row) => normalizeStatus(row.status) === "rejected").length;
  const pending = rows.filter((row) => normalizeStatus(row.status) === "pending").length;
  const slaMet = rows.filter((row) => isSlaMet(row.sla)).length;
  const slaMissed = total - slaMet;
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
  const rejectionRate = total > 0 ? Math.round((rejected / total) * 100) : 0;
  const slaRate = total > 0 ? Math.round((slaMet / total) * 100) : 0;
  const busiestDay = buildDailyClaims(rows).sort((a, b) => b.claims - a.claims)[0];
  const topAgent = buildAgentProductivity(rows)[0];

  return {
    summary:
      `The current insurance reporting batch contains ${formatNumber(total)} records with ` +
      `${formatNumber(approved)} approved, ${formatNumber(rejected)} rejected, and ` +
      `${formatNumber(pending)} pending claims. Approval performance is ${approvalRate}%, ` +
      `while SLA compliance is tracking at ${slaRate}% across the active dataset.`,
    risks: [
      rejectionRate >= 20
        ? `Rejected claims are elevated at ${rejectionRate}%, which may delay carrier submission readiness.`
        : `Rejected claims are contained at ${rejectionRate}%, but should still be reviewed for recurring validation patterns.`,
      pending > 0
        ? `${formatNumber(pending)} pending records remain unresolved and could affect close-cycle reporting confidence.`
        : "No pending records are visible in the active batch, reducing immediate operational risk.",
      busiestDay
        ? `${busiestDay.date} has the highest daily volume with ${formatNumber(busiestDay.claims)} claims, creating a concentration point for QA.`
        : "Daily claim volume is not available for the active batch.",
    ],
    recommendations: [
      topAgent
        ? `Use ${topAgent.agent}'s workflow as a benchmark; they are currently handling ${formatNumber(topAgent.claims)} claims in this dataset.`
        : "Assign ownership for unallocated report rows before executive review.",
      "Prioritize rejected and pending rows before export so the final carrier package has fewer manual exceptions.",
      "Run a focused SLA review on late or failed rows before the next reporting cut-off.",
    ],
    slaObservations: [
      `${formatNumber(slaMet)} records are meeting SLA and ${formatNumber(slaMissed)} records are missing or below the target threshold.`,
      slaRate >= 95
        ? "SLA performance is within the desired operating range for a demo-ready reporting cycle."
        : "SLA performance is below the 95% operating target and should be watched before executive sign-off.",
    ],
  };
}

function ChartPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="mt-5 h-72 min-w-0">{children}</div>
    </section>
  );
}

function ChartsGrid({
  statusBreakdown,
  dailyClaims,
  slaPerformance,
  agentProductivity,
}: {
  statusBreakdown: ChartPoint[];
  dailyClaims: DailyClaimPoint[];
  slaPerformance: ChartPoint[];
  agentProductivity: AgentProductivityPoint[];
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <ChartPanel
        title="Status Breakdown"
        description="Approved, rejected, and pending claims from the active dataset."
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={statusBreakdown}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={3}
            >
              {statusBreakdown.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={
                    entry.name === "Approved"
                      ? chartColors.approved
                      : entry.name === "Rejected"
                        ? chartColors.rejected
                        : chartColors.pending
                  }
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatTooltipValue(value)} />
            <Legend iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Daily Claims Volume" description="Claim intake trend grouped by report date.">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dailyClaims} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip formatter={(value) => formatTooltipValue(value)} />
            <Line
              type="monotone"
              dataKey="claims"
              stroke={chartColors.cyan}
              strokeWidth={3}
              dot={{ r: 4, fill: chartColors.cyan }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel
        title="SLA Performance"
        description="Rows classified as meeting or missing service-level targets."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={slaPerformance} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip formatter={(value) => formatTooltipValue(value)} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {slaPerformance.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.name === "Yes" ? chartColors.approved : chartColors.rejected}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel title="Agent Productivity" description="Claim volume handled by each reporting agent.">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={agentProductivity}
            layout="vertical"
            margin={{ top: 8, right: 18, left: 34, bottom: 0 }}
          >
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" horizontal={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              dataKey="agent"
              type="category"
              width={96}
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip formatter={(value) => formatTooltipValue(value)} />
            <Bar dataKey="claims" fill={chartColors.slate} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartPanel>
    </section>
  );
}

export default function Home() {
  const [rows, setRows] = useState<InsuranceReportRow[]>(demoRows);
  const [fileName, setFileName] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [executiveSummary, setExecutiveSummary] = useState<ExecutiveSummary | null>(null);
  const [chartsMounted, setChartsMounted] = useState(false);

  const kpis = useMemo(() => buildKpis(rows), [rows]);
  const previewRows = rows.slice(0, 5);
  const statusBreakdown = useMemo(() => buildStatusBreakdown(rows), [rows]);
  const dailyClaims = useMemo(() => buildDailyClaims(rows), [rows]);
  const slaPerformance = useMemo(() => buildSlaPerformance(rows), [rows]);
  const agentProductivity = useMemo(() => buildAgentProductivity(rows), [rows]);

  useEffect(() => {
    setChartsMounted(true);
  }, []);

  function parseCsvFile(file: File) {
    setIsParsing(true);
    setValidationError("");
    setFileName(file.name);

    Papa.parse<InsuranceReportRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (result) => {
        const fields = result.meta.fields ?? [];
        const missingColumns = requiredColumns.filter((column) => !fields.includes(column));

        if (missingColumns.length > 0) {
          setValidationError(`Missing required columns: ${missingColumns.join(", ")}`);
          setRows([]);
          setIsParsing(false);
          return;
        }

        if (result.errors.length > 0) {
          setValidationError(result.errors[0]?.message ?? "Unable to parse this CSV file.");
          setRows([]);
          setIsParsing(false);
          return;
        }

        const parsedRows = validateRows(result.data);
        setRows(parsedRows);
        setIsParsing(false);
      },
      error: (error) => {
        setValidationError(error.message);
        setRows([]);
        setIsParsing(false);
      },
    });
  }

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      parseCsvFile(file);
    }

    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];

    if (file) {
      parseCsvFile(file);
    }
  }

  function handleGenerateSummary() {
    setIsGeneratingSummary(true);
    setExecutiveSummary(null);

    window.setTimeout(() => {
      setExecutiveSummary(buildExecutiveSummary(rows.length > 0 ? rows : demoRows));
      setIsGeneratingSummary(false);
    }, 1000);
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white px-5 py-6 lg:block">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-lg bg-slate-950 text-sm font-bold text-white">
              AR
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">Aegis Reports</p>
              <p className="text-xs text-slate-500">Insurance intelligence</p>
            </div>
          </div>

          <nav className="mt-9 space-y-1">
            {navItems.map((item) => (
              <a
                key={item}
                className={`flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition ${
                  item === "Dashboard"
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
                href="#"
              >
                <span>{item}</span>
                {item === "AI Review" ? (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700">
                    3
                  </span>
                ) : null}
              </a>
            ))}
          </nav>

          <div className="mt-10 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">Month-end close</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              7 carrier packages queued for AI validation before compliance export.
            </p>
            <div className="mt-4 h-2 rounded-full bg-slate-200">
              <div className="h-2 w-[72%] rounded-full bg-cyan-500" />
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 xl:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-700">AI Reporting Dashboard</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
                  Insurance reporting command center
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <button className="rounded-md border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50">
                  Export summary
                </button>
                <button className="rounded-md bg-slate-950 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-slate-800">
                  Run AI review
                </button>
              </div>
            </div>
          </header>

          <div className="grid gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:px-8">
            <div className="space-y-6">
              <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                {kpis.map((kpi) => (
                  <article
                    key={kpi.label}
                    className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
                        <p className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">
                          {kpi.value}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${kpi.tone}`}
                      >
                        {kpi.change}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-600">{kpi.detail}</p>
                  </article>
                ))}
              </section>

              <section className="grid gap-6 xl:grid-cols-[minmax(320px,0.95fr)_minmax(360px,1.05fr)]">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold text-slate-950">CSV Upload</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Import claims, policy changes, or broker extracts.
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      CSV only
                    </span>
                  </div>
                  <div
                    className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleDrop}
                  >
                    <div className="mx-auto grid size-12 place-items-center rounded-lg bg-white text-xl shadow-sm">
                      +
                    </div>
                    <p className="mt-4 text-sm font-semibold text-slate-950">
                      Drop carrier reporting files here
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Required columns: claimId, date, agent, status, tat, sla.
                    </p>
                    <label className="mt-5 inline-flex cursor-pointer rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700">
                      <input
                        className="sr-only"
                        type="file"
                        accept=".csv,text/csv"
                        onChange={handleUpload}
                      />
                      {isParsing ? "Parsing..." : "Select CSV file"}
                    </label>
                    {fileName ? (
                      <p className="mt-4 text-sm font-medium text-slate-700">
                        Uploaded: <span className="text-slate-950">{fileName}</span>
                      </p>
                    ) : null}
                    {validationError ? (
                      <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                        {validationError}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-slate-950">Processing Quality</h2>
                    <span className="text-sm font-medium text-emerald-700">
                      {validationError ? "Needs file fix" : "Stable"}
                    </span>
                  </div>
                  <div className="mt-5 space-y-4">
                    {[
                      ["Schema match", validationError ? "0%" : "100%", validationError ? "w-0" : "w-full", "bg-emerald-500"],
                      ["Duplicate detection", "87.4%", "w-[87%]", "bg-cyan-500"],
                      ["Compliance completeness", "93.8%", "w-[94%]", "bg-amber-500"],
                    ].map(([label, value, width, color]) => (
                      <div key={label}>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-slate-700">{label}</span>
                          <span className="text-slate-500">{value}</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-slate-100">
                          <div className={`h-2 rounded-full ${width} ${color}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {chartsMounted ? (
                <ChartsGrid
                  agentProductivity={agentProductivity}
                  dailyClaims={dailyClaims}
                  slaPerformance={slaPerformance}
                  statusBreakdown={statusBreakdown}
                />
              ) : null}

              <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">Recent Reports</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      First five parsed insurance report rows.
                    </p>
                  </div>
                  <button className="self-start rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:self-auto">
                    View all
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Claim ID</th>
                        <th className="px-5 py-3 font-semibold">Date</th>
                        <th className="px-5 py-3 font-semibold">Agent</th>
                        <th className="px-5 py-3 font-semibold">Status</th>
                        <th className="px-5 py-3 font-semibold">TAT</th>
                        <th className="px-5 py-3 font-semibold">SLA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewRows.length > 0 ? (
                        previewRows.map((report, index) => {
                          const statusKey =
                            Object.keys(statusStyles).find(
                              (status) => normalizeStatus(status) === normalizeStatus(report.status),
                            ) ?? "Review";

                          return (
                            <tr key={`${report.claimId}-${index}`} className="hover:bg-slate-50">
                              <td className="px-5 py-4 font-medium text-slate-950">
                                {report.claimId}
                              </td>
                              <td className="px-5 py-4 text-slate-600">{report.date}</td>
                              <td className="px-5 py-4 text-slate-600">{report.agent}</td>
                              <td className="px-5 py-4">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusStyles[statusKey]}`}
                                >
                                  {report.status || "Review"}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-slate-600">{report.tat}</td>
                              <td className="px-5 py-4 font-medium text-slate-950">
                                {report.sla}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td className="px-5 py-8 text-center text-slate-500" colSpan={6}>
                            Upload a valid CSV to preview insurance report rows.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">AI Insights</h2>
                    <p className="mt-1 text-sm text-slate-500">Generated from current batches.</p>
                  </div>
                  <button
                    className="shrink-0 rounded-md bg-cyan-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-cyan-300"
                    disabled={isGeneratingSummary}
                    onClick={handleGenerateSummary}
                  >
                    {isGeneratingSummary ? "Generating..." : "Generate AI Summary"}
                  </button>
                </div>
                <div className="mt-5 space-y-4">
                  {insights.map((insight) => (
                    <article key={insight.title} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-semibold leading-6 text-slate-950">
                          {insight.title}
                        </h3>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                          {insight.tag}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{insight.body}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">
                      AI Executive Summary
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Mock analysis generated from current dashboard data.
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    Frontend only
                  </span>
                </div>

                {isGeneratingSummary ? (
                  <div className="mt-5 space-y-3">
                    <div className="h-3 w-4/5 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-3 w-full animate-pulse rounded-full bg-slate-200" />
                    <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-200" />
                  </div>
                ) : executiveSummary ? (
                  <div className="mt-5 space-y-5">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-950">Executive summary</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {executiveSummary.summary}
                      </p>
                    </div>
                    {[
                      ["Key risks", executiveSummary.risks],
                      ["Recommendations", executiveSummary.recommendations],
                      ["SLA observations", executiveSummary.slaObservations],
                    ].map(([title, items]) => (
                      <div key={title as string}>
                        <h3 className="text-sm font-semibold text-slate-950">{title as string}</h3>
                        <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                          {(items as string[]).map((item) => (
                            <li key={item} className="rounded-md bg-slate-50 px-3 py-2">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5">
                    <p className="text-sm leading-6 text-slate-600">
                      Click Generate AI Summary to create a mock executive readout from the active
                      KPIs and charts.
                    </p>
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
                <p className="text-sm font-medium text-cyan-200">Next best action</p>
                <h2 className="mt-3 text-xl font-semibold tracking-normal">
                  Resolve Life Policy Changes before 5 PM.
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  AI found broker code gaps and mismatched effective dates. Fixing these rows should
                  lift batch SLA from 91.8% to 97.2%.
                </p>
                <button className="mt-5 rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
                  Review flagged rows
                </button>
              </section>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
