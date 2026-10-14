"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { computeCountdown, type CountdownParts } from "@/lib/time";

export default function Countdown({
  targetDate,
  viewerZone,
}: {
  targetDate: string | null;
  viewerZone: string;
}) {
  const [parts, setParts] = useState<CountdownParts | null>(() =>
    computeCountdown(targetDate ?? "", viewerZone)
  );

  useEffect(() => {
    if (!targetDate) return;
    const id = setInterval(() => setParts(computeCountdown(targetDate, viewerZone)), 1000);
    return () => clearInterval(id);
  }, [targetDate, viewerZone]);

  if (!targetDate || !parts) {
    return (
      <div className="rounded-xl2 bg-paper shadow-cozy p-5 text-center">
        <div className="text-2xl mb-1">🧳</div>
        <p className="text-sm text-[#3A2E2A]/60 mb-3">No visit planned yet.</p>
        <Link href="/settings" className="text-sm text-minny-text font-medium underline">
          Set the next visit date
        </Link>
      </div>
    );
  }

  if (parts.isPast) {
    return (
      <div className="rounded-xl2 bg-minny-soft shadow-cozy p-5 text-center">
        <div className="text-2xl mb-1">💞</div>
        <p className="text-sm text-minny-text font-medium">
          You&apos;re together (or the date has passed) — update it in settings.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl2 bg-paper shadow-cozy p-5">
      <div className="text-xs uppercase tracking-wide text-[#3A2E2A]/50 text-center mb-2">
        Until we&apos;re together again
      </div>
      <div className="flex justify-center gap-3">
        {[
          { label: "days", value: parts.days },
          { label: "hrs", value: parts.hours },
          { label: "min", value: parts.minutes },
          { label: "sec", value: parts.seconds },
        ].map((unit) => (
          <div key={unit.label} className="flex flex-col items-center min-w-[3.25rem]">
            <span className="text-2xl font-semibold text-minny-text tabular-nums">
              {unit.value}
            </span>
            <span className="text-[10px] uppercase text-[#3A2E2A]/40">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
