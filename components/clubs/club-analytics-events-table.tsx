import Link from "next/link";
import { Calendar, ArrowRight, CheckCircle2 } from "lucide-react";

import { ClubEventAttendanceItem } from "@/lib/analytics/club";
import { formatDate } from "@/lib/format";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface ClubAnalyticsEventsTableProps {
  events: ClubEventAttendanceItem[];
  clubId: string;
}

export function ClubAnalyticsEventsTable({
  events,
  clubId,
}: ClubAnalyticsEventsTableProps) {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-surface-border">
        <div>
          <h3 className="text-sm font-semibold text-copy-primary">
            Completed Event Performance
          </h3>
          <p className="text-xs text-copy-muted">
            Detailed attendance and conversion breakdown for completed events
          </p>
        </div>
        <span className="text-xs text-copy-muted font-medium">
          {events.length} {events.length === 1 ? "event" : "events"} recorded
        </span>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Title</TableHead>
              <TableHead>Date Held</TableHead>
              <TableHead className="text-right">Registered</TableHead>
              <TableHead className="text-right">Present</TableHead>
              <TableHead className="text-right">Absent</TableHead>
              <TableHead className="text-right">Attendance Rate</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-xs text-copy-muted"
                >
                  No completed events on record for this timeframe.
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-semibold text-copy-primary">
                    <Link
                      href={`/clubs/${clubId}/events/${event.id}`}
                      className="hover:text-brand hover:underline"
                    >
                      {event.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs text-copy-muted whitespace-nowrap">
                    {formatDate(event.date)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {event.registeredCount}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-semibold text-state-success">
                    {event.presentCount}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-state-error">
                    {event.absentCount}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-semibold">
                    {event.attendanceRate !== null
                      ? `${event.attendanceRate.toFixed(1)}%`
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1"
                    >
                      <Link href={`/clubs/${clubId}/events/${event.id}`}>
                        Details
                        <ArrowRight className="size-3" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
