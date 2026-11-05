"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  BarChart3,
  Table as TableIcon,
  Vote,
  Sparkles,
} from "lucide-react";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ClubsByStatusItem,
  MonthlyTrendItem,
} from "@/lib/analytics/admin";

interface AdminChartsProps {
  clubsByStatus: ClubsByStatusItem[];
  membershipsPerMonth: MonthlyTrendItem[];
  eventsPerMonth: MonthlyTrendItem[];
  rangeLabel: string;
}

export function AdminCharts({
  clubsByStatus,
  membershipsPerMonth,
  eventsPerMonth,
  rangeLabel,
}: AdminChartsProps) {
  const [viewClubs, setViewClubs] = useState<"chart" | "table">("chart");
  const [viewMembers, setViewMembers] = useState<"chart" | "table">("chart");
  const [viewEvents, setViewEvents] = useState<"chart" | "table">("chart");
  const [viewElections, setViewElections] = useState<"chart" | "table">("chart");

  const clubsConfig: ChartConfig = {
    count: { label: "Clubs" },
    ACTIVE: { label: "Active", color: "var(--state-success)" },
    PENDING: { label: "Pending", color: "var(--state-warning)" },
    SUSPENDED: { label: "Suspended", color: "var(--state-error)" },
    REJECTED: { label: "Rejected", color: "var(--copy-muted)" },
  };

  const trendConfig: ChartConfig = {
    count: { label: "Count", color: "var(--accent-primary)" },
  };

  const eventsConfig: ChartConfig = {
    count: { label: "Events", color: "var(--state-info)" },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Clubs by Status */}
      <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div>
            <h3 className="text-sm font-semibold text-copy-primary">
              Clubs by Status
            </h3>
            <p className="text-xs text-copy-muted">
              Distribution of all registered campus organizations
            </p>
          </div>
          <div className="flex items-center gap-1 bg-subtle p-0.5 rounded-lg border border-surface-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewClubs("chart")}
              className={`h-7 px-2 text-xs gap-1 rounded-md ${
                viewClubs === "chart"
                  ? "bg-surface shadow-xs font-semibold text-copy-primary"
                  : "text-copy-muted hover:text-copy-primary"
              }`}
            >
              <BarChart3 className="size-3.5" />
              Chart
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewClubs("table")}
              className={`h-7 px-2 text-xs gap-1 rounded-md ${
                viewClubs === "table"
                  ? "bg-surface shadow-xs font-semibold text-copy-primary"
                  : "text-copy-muted hover:text-copy-primary"
              }`}
            >
              <TableIcon className="size-3.5" />
              Table
            </Button>
          </div>
        </div>

        <div className="pt-6 flex-1 min-h-[260px] flex items-center justify-center">
          {viewClubs === "chart" ? (
            <ChartContainer config={clubsConfig} className="w-full h-[240px]">
              <BarChart data={clubsByStatus} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {clubsByStatus.map((entry) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Club Count</TableHead>
                    <TableHead className="text-right">Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clubsByStatus.map((item) => {
                    const total = clubsByStatus.reduce((acc, c) => acc + c.count, 0);
                    const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : "0.0";
                    return (
                      <TableRow key={item.status}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <span
                            className="size-2.5 rounded-full inline-block"
                            style={{ backgroundColor: item.fill }}
                          />
                          {item.label}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {item.count}
                        </TableCell>
                        <TableCell className="text-right font-mono text-copy-muted">
                          {pct}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* 2. New Memberships per Month */}
      <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div>
            <h3 className="text-sm font-semibold text-copy-primary">
              New Memberships per Month
            </h3>
            <p className="text-xs text-copy-muted">
              Active member onboarding trend in {rangeLabel.toLowerCase()}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-subtle p-0.5 rounded-lg border border-surface-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMembers("chart")}
              className={`h-7 px-2 text-xs gap-1 rounded-md ${
                viewMembers === "chart"
                  ? "bg-surface shadow-xs font-semibold text-copy-primary"
                  : "text-copy-muted hover:text-copy-primary"
              }`}
            >
              <BarChart3 className="size-3.5" />
              Chart
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMembers("table")}
              className={`h-7 px-2 text-xs gap-1 rounded-md ${
                viewMembers === "table"
                  ? "bg-surface shadow-xs font-semibold text-copy-primary"
                  : "text-copy-muted hover:text-copy-primary"
              }`}
            >
              <TableIcon className="size-3.5" />
              Table
            </Button>
          </div>
        </div>

        <div className="pt-6 flex-1 min-h-[260px] flex items-center justify-center">
          {viewMembers === "chart" ? (
            <ChartContainer config={trendConfig} className="w-full h-[240px]">
              <BarChart data={membershipsPerMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--accent-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">New Active Members</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membershipsPerMonth.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-copy-muted">
                        No memberships recorded in this range.
                      </TableCell>
                    </TableRow>
                  ) : (
                    membershipsPerMonth.map((item) => (
                      <TableRow key={item.key}>
                        <TableCell className="font-medium">{item.label}</TableCell>
                        <TableCell className="text-right font-mono">
                          {item.count}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* 3. Events Held per Month */}
      <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div>
            <h3 className="text-sm font-semibold text-copy-primary">
              Events Held per Month
            </h3>
            <p className="text-xs text-copy-muted">
              Completed campus activities in {rangeLabel.toLowerCase()}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-subtle p-0.5 rounded-lg border border-surface-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewEvents("chart")}
              className={`h-7 px-2 text-xs gap-1 rounded-md ${
                viewEvents === "chart"
                  ? "bg-surface shadow-xs font-semibold text-copy-primary"
                  : "text-copy-muted hover:text-copy-primary"
              }`}
            >
              <BarChart3 className="size-3.5" />
              Chart
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewEvents("table")}
              className={`h-7 px-2 text-xs gap-1 rounded-md ${
                viewEvents === "table"
                  ? "bg-surface shadow-xs font-semibold text-copy-primary"
                  : "text-copy-muted hover:text-copy-primary"
              }`}
            >
              <TableIcon className="size-3.5" />
              Table
            </Button>
          </div>
        </div>

        <div className="pt-6 flex-1 min-h-[260px] flex items-center justify-center">
          {viewEvents === "chart" ? (
            <ChartContainer config={eventsConfig} className="w-full h-[240px]">
              <BarChart data={eventsPerMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--state-info)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Completed Events</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventsPerMonth.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-copy-muted">
                        No completed events in this range.
                      </TableCell>
                    </TableRow>
                  ) : (
                    eventsPerMonth.map((item) => (
                      <TableRow key={item.key}>
                        <TableCell className="font-medium">{item.label}</TableCell>
                        <TableCell className="text-right font-mono">
                          {item.count}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* 4. Turnout per Published Election (MVP Skip Note) */}
      <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div>
            <h3 className="text-sm font-semibold text-copy-primary">
              Turnout per Published Election
            </h3>
            <p className="text-xs text-copy-muted">
              Votes cast divided by eligible roster size
            </p>
          </div>
          <div className="flex items-center gap-1 bg-subtle p-0.5 rounded-lg border border-surface-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewElections("chart")}
              className={`h-7 px-2 text-xs gap-1 rounded-md ${
                viewElections === "chart"
                  ? "bg-surface shadow-xs font-semibold text-copy-primary"
                  : "text-copy-muted hover:text-copy-primary"
              }`}
            >
              <BarChart3 className="size-3.5" />
              Chart
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewElections("table")}
              className={`h-7 px-2 text-xs gap-1 rounded-md ${
                viewElections === "table"
                  ? "bg-surface shadow-xs font-semibold text-copy-primary"
                  : "text-copy-muted hover:text-copy-primary"
              }`}
            >
              <TableIcon className="size-3.5" />
              Table
            </Button>
          </div>
        </div>

        <div className="pt-6 flex-1 min-h-[260px] flex items-center justify-center">
          {viewElections === "chart" ? (
            <div className="text-center p-6 space-y-3 max-w-sm">
              <div className="size-12 rounded-xl bg-subtle text-brand flex items-center justify-center mx-auto shadow-inner">
                <Vote className="size-6" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                  <Sparkles className="size-3" />
                  Coming Soon in v2.0
                </div>
                <h4 className="text-xs font-semibold text-copy-primary">
                  Elections Analytics Deferred
                </h4>
                <p className="text-[11px] text-copy-muted leading-relaxed">
                  Turnout metrics and cryptographic voting receipts will activate upon release of the Executive Elections module in v2.0.
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Election Title</TableHead>
                    <TableHead className="text-right">Eligible</TableHead>
                    <TableHead className="text-right">Turnout</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-copy-muted py-6">
                      No published elections. Election module is scheduled for v2.0.
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
