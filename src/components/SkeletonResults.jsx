import React from 'react'

export default function SkeletonResults() {
  return (
    <section className="w-full mt-8 sm:mt-10 animate-fade-in" aria-label="Loading analysis">
      {/* Active Processing Indicator Banner */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-indigo-950/40 border border-indigo-500/25 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-indigo-950/20">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3.5 w-3.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-indigo-500"></span>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-slate-100 flex items-center gap-2">
              Gemini AI is analyzing your contract...
            </p>
            <p className="text-[11px] sm:text-xs text-slate-400">
              Identifying key clauses, evaluating liability thresholds, and drafting counsel queries.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/25">
            <svg className="w-3 h-3 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
            </svg>
            Processing
          </span>
        </div>
      </div>

      {/* Shimmering Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-800/80 gap-3">
        <div className="space-y-2">
          <div className="h-6 w-48 rounded-lg shimmer-box" />
          <div className="h-3 w-64 rounded shimmer-box" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-18 rounded-lg shimmer-box" />
          <div className="h-6 w-20 rounded-lg shimmer-box" />
          <div className="h-6 w-16 rounded-lg shimmer-box" />
        </div>
      </div>

      {/* Shimmering ClauseCard Grid: stacked on mobile, 2 cols on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[1, 2].map((id) => (
          <div
            key={id}
            className="flex flex-col justify-between rounded-xl bg-slate-900/60 border border-slate-800/80 border-l-4 border-l-indigo-500/30 p-5 shadow-lg backdrop-blur-sm space-y-4"
          >
            <div>
              {/* Badge placeholder */}
              <div className="flex items-center justify-between mb-4">
                <div className="h-5 w-24 rounded-full shimmer-box" />
              </div>

              {/* Clause excerpt placeholder */}
              <div className="rounded-lg bg-slate-950/70 border border-slate-800/60 p-3.5 space-y-2 mb-4">
                <div className="h-3.5 w-full rounded shimmer-box" />
                <div className="h-3.5 w-4/5 rounded shimmer-box" />
              </div>

              {/* Explanation lines */}
              <div className="space-y-2.5 mb-4">
                <div className="h-3 w-32 rounded shimmer-box" />
                <div className="h-3.5 w-full rounded shimmer-box" />
                <div className="h-3.5 w-11/12 rounded shimmer-box" />
                <div className="h-3.5 w-3/4 rounded shimmer-box" />
              </div>
            </div>

            {/* Suggested question callout placeholder */}
            <div className="pt-3 border-t border-slate-800/70">
              <div className="rounded-lg bg-indigo-950/20 border border-indigo-500/10 p-3 space-y-2">
                <div className="h-3 w-28 rounded shimmer-box" />
                <div className="h-3.5 w-5/6 rounded shimmer-box" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
