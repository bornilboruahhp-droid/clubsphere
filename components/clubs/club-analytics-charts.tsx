"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { BarChart3, Table as TableIcon } from "lucide-react";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
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
  ClubMemberTrendItem,
  ClubEventAttendanceItem,
} from "@/lib/analytics/club";
import { formatDate } from "@/lib/format";

interface ClubAnalyticsChartsProps {
  membersOverTime: ClubMemberTrendItem[];
  eventAttendance: ClubEventAttendanceItem[];
  rangeLabel: string;
}

export function ClubAnalyticsCharts({
  membersOverTime,
  eventAttendance,
  rangeLabel,
}: ClubAnalyticsChartsProps) {
  const [viewMembers, setViewMembers] = useState<"chart" | "table">("chart");
  const [viewAttendance, setViewAttendance] = useState<"chart" | "table">("chart");

  const memberConfig: ChartConfig = {
    count: { label: "New Members", color: "var(--accent-primary)" },
  };

  const attendanceConfig: ChartConfig = {
    registeredCount: { label: "Registered", color: "var(--state-info)" },
    presentCount: { label: "Present", color: "var(--state-success)" },
  };

  // Truncate long event titles for clean chart display
  const chartEventData = eventAttendance.map((e) => ({
    ...e,
    shortTitle: e.title.length > 16 ? `${e.title.slice(0, 14)}…` : e.title,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Members Over Time */}
      <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div>
            <h3 className="text-sm font-semibold text-copy-primary">
              Members Over Time
            </h3>
            <p className="text-xs text-copy-muted">
              Monthly active member acquisitions in {rangeLabel.toLowerCase()}
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
            <ChartContainer config={memberConfig} className="w-full h-[240px]">
              <BarChart
                data={membersOverTime}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="var(--accent-primary)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">New Members</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membersOverTime.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-copy-muted py-6">
                        No new memberships recorded in this range.
                      </TableCell>
                    </TableRow>
                  ) : (
                    membersOverTime.map((item) => (
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

      {/* 2. Attendance per Event (Registered vs Present) */}
      <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div>
            <h3 className="text-sm font-semibold text-copy-primary">
              Attendance per Event
            </h3>
            <p className="text-xs text-copy-muted">
              Registrations vs confirmed attendees in {rangeLabel.toLowerCase()}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-subtle p-0.5 rounded-lg border border-surface-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewAttendance("chart")}
              className={`h-7 px-2 text-xs gap-1 rounded-md ${
                viewAttendance === "chart"
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
              onClick={() => setViewAttendance("table")}
              className={`h-7 px-2 text-xs gap-1 rounded-md ${
                viewAttendance === "table"
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
          {viewAttendance === "chart" ? (
            chartEventData.length === 0 ? (
              <div className="text-center py-8 text-xs text-copy-muted">
                No completed events in this timeframe.
              </div>
            ) : (
              <ChartContainer config={attendanceConfig} className="w-full h-[240px]">
                <BarChart
                  data={chartEventData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="shortTitle" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="registeredCount"
                    fill="var(--state-info)"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="presentCount"
                    fill="var(--state-success)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )
          ) : (
            <div className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead className="text-right">Registered</TableHead>
                    <TableHead className="text-right">Present</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventAttendance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-copy-muted py-6">
                        No completed events recorded in this range.
                      </TableCell>
                    </TableRow>
                  ) : (
                    eventAttendance.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium truncate max-w-[140px]">
                          {item.title}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {item.registeredCount}
                        </TableCell>
                        <TableCell className="text-right font-mono text-state-success font-semibold">
                          {item.presentCount}
                        </TableCell>
                        <TableCell className="text-right font-mono text-copy-muted">
                          {item.attendanceRate !== null
                            ? `${item.attendanceRate.toFixed(1)}%`
                            : "N/A"}
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
    </div>
  );
}
