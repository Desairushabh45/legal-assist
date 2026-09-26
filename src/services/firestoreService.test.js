import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveAnalysis, getUserAnalyses } from './firestoreService'

const mockAddDoc = vi.fn()
const mockGetDocs = vi.fn()
const mockCollection = vi.fn(() => 'analyses_col')
const mockQuery = vi.fn((...args) => ({ type: 'query', args }))
const mockWhere = vi.fn((field, op, val) => ({ field, op, val }))
const mockOrderBy = vi.fn((field, dir) => ({ field, dir }))
const mockServerTimestamp = vi.fn(() => 'MOCK_TIMESTAMP')

vi.mock('firebase/firestore', () => ({
  collection: (...args) => mockCollection(...args),
  addDoc: (...args) => mockAddDoc(...args),
  query: (...args) => mockQuery(...args),
  where: (...args) => mockWhere(...args),
  orderBy: (...args) => mockOrderBy(...args),
  getDocs: (...args) => mockGetDocs(...args),
  serverTimestamp: () => mockServerTimestamp(),
  getFirestore: vi.fn(() => ({})),
}))

vi.mock('./firebaseConfig', () => ({
  auth: {},
  db: {},
  app: {},
}))

describe('firestoreService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('saveAnalysis', () => {
    it('saves a new analysis document with required fields and serverTimestamp', async () => {
      mockAddDoc.mockResolvedValueOnce({ id: 'doc-analysis-999' })

      const userId = 'user-abc'
      const clauseText = 'Sample clause text'
      const results = [{ clauseText: 'Sample', riskLevel: 'low', explanation: 'Fine', suggestedQuestion: 'None' }]

      const docId = await saveAnalysis(userId, clauseText, results)

      expect(docId).toBe('doc-analysis-999')
      expect(mockAddDoc).toHaveBeenCalledWith('analyses_col', {
        userId,
        clauseText,
        results,
        createdAt: 'MOCK_TIMESTAMP',
      })
    })

    it('throws an error if userId is missing', async () => {
      await expect(saveAnalysis('', 'Text', [])).rejects.toThrow(/User ID is required/i)
    })
  })

  describe('getUserAnalyses', () => {
    it('returns empty array if userId is not provided', async () => {
      const res = await getUserAnalyses('')
      expect(res).toEqual([])
    })

    it('fetches documents for userId successfully', async () => {
      const mockDocs = [
        {
          id: 'doc-1',
          data: () => ({ clauseText: 'Clause 1', results: [], createdAt: { seconds: 100 } }),
        },
        {
          id: 'doc-2',
          data: () => ({ clauseText: 'Clause 2', results: [], createdAt: { seconds: 200 } }),
        },
      ]

      mockGetDocs.mockResolvedValueOnce({
        forEach: (fn) => mockDocs.forEach(fn),
      })

      const analyses = await getUserAnalyses('user-123')

      expect(analyses).toHaveLength(2)
      expect(analyses[0].id).toBe('doc-1')
      expect(analyses[1].id).toBe('doc-2')
    })

    it('falls back to client-side sort if Firestore index error occurs', async () => {
      const indexError = new Error('The query requires an index.')
      indexError.code = 'failed-precondition'

      // First query fails with index error
      mockGetDocs.mockRejectedValueOnce(indexError)

      // Fallback query succeeds
      const fallbackDocs = [
        {
          id: 'doc-older',
          data: () => ({ clauseText: 'Older', results: [], createdAt: { seconds: 100 } }),
        },
        {
          id: 'doc-newer',
          data: () => ({ clauseText: 'Newer', results: [], createdAt: { seconds: 500 } }),
        },
      ]
      mockGetDocs.mockResolvedValueOnce({
        forEach: (fn) => fallbackDocs.forEach(fn),
      })

      const analyses = await getUserAnalyses('user-123')

      expect(analyses).toHaveLength(2)
      // Newer should come first in client-side sort
      expect(analyses[0].id).toBe('doc-newer')
      expect(analyses[1].id).toBe('doc-older')
    })
  })
})
