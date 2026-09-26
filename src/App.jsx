import { useState, useEffect } from 'react'
import {
  analyzeClause,
  getDemoAnalysis,
  getGeminiApiKey,
  setGeminiApiKey,
} from './services/geminiService'
import { signInAnon, onAuthChange } from './services/authService'
import { saveAnalysis, getUserAnalyses } from './services/firestoreService'
import ResultsList from './components/ResultsList'
import HistoryDrawer from './components/HistoryDrawer'
import SkeletonResults from './components/SkeletonResults'
import ApiKeyModal from './components/ApiKeyModal'

/**
 * Pre-populated demo clauses to make first-load state interactive and demo-friendly
 */
const SAMPLE_CLAUSES = [
  {
    title: 'Indemnity & Liability',
    text: 'Each party shall defend, indemnify, and hold harmless the other party and its affiliates from and against any and all claims, liabilities, losses, damages, and reasonable attorney fees arising out of any breach of this agreement, without any limitation or financial cap whatsoever.',
  },
  {
    title: 'Non-Compete',
    text: 'For a period of twenty-four (24) months following termination of employment for any reason, Employee shall not directly or indirectly engage in, manage, operate, or be employed by any business that provides products or services competitive with Employer anywhere worldwide.',
  },
  {
    title: 'Confidentiality & IP',
    text: 'All proprietary information disclosed under this agreement shall remain confidential indefinitely. Any intellectual property, inventions, or works conceived by Contractor during the term shall automatically become the sole property of Company without further compensation.',
  },
]

/**
 * Transforms technical or raw API errors into clear, friendly guidance for users
 */
function formatUserFriendlyError(error) {
  if (!error) {
    return {
      title: 'Analysis Error',
      message: 'An unexpected issue occurred while analyzing the text. Please try again.',
    }
  }

  const msg = typeof error === 'string' ? error : error.message || String(error)
  const lower = msg.toLowerCase()

  if (
    lower.includes('api key') ||
    lower.includes('api_key_invalid') ||
    lower.includes('not configured') ||
    lower.includes('401') ||
    lower.includes('403')
  ) {
    return {
      title: 'Gemini API Key Required',
      message:
        'The Google Gemini API key is missing or invalid. Please configure your key or click "Try Demo" below to see a simulated analysis.',
    }
  }

  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network') ||
    lower.includes('enotfound') ||
    lower.includes('timeout')
  ) {
    return {
      title: 'Connection Issue',
      message:
        'Could not connect to Google Gemini API. Please check your network connection and try again.',
    }
  }

  if (
    lower.includes('429') ||
    lower.includes('resource_exhausted') ||
    lower.includes('quota') ||
    lower.includes('rate limit')
  ) {
    return {
      title: 'Service Temporarily Busy',
      message:
        'Gemini rate limits were reached. Please wait a few moments and click Try again.',
    }
  }

  if (
    lower.includes('parse') ||
    lower.includes('json') ||
    lower.includes('invalid format') ||
    lower.includes('response as json') ||
    lower.includes('unexpected token')
  ) {
    return {
      title: 'Formatting Issue',
      message:
        'The AI response could not be parsed into legal clauses. Please click Try again to re-analyze.',
    }
  }

  return {
    title: 'Analysis Failed',
    message:
      msg.length > 200
        ? 'An error occurred during clause analysis. Please try again or simplify your input.'
        : msg,
  }
}

export default function App() {
  const [contractText, setContractText] = useState('')
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Gemini API Key State & Modal
  const [hasApiKey, setHasApiKey] = useState(() => Boolean(getGeminiApiKey()))
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false)

  // Authentication & History State
  const [currentUser, setCurrentUser] = useState(null)
  const [history, setHistory] = useState([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')

  const fetchHistory = async (uid) => {
    if (!uid) return
    setIsHistoryLoading(true)
    try {
      const analyses = await getUserAnalyses(uid)
      setHistory(analyses)
    } catch (err) {
      console.warn('Could not load user analyses:', err.message)
    } finally {
      setIsHistoryLoading(false)
    }
  }

  // Sign in anonymously on mount and listen to auth changes
  useEffect(() => {
    let isMounted = true

    const unsubscribe = onAuthChange(async (user) => {
      if (!isMounted) return
      setCurrentUser(user)
      if (user?.uid) {
        fetchHistory(user.uid)
      } else {
        fetchHistory('demo-local-user')
      }
    })

    // Initiate anonymous sign-in
    signInAnon().catch((err) => {
      console.warn('Anonymous sign-in could not be completed:', err.message)
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const handleSaveApiKey = (key) => {
    setGeminiApiKey(key)
    setHasApiKey(Boolean(key && key.trim()))
    if (key && key.trim()) {
      setErrorMessage('')
    }
  }

  const handleRunDemo = (sampleOverrideText = null) => {
    const textToAnalyze =
      (typeof sampleOverrideText === 'string' ? sampleOverrideText : contractText).trim() ||
      SAMPLE_CLAUSES[0].text

    setContractText(textToAnalyze)
    setErrorMessage('')
    setSaveStatus('')
    setIsLoading(true)

    setTimeout(async () => {
      const demoResults = getDemoAnalysis(textToAnalyze)
      setResults(demoResults)
      setIsLoading(false)

      const uid = currentUser?.uid || 'demo-local-user'
      try {
        await saveAnalysis(uid, textToAnalyze, demoResults)
        setSaveStatus('Demo analysis complete (Saved to history)')
        await fetchHistory(uid)
      } catch (err) {
        console.warn('Could not auto-save analysis:', err.message)
      }
    }, 600)
  }

  const handleAnalyze = async () => {
    if (!contractText.trim()) {
      setErrorMessage('Please paste a contract or clause before analyzing.')
      return
    }

    if (!getGeminiApiKey()) {
      setErrorMessage(
        'Gemini API key is not configured. Please configure your key or click "Try Demo" below to see a simulated analysis.'
      )
      return
    }

    setErrorMessage('')
    setSaveStatus('')
    setIsLoading(true)

    try {
      const parsedResults = await analyzeClause(contractText)
      setResults(parsedResults)

      const uid = currentUser?.uid || 'demo-local-user'
      try {
        await saveAnalysis(uid, contractText, parsedResults)
        setSaveStatus('Saved to your history')
        await fetchHistory(uid)
      } catch (saveError) {
        console.warn('Could not auto-save analysis:', saveError.message)
      }
    } catch (error) {
      console.error('Error analyzing clause:', error)
      setErrorMessage(error.message || 'An error occurred during analysis.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setContractText('')
    setResults([])
    setErrorMessage('')
    setSaveStatus('')
  }

  const handleSelectHistoryItem = (item) => {
    setContractText(item.clauseText || '')
    setResults(item.results || [])
    setErrorMessage('')
    setSaveStatus('Loaded from past analysis')
    setIsHistoryOpen(false)
  }

  const handleApplySample = (sampleText) => {
    setContractText(sampleText)
    setErrorMessage('')
    setSaveStatus('')
    const inputElement = document.getElementById('contract-input')
    if (inputElement) {
      inputElement.focus()
    }
  }

  const errorDetails = errorMessage ? formatUserFriendlyError(errorMessage) : null

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between px-4 py-6 sm:px-8 sm:py-10 max-w-full overflow-x-hidden">
      {/* Header & Branding */}
      <header className="w-full max-w-5xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0 ring-1 ring-white/10">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                LegalAssist AI
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Demo
                </span>
              </h1>
            </div>
            {/* Tagline under LegalAssist AI */}
            <p className="text-xs text-slate-400 font-normal mt-0.5">
              Understand your contracts before you sign them
            </p>
          </div>
        </div>

        {/* Badges & History Toggle */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
          {/* Gemini API Key Toggle Button */}
          <button
            type="button"
            onClick={() => setIsKeyModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700 active:scale-95 transition-all duration-150 shadow-sm shrink-0"
            title="Configure Google Gemini API Key"
          >
            <span className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span>{hasApiKey ? 'Key Active' : 'API Key'}</span>
          </button>

          {/* Explicit Powered by Gemini Badge */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-violet-500/10 border border-indigo-500/25 text-indigo-300 shadow-sm"
            title="AI contract intelligence powered by Google Gemini"
          >
            <svg className="w-3.5 h-3.5 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
            </svg>
            <span className="whitespace-nowrap">Powered by Gemini</span>
          </div>

          {/* History Toggle Button */}
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700 active:scale-95 transition-all duration-150 shadow-sm shrink-0"
          >
            <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>History</span>
            {history.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {history.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-5xl flex-1 flex flex-col items-center my-6 sm:my-10">
        <div className="w-full text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2 sm:mb-3">
            Review Legal Agreements with Confidence
          </h2>
          <p className="text-slate-400 text-xs sm:text-base max-w-xl mx-auto leading-relaxed">
            Paste any contract, clause, or legal snippet below to identify potential risks, obligations, and key terms in seconds.
          </p>
        </div>

        {/* Input Card */}
        <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3 px-1">
            <label
              htmlFor="contract-input"
              className="text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Contract / Clause Text
            </label>
            <div className="flex items-center gap-3">
              {contractText.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isLoading}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                >
                  Clear
                </button>
              )}
              <span className="text-xs text-slate-500 font-mono">
                {contractText.length} characters
              </span>
            </div>
          </div>

          <textarea
            id="contract-input"
            rows={7}
            disabled={isLoading}
            className="w-full rounded-xl bg-slate-950/80 border border-slate-800 p-4 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-all duration-150 resize-y disabled:opacity-60 leading-relaxed font-sans"
            placeholder="Paste your contract or clause text here (e.g. Non-disclosure agreement, indemnity clause, liability terms, non-compete)..."
            value={contractText}
            onChange={(e) => {
              setContractText(e.target.value)
              if (errorMessage) setErrorMessage('')
              if (saveStatus) setSaveStatus('')
            }}
          />

          {/* User-friendly Error State with "Try again" Button */}
          {errorDetails && (
            <div className="mt-3.5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 shadow-lg animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 shrink-0 mt-0.5 sm:mt-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-rose-200">
                      {errorDetails.title}
                    </h4>
                    <p className="text-xs text-rose-300/90 mt-0.5 leading-relaxed">
                      {errorDetails.message}
                    </p>

                    {errorDetails.title === 'Gemini API Key Required' && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsKeyModalOpen(true)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
                        >
                          Configure API Key
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRunDemo()}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
                        >
                          Run Demo Simulation
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 active:scale-95 transition-all shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try again
                  </button>
                  <button
                    type="button"
                    onClick={() => setErrorMessage('')}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 transition-colors"
                    title="Dismiss error"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success Save Banner */}
          {saveStatus && (
            <div className="mt-3.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-fade-in">
              <svg className="w-4 h-4 shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{saveStatus}</span>
            </div>
          )}

          {/* Action Row: responsive flex stacking on mobile */}
          <div className="mt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            <p className="text-xs text-slate-500 text-center sm:text-left">
              Powered by Google Gemini 1.5 &bull; Real-time Risk Categorization
            </p>
            <div className="flex items-center gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => handleRunDemo()}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 active:scale-95 transition-all shadow-sm"
                title="Run simulated contract analysis without needing an API key"
              >
                <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Try Demo</span>
              </button>
              <button
                type="button"
                id="analyze-btn"
                disabled={isLoading}
                onClick={handleAnalyze}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] shadow-md shadow-indigo-600/25 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Analyze
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Polished Skeleton Shimmer Loading State */}
        {isLoading && <SkeletonResults />}

        {/* Results Section */}
        {!isLoading && results.length > 0 && (
          <ResultsList results={results} />
        )}

        {/* Visually Inviting Empty / First-Load State */}
        {!isLoading && results.length === 0 && (
          <div className="w-full mt-8 sm:mt-10 p-6 sm:p-10 rounded-2xl bg-gradient-to-b from-slate-900/40 via-slate-900/20 to-slate-950/40 border border-dashed border-slate-800/80 flex flex-col items-center justify-center text-center shadow-lg backdrop-blur-sm">
            {/* Visual Icon with ambient glow */}
            <div className="relative mb-4">
              <div className="absolute -inset-1 rounded-2xl bg-indigo-500/20 blur-md" />
              <div className="relative h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 text-indigo-400 flex items-center justify-center shadow-md">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white mb-1.5">
              Ready to Analyze Your Contract
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed mb-6">
              Paste a clause above and click <span className="text-indigo-400 font-medium">Analyze</span> to see risk breakdowns, plain-English explanations, and recommended inquiries for your legal counsel.
            </p>

            {/* Quick Demo Sample Clauses */}
            <div className="w-full max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                Or try an example clause:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {SAMPLE_CLAUSES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplySample(sample.text)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900/90 hover:bg-indigo-950/40 text-slate-300 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/40 active:scale-95 transition-all shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>{sample.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl mt-8 pt-6 border-t border-slate-800/60">
              <div className="flex items-center gap-2 text-left p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/40">
                <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                <span className="text-[11px] text-slate-300">Risk Categorization (Low, Med, High)</span>
              </div>
              <div className="flex items-center gap-2 text-left p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/40">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span className="text-[11px] text-slate-300">Plain-English Explanations</span>
              </div>
              <div className="flex items-center gap-2 text-left p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-[11px] text-slate-300">Targeted Lawyer Questions</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* History Slide-out Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        isLoading={isHistoryLoading}
        onSelectAnalysis={handleSelectHistoryItem}
        onRefresh={() => currentUser?.uid && fetchHistory(currentUser.uid)}
      />

      {/* Gemini API Key Configuration Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        initialKey={getGeminiApiKey()}
        onSave={handleSaveApiKey}
        onRunDemo={() => handleRunDemo()}
      />

      {/* Footer */}
      <footer className="w-full max-w-5xl py-4 border-t border-slate-800/60 text-center text-xs text-slate-500">
        LegalAssist AI &copy; {new Date().getFullYear()} &bull; Not legal advice &bull; Automated contract analysis shell
      </footer>
    </div>
  )
}
