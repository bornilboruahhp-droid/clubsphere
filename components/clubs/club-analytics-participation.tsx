import { UserCheck, Award, Users, AlertCircle } from "lucide-react";
import { ParticipationDistribution } from "@/lib/analytics/club";

interface ClubAnalyticsParticipationProps {
  distribution: ParticipationDistribution;
  rangeLabel: string;
}

export function ClubAnalyticsParticipation({
  distribution,
  rangeLabel,
}: ClubAnalyticsParticipationProps) {
  const { zeroEvents, oneToTwoEvents, threePlusEvents, totalActiveMembers } =
    distribution;

  const pctZero =
    totalActiveMembers > 0
      ? ((zeroEvents / totalActiveMembers) * 100).toFixed(1)
      : "0.0";
  const pctOneTwo =
    totalActiveMembers > 0
      ? ((oneToTwoEvents / totalActiveMembers) * 100).toFixed(1)
      : "0.0";
  const pctThreePlus =
    totalActiveMembers > 0
      ? ((threePlusEvents / totalActiveMembers) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-4 border-b border-surface-border">
        <div>
          <h3 className="text-sm font-semibold text-copy-primary">
            Member Participation Distribution
          </h3>
          <p className="text-xs text-copy-muted">
            Aggregated member engagement tiers across completed events in {rangeLabel.toLowerCase()}
          </p>
        </div>
        <span className="text-xs text-copy-muted font-medium">
          {totalActiveMembers} total active members
        </span>
      </div>

      {totalActiveMembers === 0 ? (
        <div className="text-center py-8 text-xs text-copy-muted">
          No active members in this organization yet.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Visual Multi-segment Bar */}
          <div className="space-y-1.5">
            <div className="h-3 w-full bg-subtle rounded-full overflow-hidden flex">
              <div
                style={{ width: `${pctThreePlus}%` }}
                className="bg-state-success h-full transition-all"
                title={`Highly Active (3+ events): ${pctThreePlus}%`}
              />
              <div
                style={{ width: `${pctOneTwo}%` }}
                className="bg-brand h-full transition-all"
                title={`Moderate (1-2 events): ${pctOneTwo}%`}
              />
              <div
                style={{ width: `${pctZero}%` }}
                className="bg-surface-border h-full transition-all"
                title={`No Events Attended: ${pctZero}%`}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-copy-muted">
              <span>0%</span>
              <span>100% active membership</span>
            </div>
          </div>

          {/* 3 Tier Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Highly Active (3+ events) */}
            <div className="rounded-xl border border-surface-border p-4 bg-subtle/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-copy-primary">
                  3 or More Events
                </span>
                <div className="size-6 rounded-md bg-state-success-dim text-state-success flex items-center justify-center">
                  <Award className="size-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight text-copy-primary font-mono">
                {threePlusEvents}
              </div>
              <p className="text-[11px] text-copy-muted">
                {pctThreePlus}% of active members (Highly Active)
              </p>
            </div>

            {/* Moderate (1-2 events) */}
            <div className="rounded-xl border border-surface-border p-4 bg-subtle/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-copy-primary">
                  1 to 2 Events
                </span>
                <div className="size-6 rounded-md bg-brand/10 text-brand flex items-center justify-center">
                  <UserCheck className="size-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight text-copy-primary font-mono">
                {oneToTwoEvents}
              </div>
              <p className="text-[11px] text-copy-muted">
                {pctOneTwo}% of active members (Moderate)
              </p>
            </div>

            {/* Zero Events */}
            <div className="rounded-xl border border-surface-border p-4 bg-subtle/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-copy-primary">
                  0 Events Attended
                </span>
                <div className="size-6 rounded-md bg-subtle text-copy-muted flex items-center justify-center">
                  <AlertCircle className="size-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight text-copy-primary font-mono">
                {zeroEvents}
              </div>
              <p className="text-[11px] text-copy-muted">
                {pctZero}% of active members (Unengaged)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
