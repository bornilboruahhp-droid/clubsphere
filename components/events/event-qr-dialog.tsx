"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { QrCode, RefreshCw, Copy, Check, ExternalLink, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

interface EventQrDialogProps {
  eventId: string;
  eventTitle: string;
  className?: string;
}

export function EventQrDialog({
  eventId,
  eventTitle,
  className = "",
}: EventQrDialogProps) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [checkinPath, setCheckinPath] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const rotationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCode = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/events/${eventId}/checkin-code`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to load check-in code");
      }

      setToken(json.data.token);
      setCheckinPath(json.data.checkinUrl);
      setCountdown(30);
    } catch (err: any) {
      toast.error(err.message || "Failed to load check-in code.");
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  // When dialog opens, fetch code and setup 30s rotation
  useEffect(() => {
    if (!open) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
      return;
    }

    fetchCode();

    // 1-second countdown ticker
    timerRef.current = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 30));
    }, 1000);

    // 30-second rotation interval
    rotationTimerRef.current = setInterval(() => {
      fetchCode();
    }, 30000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (rotationTimerRef.current) clearInterval(rotationTimerRef.current);
    };
  }, [open, fetchCode]);

  // Construct absolute check-in URL for phone cameras
  const fullUrl =
    typeof window !== "undefined" && checkinPath
      ? `${window.location.origin}${checkinPath}`
      : checkinPath || "";

  const handleCopy = () => {
    if (!fullUrl) return;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success("Check-in link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`border-surface-border hover:bg-subtle text-xs gap-1.5 ${className}`}
        >
          <QrCode className="size-3.5 text-brand" />
          Show Check-in QR
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md text-center p-6 sm:p-8 space-y-6">
        <DialogHeader className="space-y-1.5 text-center sm:text-center">
          <DialogTitle className="text-xl font-bold text-copy-primary">
            Event Self Check-in
          </DialogTitle>
          <DialogDescription className="text-xs text-copy-muted line-clamp-1">
            {eventTitle}
          </DialogDescription>
        </DialogHeader>

        {/* QR Code Container - High Contrast pure black on white */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-5 bg-white rounded-2xl shadow-md border border-neutral-200 inline-flex items-center justify-center">
            {isLoading && !token ? (
              <div className="size-[240px] flex items-center justify-center text-neutral-400">
                <Loader2 className="size-8 animate-spin text-neutral-500" />
              </div>
            ) : fullUrl ? (
              <QRCodeSVG
                value={fullUrl}
                size={240}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="Q"
                marginSize={1}
              />
            ) : (
              <div className="size-[240px] flex items-center justify-center text-neutral-400 text-xs">
                Unable to generate code
              </div>
            )}
          </div>

          {/* Refresh Countdown & Status */}
          <div className="w-full space-y-2 max-w-xs mx-auto">
            <div className="flex items-center justify-between text-xs text-copy-muted">
              <span className="flex items-center gap-1.5">
                <RefreshCw
                  className={`size-3 text-brand ${
                    isLoading ? "animate-spin" : ""
                  }`}
                />
                Rotating code
              </span>
              <span className="font-mono font-medium text-copy-primary">
                Refreshes in {countdown}s
              </span>
            </div>

            {/* Countdown progress bar */}
            <div className="w-full h-1.5 bg-subtle rounded-full overflow-hidden">
              <div
                className="h-full bg-brand transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${(countdown / 30) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Actions & Instructions */}
        <div className="space-y-3 pt-2 border-t border-surface-border text-xs text-copy-secondary">
          <p className="text-copy-muted leading-relaxed">
            Students scan this code with their phone camera to confirm attendance.
            Codes rotate automatically to prevent remote sharing.
          </p>

          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!fullUrl}
              className="border-surface-border text-xs gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-state-success" />
                  Copied Link
                </>
              ) : (
                <>
                  <Copy className="size-3.5 text-copy-muted" />
                  Copy Link
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fetchCode()}
              disabled={isLoading}
              className="text-xs text-copy-muted hover:text-copy-primary gap-1"
            >
              <RefreshCw className="size-3" />
              Refresh Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
