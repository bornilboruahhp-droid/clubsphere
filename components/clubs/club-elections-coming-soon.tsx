import { Vote, ShieldCheck, UserCheck, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ClubElectionsComingSoonProps {
  clubId: string;
  isManager: boolean;
}

export function ClubElectionsComingSoon({
  clubId,
  isManager,
}: ClubElectionsComingSoonProps) {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface p-8 sm:p-10 shadow-xs max-w-3xl mx-auto text-center space-y-8">
      {/* Header with Icon and Badge */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-semibold">
          <Sparkles className="size-3.5" />
          Coming Soon in v2.0
        </div>

        <div className="size-16 rounded-2xl bg-subtle text-brand flex items-center justify-center mx-auto shadow-inner mt-2">
          <Vote className="size-8" />
        </div>

        <h3 className="text-2xl font-bold tracking-tight text-copy-primary">
          Executive Elections & Governance
        </h3>
        <p className="text-sm text-copy-secondary max-w-lg mx-auto leading-relaxed">
          ClubSphere v2.0 will introduce institutional-grade, verifiable campus
          elections with automated secret balloting and presidency handovers.
        </p>
      </div>

      {/* Feature Preview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
        <div className="rounded-xl border border-surface-border/80 bg-subtle/40 p-4 space-y-2">
          <div className="size-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
            <UserCheck className="size-4" />
          </div>
          <h4 className="text-xs font-semibold text-copy-primary">
            Candidate Nominations
          </h4>
          <p className="text-[11px] text-copy-muted leading-relaxed">
            Self-service platform nominations with candidate statements and officer approvals.
          </p>
        </div>

        <div className="rounded-xl border border-surface-border/80 bg-subtle/40 p-4 space-y-2">
          <div className="size-8 rounded-lg bg-state-success-dim text-state-success flex items-center justify-center">
            <ShieldCheck className="size-4" />
          </div>
          <h4 className="text-xs font-semibold text-copy-primary">
            Cryptographic Secret Ballots
          </h4>
          <p className="text-[11px] text-copy-muted leading-relaxed">
            One-way anonymized voting tokens ensuring voter privacy and verifiable receipts.
          </p>
        </div>

        <div className="rounded-xl border border-surface-border/80 bg-subtle/40 p-4 space-y-2">
          <div className="size-8 rounded-lg bg-state-info-dim text-state-info flex items-center justify-center">
            <Sparkles className="size-4" />
          </div>
          <h4 className="text-xs font-semibold text-copy-primary">
            Automated Transfers
          </h4>
          <p className="text-[11px] text-copy-muted leading-relaxed">
            Certified tallying with atomic presidency transfers and annual cycle archival.
          </p>
        </div>
      </div>

      {/* Notice & Direct Action */}
      <div className="pt-4 border-t border-surface-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-copy-muted">
        <span>
          Current executive roles and officer assignments are managed directly via the{" "}
          <strong className="text-copy-primary">Members</strong> roster.
        </span>

        <Button asChild variant="outline" size="sm" className="border-surface-border shrink-0 text-xs gap-1.5">
          <Link href={`/clubs/${clubId}?tab=members`}>
            Manage Roster
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
