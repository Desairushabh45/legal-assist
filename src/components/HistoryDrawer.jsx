import React, { useEffect } from 'react'

/**
 * Format a Firestore timestamp or date safely
 */
function formatDate(timestamp) {
  if (!timestamp) return 'Just now'
  try {
    let date
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate()
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000)
    } else {
      date = new Date(timestamp)
    }
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'Recently'
  }
}

export default function HistoryDrawer({
  isOpen,
  onClose,
  history = [],
  isLoading = false,
  onSelectAnalysis,
  onRefresh,
}) {
  // Close on Escape key press for keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent background body scroll when drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
        isOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'
      }`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop with smooth fade transition */}
      <div
        className={`fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex w-full sm:w-auto">
        {/* Slide-in panel: Full screen on mobile (<640px), sidebar on desktop */}
        <div
          className={`w-full sm:w-screen sm:max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col shadow-2xl transition-transform duration-300 ease-out transform ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-md">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-tight">Analysis History</h3>
                <p className="text-xs text-slate-400">
                  {history.length} {history.length === 1 ? 'saved session' : 'saved sessions'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={isLoading}
                  title="Refresh history"
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 active:scale-95 transition-all"
                  aria-label="Refresh history"
                >
                  <svg
                    className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
                aria-label="Close history drawer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading && history.length === 0 && (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-3" />
                <p className="text-xs text-slate-400">Loading your history...</p>
              </div>
            )}

            {!isLoading && history.length === 0 && (
              <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
                <div className="h-14 w-14 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-slate-400 flex items-center justify-center mb-3.5 shadow-inner">
                  <svg className="w-7 h-7 text-indigo-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-slate-200 mb-1">No Past Analyses Yet</h4>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Whenever you analyze a contract or clause, it will be automatically saved here for quick reference.
                </p>
              </div>
            )}

            {history.map((item) => {
              const clauses = item.results || []
              const highRisks = clauses.filter(
                (c) => (c.riskLevel || '').toLowerCase() === 'high'
              ).length

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectAnalysis(item)}
                  className="group relative rounded-xl bg-slate-950/70 border border-slate-800 p-4 transition-all duration-200 hover:border-indigo-500/50 hover:bg-slate-950 hover:shadow-lg hover:shadow-indigo-500/5 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatDate(item.createdAt)}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {highRisks > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          {highRisks} high risk
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
                        {clauses.length} {clauses.length === 1 ? 'clause' : 'clauses'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-sans line-clamp-3 leading-relaxed mb-3 group-hover:text-slate-100 transition-colors break-words">
                    {item.clauseText}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-indigo-400 font-medium group-hover:text-indigo-300">
                    <span className="flex items-center gap-1">
                      Load this analysis
                      <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Drawer Footer */}
          <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/50 text-center text-xs text-slate-500">
            Backed by Firebase Firestore &bull; Real-time sync
          </div>
        </div>
      </div>
    </div>
  )
}
