import { Vote, Sparkles } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export function ClubAnalyticsElectionHistory() {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-4 border-b border-surface-border">
        <div>
          <h3 className="text-sm font-semibold text-copy-primary">
            Executive Election History
          </h3>
          <p className="text-xs text-copy-muted">
            Cycle years, certified turnouts, and declared presidential winners
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-semibold self-start sm:self-auto">
          <Sparkles className="size-3" />
          Coming Soon in v2.0
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cycle Year</TableHead>
              <TableHead>Published Date</TableHead>
              <TableHead className="text-right">Eligible Voters</TableHead>
              <TableHead className="text-right">Ballots Cast</TableHead>
              <TableHead className="text-right">Turnout Rate</TableHead>
              <TableHead>President-Elect</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                <div className="max-w-sm mx-auto space-y-2">
                  <div className="size-10 rounded-xl bg-subtle text-brand flex items-center justify-center mx-auto shadow-inner">
                    <Vote className="size-5" />
                  </div>
                  <h4 className="text-xs font-semibold text-copy-primary">
                    No Recorded Election Cycles
                  </h4>
                  <p className="text-[11px] text-copy-muted leading-relaxed">
                    Automated election certified results, secret voter tallies, and presidency transfer archives will populate here in ClubSphere v2.0.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
