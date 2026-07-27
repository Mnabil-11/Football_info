/** Base pulsing block — compose these into shapes that mirror the real content. */
export const SkeletonBox = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-gray-200 dark:bg-gray-800 ${className}`} />
);

/** Mirrors MatchCard's shape: two team placeholders either side of a score/time slot. */
export const SkeletonMatchCard = () => (
  <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <div className="mb-3 flex items-center justify-between">
      <SkeletonBox className="h-3 w-20" />
      <SkeletonBox className="h-3 w-14" />
    </div>
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-1 flex-col items-center gap-2">
        <SkeletonBox className="h-10 w-10 rounded-full" />
        <SkeletonBox className="h-3 w-16" />
      </div>
      <SkeletonBox className="h-6 w-10" />
      <div className="flex flex-1 flex-col items-center gap-2">
        <SkeletonBox className="h-10 w-10 rounded-full" />
        <SkeletonBox className="h-3 w-16" />
      </div>
    </div>
  </div>
);

/** A grid of match-card skeletons, for lists that load several at once. */
export const SkeletonMatchGrid = ({ count = 6 }: { count?: number }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }, (_, i) => (
      <SkeletonMatchCard key={i} />
    ))}
  </div>
);

/** Mirrors a data table: a header row of `cols` cells and `rows` body rows. */
export const SkeletonTable = ({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) => (
  <div className="mt-6 overflow-hidden rounded-xl bg-white shadow-sm dark:bg-gray-900">
    <div className="flex gap-4 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
      {Array.from({ length: cols }, (_, i) => (
        <SkeletonBox key={i} className="h-3 flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }, (_, r) => (
      <div
        key={r}
        className="flex items-center gap-4 border-b border-gray-50 px-4 py-3 last:border-0 dark:border-gray-800"
      >
        {Array.from({ length: cols }, (_, c) => (
          <SkeletonBox key={c} className="h-3 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

/** A stacked list of avatar + text rows, e.g. for favorites or profile lists. */
export const SkeletonList = ({ rows = 4 }: { rows?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }, (_, i) => (
      <div
        key={i}
        className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <SkeletonBox className="h-10 w-10 rounded-full" />
        <SkeletonBox className="h-3 flex-1" />
      </div>
    ))}
  </div>
);
