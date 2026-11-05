import { Metadata } from "next";
import { notFound } from "next/navigation";
import { History, CheckCircle2, XCircle, Clock } from "lucide-react";

import { requireUser } from "@/lib/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { getReviewQueue, getDecidedReviews } from "@/lib/data/reviews";
import { ReviewQueue } from "@/components/clubs/review-queue";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Review Queue | ClubSphere",
  description: "Evaluate and decide on pending student organization charter submissions",
};

export default async function ReviewsPage() {
  const user = await requireUser();

  if (user.role !== "ADVISOR" && user.role !== "ADMIN") {
    notFound();
  }

  const role = user.role as "ADVISOR" | "ADMIN";
  const queue = await getReviewQueue(user);
  const history = await getDecidedReviews(user, 20);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Review Queue"
        description={
          role === "ADVISOR"
            ? "Inspect student proposals requesting your faculty sponsorship and academic endorsement."
            : "Perform campus governance reviews and charter decisions for student organizations."
        }
      />

      {/* Main Review Queue */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-copy-primary flex items-center gap-2">
            <Clock className="size-4 text-brand" />
            Pending Proposals ({queue.length})
          </h2>
        </div>

        <ReviewQueue clubs={queue} role={role} />
      </section>

      {/* Decision History */}
      <section className="space-y-4 pt-6 border-t border-surface-border">
        <div className="flex items-center gap-2">
          <History className="size-4 text-copy-muted" />
          <h2 className="text-base font-semibold text-copy-primary">
            Recently Decided Reviews
          </h2>
        </div>

        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surface-border bg-surface/30 p-8 text-center text-xs text-copy-muted">
            You haven't recorded any review decisions yet. Completed reviews will be logged here.
          </div>
        ) : (
          <div className="rounded-2xl border border-surface-border bg-surface overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-subtle/50">
                <TableRow className="border-surface-border hover:bg-transparent">
                  <TableHead className="font-semibold text-xs text-copy-primary">
                    Club Organization
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-copy-primary">
                    Stage
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-copy-primary">
                    Decision
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-copy-primary">
                    Decided On
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-copy-primary">
                    Reviewer Comment
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-surface-border">
                {history.map((h) => (
                  <TableRow
                    key={h.id}
                    className="border-surface-border hover:bg-subtle/40 transition-colors"
                  >
                    <TableCell className="font-medium text-xs text-copy-primary py-3.5">
                      {h.club.name}
                    </TableCell>

                    <TableCell className="text-xs text-copy-secondary py-3.5">
                      {h.stage === "ADVISOR" ? "Advisor Review" : "Admin Review"}
                    </TableCell>

                    <TableCell className="py-3.5">
                      {h.decision === "APPROVED" ? (
                        <Badge
                          variant="outline"
                          className="bg-state-success-dim text-state-success border-state-success/30 text-[11px] font-medium"
                        >
                          <CheckCircle2 className="size-3 mr-1" />
                          Approved
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-state-error-dim text-state-error border-state-error/30 text-[11px] font-medium"
                        >
                          <XCircle className="size-3 mr-1" />
                          Rejected
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-copy-muted font-mono py-3.5">
                      {h.decidedAt ? formatDateTime(h.decidedAt) : "—"}
                    </TableCell>

                    <TableCell className="text-xs text-copy-secondary py-3.5 max-w-sm truncate italic">
                      {h.comment || "No comment provided"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
