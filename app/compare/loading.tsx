export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Skeleton */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />

          <div className="grid grid-cols-2 gap-8">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mb-2" />
              <div className="h-5 w-40 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mb-2" />
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mb-2" />
              <div className="h-5 w-40 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mb-2" />
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Classification Skeleton */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto mb-4" />
          <div className="flex items-center justify-center gap-4">
            <div className="w-32 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="w-32 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          </div>
        </section>

        {/* Scores Grid Skeleton */}
        <section>
          <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3" />
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <div className="h-3 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-3 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  </div>
                  <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <div className="h-3 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-3 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tasks Summary Skeleton */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div>
              <div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </section>

        {/* KPIs Skeleton */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
          <div className="grid grid-cols-2 gap-8">
            {[0, 1].map((col) => (
              <div key={col}>
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3" />
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i}>
                      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
                      <div className="space-y-1">
                        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
