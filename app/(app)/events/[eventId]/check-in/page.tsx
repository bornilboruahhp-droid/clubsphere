"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Calendar,
  ArrowRight,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";

interface CheckInPageProps {
  params: Promise<{
    eventId: string;
  }>;
  searchParams: Promise<{
    t?: string;
  }>;
}

type CheckInState =
  | { status: "IDLE" | "LOADING" }
  | {
      status: "SUCCESS";
      eventTitle: string;
      checkedInAt: string;
    }
  | {
      status: "ALREADY_CHECKED_IN";
      eventTitle: string;
      checkedInAt?: string;
    }
  | {
      status: "NOT_REGISTERED";
      message: string;
    }
  | {
      status: "ERROR";
      message: string;
    };

export default function StudentCheckInPage({
  params,
  searchParams,
}: CheckInPageProps) {
  const { eventId } = use(params);
  const { t: token } = use(searchParams);

  const [state, setState] = useState<CheckInState>({ status: "LOADING" });

  useEffect(() => {
    if (!token) {
      setState({
        status: "ERROR",
        message:
          "Missing check-in token. Please scan the QR code displayed at the event to check in.",
      });
      return;
    }

    let isMounted = true;

    async function performCheckIn() {
      try {
        const res = await fetch(`/api/events/${eventId}/check-in`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!isMounted) return;

        if (res.ok) {
          if (data.data?.alreadyCheckedIn) {
            setState({
              status: "ALREADY_CHECKED_IN",
              eventTitle: data.data.eventTitle,
              checkedInAt: data.data.checkedInAt,
            });
          } else {
            setState({
              status: "SUCCESS",
              eventTitle: data.data.eventTitle,
              checkedInAt: data.data.checkedInAt,
            });
          }
        } else {
          // Check for 409 Conflict indicating registration required
          if (
            res.status === 409 &&
            data.error?.message?.toLowerCase().includes("register")
          ) {
            setState({
              status: "NOT_REGISTERED",
              message:
                data.error?.message ||
                "You must register for this event before checking in.",
            });
          } else {
            setState({
              status: "ERROR",
              message:
                data.error?.message ||
                "This check-in code has expired or is invalid. Please scan the current code displayed on the screen.",
            });
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        setState({
          status: "ERROR",
          message:
            err.message ||
            "An unexpected network error occurred while recording attendance.",
        });
      }
    }

    performCheckIn();

    return () => {
      isMounted = false;
    };
  }, [eventId, token]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 shadow-xs text-center space-y-6">
        {/* Loading State */}
        {state.status === "LOADING" && (
          <div className="py-8 space-y-4">
            <Loader2 className="size-12 animate-spin text-brand mx-auto" />
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-copy-primary">
                Verifying Attendance...
              </h2>
              <p className="text-xs text-copy-muted">
                Communicating with campus servers to record your check-in.
              </p>
            </div>
          </div>
        )}

        {/* Success State */}
        {state.status === "SUCCESS" && (
          <div className="space-y-5">
            <div className="size-16 rounded-full bg-state-success-dim text-state-success flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-copy-primary">
                Check-in Confirmed!
              </h2>
              <p className="text-sm font-semibold text-brand">
                {state.eventTitle}
              </p>
              <p className="text-xs text-copy-muted">
                Your attendance has been successfully recorded on {formatDateTime(state.checkedInAt)}.
              </p>
            </div>

            <div className="pt-2">
              <Button asChild className="w-full bg-brand text-white hover:bg-brand/90">
                <Link href={`/events/${eventId}`}>
                  View Event Details
                  <ArrowRight className="size-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Already Checked In */}
        {state.status === "ALREADY_CHECKED_IN" && (
          <div className="space-y-5">
            <div className="size-16 rounded-full bg-state-info-dim text-state-info flex items-center justify-center mx-auto">
              <Info className="size-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-copy-primary">
                Already Checked In
              </h2>
              <p className="text-sm font-semibold text-brand">
                {state.eventTitle}
              </p>
              <p className="text-xs text-copy-muted">
                Your attendance for this session was already recorded. You are all set!
              </p>
            </div>

            <div className="pt-2">
              <Button asChild variant="outline" className="w-full border-surface-border">
                <Link href={`/events/${eventId}`}>
                  Go to Event Page
                  <ArrowRight className="size-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Not Registered */}
        {state.status === "NOT_REGISTERED" && (
          <div className="space-y-5">
            <div className="size-16 rounded-full bg-state-warning-dim text-state-warning flex items-center justify-center mx-auto">
              <AlertCircle className="size-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-copy-primary">
                Registration Required
              </h2>
              <p className="text-xs text-copy-muted leading-relaxed">
                {state.message}
              </p>
            </div>

            <div className="pt-2">
              <Button asChild className="w-full bg-brand text-white hover:bg-brand/90">
                <Link href={`/events/${eventId}`}>
                  Register for This Event
                  <ArrowRight className="size-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Expired / Error */}
        {state.status === "ERROR" && (
          <div className="space-y-5">
            <div className="size-16 rounded-full bg-state-error-dim text-state-error flex items-center justify-center mx-auto">
              <XCircle className="size-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-copy-primary">
                Check-in Failed
              </h2>
              <p className="text-xs text-copy-muted leading-relaxed">
                {state.message}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Button asChild variant="outline" className="w-full border-surface-border">
                <Link href={`/events/${eventId}`}>
                  Go to Event Page
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full text-copy-muted text-xs">
                <Link href="/events">
                  Browse Campus Events
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
