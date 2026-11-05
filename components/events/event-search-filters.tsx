"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Filter } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClubOption {
  id: string;
  name: string;
}

interface EventSearchFiltersProps {
  clubs: ClubOption[];
  currentQuery?: string;
  currentClubId?: string;
  currentFrom?: string;
  currentTo?: string;
}

export function EventSearchFilters({
  clubs,
  currentQuery = "",
  currentClubId = "all",
  currentFrom = "",
  currentTo = "",
}: EventSearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(currentQuery);
  const [selectedClub, setSelectedClub] = useState(currentClubId || "all");
  const [fromDate, setFromDate] = useState(currentFrom);
  const [toDate, setToDate] = useState(currentTo);

  const applyFilters = (
    newSearch = search,
    newClub = selectedClub,
    newFrom = fromDate,
    newTo = toDate
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newSearch.trim()) {
      params.set("q", newSearch.trim());
    } else {
      params.delete("q");
    }

    if (newClub && newClub !== "all") {
      params.set("clubId", newClub);
    } else {
      params.delete("clubId");
    }

    if (newFrom) {
      params.set("from", newFrom);
    } else {
      params.delete("from");
    }

    if (newTo) {
      params.set("to", newTo);
    } else {
      params.delete("to");
    }

    startTransition(() => {
      router.push(`/events?${params.toString()}`);
    });
  };

  const handleClear = () => {
    setSearch("");
    setSelectedClub("all");
    setFromDate("");
    setToDate("");
    startTransition(() => {
      router.push("/events");
    });
  };

  const hasActiveFilters = Boolean(
    search.trim() || (selectedClub && selectedClub !== "all") || fromDate || toDate
  );

  return (
    <div className="rounded-2xl border border-surface-border bg-surface p-4 sm:p-5 shadow-xs space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-copy-muted pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                applyFilters(e.currentTarget.value, selectedClub, fromDate, toDate);
              }
            }}
            placeholder="Search events, workshops..."
            className="pl-9 bg-background border-surface-border text-xs sm:text-sm"
          />
        </div>

        {/* Club Dropdown */}
        <div>
          <Select
            value={selectedClub}
            onValueChange={(val) => {
              setSelectedClub(val);
              applyFilters(search, val, fromDate, toDate);
            }}
          >
            <SelectTrigger className="bg-background border-surface-border text-xs sm:text-sm">
              <SelectValue placeholder="All Clubs & Orgs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clubs & Orgs</SelectItem>
              {clubs.map((club) => (
                <SelectItem key={club.id} value={club.id}>
                  {club.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date From */}
        <div>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              applyFilters(search, selectedClub, e.target.value, toDate);
            }}
            className="bg-background border-surface-border text-xs sm:text-sm"
          />
        </div>

        {/* Date To */}
        <div>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              applyFilters(search, selectedClub, fromDate, e.target.value);
            }}
            className="bg-background border-surface-border text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Action Row */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2 text-xs text-copy-muted">
          <Filter className="size-3.5" />
          <span>Filter campus events by host, date, or keywords.</span>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-xs text-copy-muted hover:text-copy-primary gap-1"
            >
              <X className="size-3.5" />
              Reset Filters
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            onClick={() => applyFilters()}
            disabled={isPending}
            className="bg-brand text-white hover:bg-brand/90 text-xs px-4"
          >
            {isPending ? "Filtering..." : "Search"}
          </Button>
        </div>
      </div>
    </div>
  );
}
