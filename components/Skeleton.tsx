"use client";

import { ReactNode } from "react";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    />
  );
}

export function SkeletonText({ className = "" }: SkeletonProps) {
  return <Skeleton className={`h-4 ${className}`} />;
}

export function SkeletonCard({ children }: { children?: ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      {children}
    </div>
  );
}

// Score card skeleton
export function ScoreCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
      <Skeleton className="h-4 w-20 mb-2" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-2 w-full mb-2" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

// Assessment list item skeleton
export function AssessmentItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="w-5 h-5" />
    </div>
  );
}

// Report page header skeleton
export function ReportHeaderSkeleton() {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
      </div>
    </header>
  );
}

// Scores grid skeleton
export function ScoresGridSkeleton() {
  return (
    <section>
      <Skeleton className="h-6 w-40 mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ScoreCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

// Section skeleton with title and list items
export function SectionSkeleton({ items = 4 }: { items?: number }) {
  return (
    <SkeletonCard>
      <Skeleton className="h-6 w-48 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: items }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </SkeletonCard>
  );
}

// Full report page skeleton
export function ReportPageSkeleton() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ReportHeaderSkeleton />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <ScoresGridSkeleton />
        <SectionSkeleton items={4} />
        <SectionSkeleton items={6} />
        <SectionSkeleton items={3} />
        <SectionSkeleton items={5} />
      </div>
    </main>
  );
}

// Home page recent assessments skeleton
export function RecentAssessmentsSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <Skeleton className="h-6 w-40 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <AssessmentItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// Task table skeleton
export function TaskTableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {["ID", "Name", "Type", "Confidence", "Citations"].map((header) => (
              <th
                key={header}
                className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr
              key={i}
              className="border-b border-gray-100 dark:border-gray-700/50"
            >
              <td className="py-3 px-4">
                <Skeleton className="h-4 w-16" />
              </td>
              <td className="py-3 px-4">
                <Skeleton className="h-4 w-32" />
              </td>
              <td className="py-3 px-4">
                <Skeleton className="h-6 w-20 rounded-full" />
              </td>
              <td className="py-3 px-4">
                <Skeleton className="h-4 w-12" />
              </td>
              <td className="py-3 px-4">
                <Skeleton className="h-4 w-24" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
