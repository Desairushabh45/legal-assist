import React from 'react'
import ClauseCard from './ClauseCard'

export default function ResultsList({ results = [] }) {
  if (!results || results.length === 0) {
    return (
      <div className="w-full mt-8 p-8 rounded-2xl bg-slate-900/30 border border-dashed border-slate-800 text-center animate-fade-in">
        <p className="text-sm text-slate-400">No clauses identified to display.</p>
      </div>
    )
  }

  // Count risk levels for summary stats
  const riskCounts = results.reduce(
    (acc, item) => {
      const risk = (item.riskLevel || 'medium').toLowerCase()
      if (risk === 'high') acc.high++
      else if (risk === 'medium') acc.medium++
      else if (risk === 'low') acc.low++
      return acc
    },
    { high: 0, medium: 0, low: 0 }
  )

  return (
    <section className="w-full mt-8 sm:mt-10 animate-slide-up" aria-label="Analysis Results">
      {/* Results Header & Summary Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-800/80 gap-3 sm:gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5 flex-wrap">
            <span>Analysis Results</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-800/90 text-slate-300 border border-slate-700/80 shadow-sm">
              {results.length} {results.length === 1 ? 'clause' : 'clauses'} identified
            </span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review potential risks and recommended inquiries for your legal counsel.
          </p>
        </div>

        {/* Risk Breakdown Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            {riskCounts.high} High
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {riskCounts.medium} Medium
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {riskCounts.low} Low
          </span>
        </div>
      </div>

      {/* Responsive Grid: 1 col on mobile & tablet, 2 cols on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {results.map((clause, idx) => (
          <ClauseCard key={idx} clause={clause} />
        ))}
      </div>
    </section>
  )
}
