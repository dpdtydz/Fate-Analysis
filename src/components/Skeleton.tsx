import React from "react";

export function Skeleton({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-ink/10 dark:bg-white/10 ${className}`}
      {...props}
    />
  );
}

/**
 * RoomView Skeleton: Displays matching wireframe of RoomView while fetching room & members
 */
export function RoomViewSkeleton() {
  return (
    <div className="min-h-screen bg-paper text-ink transition-colors pb-safe">
      <div className="max-w-md mx-auto px-4 py-4 space-y-5 animate-fade-in">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-5 w-32 rounded-lg" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>

        {/* Hero: Group Soul & Cohesion Card */}
        <div className="w-full bg-surface border border-line rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="w-2 h-2 rounded-full" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          <div className="flex flex-col items-center py-2 space-y-3">
            <Skeleton className="w-24 h-24 rounded-full" />
            <Skeleton className="h-6 w-44 rounded-lg" />
            <Skeleton className="h-3.5 w-60 rounded-md" />
          </div>

          <div className="space-y-2 pt-2 border-t border-line/60">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3.5 w-20 rounded" />
              <Skeleton className="h-4 w-12 rounded" />
            </div>
            <Skeleton className="h-2.5 w-full rounded-full" />
          </div>

          {/* 5 Elements Distribution Pills */}
          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Primary Action Button (View Chemistry) */}
        <Skeleton className="h-14 w-full rounded-2xl" />

        {/* Invite & Share Action Bar */}
        <div className="bg-surface border border-line p-4 rounded-2xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-24 rounded font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" />
          </div>
        </div>

        {/* Member Grid Section */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-28 rounded-lg" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 bg-surface border border-line rounded-xl flex flex-col items-center justify-center text-center space-y-2.5 shadow-2xs"
              >
                <Skeleton className="w-12 h-12 rounded-full" />
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * GroupView Skeleton: Displays matching wireframe for the full Group Harmony & Matrix screen
 */
export function GroupViewSkeleton() {
  return (
    <div className="min-h-screen bg-paper text-ink transition-colors pb-safe">
      <div className="max-w-md mx-auto px-4 py-4 space-y-5 animate-fade-in">
        {/* Top Header */}
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-5 w-36 rounded-lg" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-7 w-28 rounded-lg" />
          <div className="flex gap-1.5">
            <Skeleton className="h-7 w-24 rounded-xl" />
            <Skeleton className="h-7 w-20 rounded-xl" />
          </div>
        </div>

        {/* Hero Group Soul Card & Geometric Emblem */}
        <div className="w-full bg-[#FAF8F5] dark:bg-[#1A1A1E] rounded-3xl p-5 border border-amber-900/10 dark:border-line space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          <div className="flex flex-col items-center py-4 space-y-3">
            <Skeleton className="w-24 h-24 rounded-2xl" />
            <Skeleton className="h-7 w-48 rounded-lg" />
            <Skeleton className="h-4 w-64 rounded-md" />
          </div>

          {/* Group Metrics Bars */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-line/60">
            {[0, 1, 2].map((i) => (
              <div key={i} className="p-2.5 bg-surface rounded-xl flex flex-col items-center space-y-1.5">
                <Skeleton className="h-3 w-12 rounded" />
                <Skeleton className="h-5 w-10 rounded font-mono" />
              </div>
            ))}
          </div>
        </div>

        {/* Story Share CTA Banner */}
        <div className="bg-surface border border-line p-5 rounded-2xl space-y-3 text-center shadow-xs">
          <Skeleton className="h-4 w-40 mx-auto rounded" />
          <Skeleton className="h-3 w-64 mx-auto rounded" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>

        {/* Group Awards Podium Skeleton */}
        <div className="bg-surface border border-line p-5 rounded-xl space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-36 rounded-lg" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="p-3 bg-sunken rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-6 h-6 rounded-full" />
                  <Skeleton className="h-4 w-14 rounded" />
                </div>
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* 1:1 Chemistry Section Skeleton */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32 rounded-lg" />
            <Skeleton className="h-8 w-32 rounded-xl" />
          </div>
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="p-4 bg-surface border border-line rounded-xl space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="h-4 w-16 rounded" />
                    <span className="text-ink-faint text-xs">×</span>
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="h-4 w-16 rounded" />
                  </div>
                  <Skeleton className="h-6 w-14 rounded-full" />
                </div>
                <Skeleton className="h-3 w-48 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * MeView / MySajuView Skeleton: Displays matching wireframe for the personal Saju analysis
 */
export function MeViewSkeleton() {
  return (
    <div className="min-h-screen bg-paper text-ink transition-colors pb-safe">
      <div className="max-w-md mx-auto px-4 py-4 space-y-5 animate-fade-in">
        {/* Top Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-lg" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 bg-sunken p-1 rounded-xl">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>

        {/* Profile Identity Card */}
        <div className="bg-surface border border-line rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 rounded-full shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-24 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-36 rounded" />
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap pt-1">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-6 w-20 rounded-full" />
            ))}
          </div>
        </div>

        {/* 4 Pillars Table (만세력 사주 원국) Skeleton */}
        <div className="bg-surface border border-line rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {["시주", "일주", "월주", "년주"].map((col) => (
              <div key={col} className="space-y-1.5">
                <Skeleton className="h-5 w-full rounded bg-sunken" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-4 w-full rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* 5 Elements Balance Skeleton */}
        <div className="bg-surface border border-line rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-12 rounded" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
          <div className="grid grid-cols-5 gap-1 pt-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-7 rounded-lg" />
            ))}
          </div>
        </div>

        {/* AI In-depth Interpretation Card Skeleton */}
        <div className="bg-surface border border-line rounded-2xl p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="w-5 h-5 rounded-full" />
              <Skeleton className="h-5 w-36 rounded-md" />
            </div>
            <Skeleton className="h-4 w-14 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-[90%] rounded" />
          <Skeleton className="h-4 w-[75%] rounded" />
          <div className="p-3 bg-sunken rounded-xl space-y-2 mt-2">
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-3.5 w-full rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Generic Screen Fallback Skeleton for Suspense routes
 */
export function ScreenSkeleton() {
  return (
    <div className="min-h-screen bg-paper text-ink transition-colors pb-safe">
      <div className="max-w-md mx-auto px-4 py-6 space-y-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-5 w-32 rounded-lg" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
        <Skeleton className="h-44 w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-36 w-full rounded-2xl" />
      </div>
    </div>
  );
}
