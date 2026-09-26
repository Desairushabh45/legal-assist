import React, { useState } from 'react'

/**
 * Maps risk level to Tailwind color styles, badges, and labels.
 */
const RISK_CONFIG = {
  low: {
    label: 'Low Risk',
    borderColor: 'border-l-emerald-500',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    iconColor: 'text-emerald-400',
  },
  medium: {
    label: 'Medium Risk',
    borderColor: 'border-l-amber-500',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    iconColor: 'text-amber-400',
  },
  high: {
    label: 'High Risk',
    borderColor: 'border-l-rose-500',
    badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    iconColor: 'text-rose-400',
  },
}

export default function ClauseCard({ clause }) {
  const [copied, setCopied] = useState(false)

  if (!clause) return null

  const { clauseText, riskLevel, explanation, suggestedQuestion } = clause
  const normalizedRisk = (riskLevel || 'medium').toLowerCase()
  const config = RISK_CONFIG[normalizedRisk] || RISK_CONFIG.medium

  const handleCopyClause = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(clauseText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // Fallback ignore if clipboard is unavailable
    }
  }

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-xl bg-slate-900/70 border border-slate-800/80 border-l-4 ${config.borderColor} p-4 sm:p-5 shadow-lg backdrop-blur-sm transition-all duration-300 ease-out hover:border-slate-700 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1`}
    >
      <div>
        {/* Risk Badge and Top Actions */}
        <div className="flex items-center justify-between mb-3.5">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.badgeBg}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                normalizedRisk === 'high'
                  ? 'bg-rose-400 animate-pulse'
                  : normalizedRisk === 'medium'
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
            />
            {config.label}
          </span>

          <button
            type="button"
            onClick={handleCopyClause}
            title="Copy clause text"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent hover:border-slate-700/60 transition-all duration-150"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Clause Excerpt */}
        <div className="mb-4 rounded-lg bg-slate-950/60 border border-slate-800/60 p-3 sm:p-3.5">
          <div className="flex items-start gap-2">
            <svg
              className="w-4 h-4 text-slate-500 shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            <blockquote className="text-xs sm:text-sm font-mono text-slate-300 italic line-clamp-4 leading-relaxed break-words">
              "{clauseText}"
            </blockquote>
          </div>
        </div>

        {/* Explanation */}
        <div className="mb-4">
          <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1.5">
            Analysis & Impact
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed break-words">
            {explanation}
          </p>
        </div>
      </div>

      {/* Suggested Question: Ask your lawyer */}
      {suggestedQuestion && (
        <div className="mt-2 pt-3 border-t border-slate-800/70">
          <div className="flex items-start gap-2.5 rounded-lg bg-indigo-950/20 border border-indigo-500/10 p-3 text-xs">
            <svg
              className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="break-words">
              <span className="font-semibold text-indigo-300 block mb-0.5">
                Ask your lawyer:
              </span>
              <p className="text-slate-300 italic">
                "{suggestedQuestion}"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
