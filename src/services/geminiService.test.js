import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyzeClause } from './geminiService'

const mockGenerateContent = vi.fn()
const mockGetGenerativeModel = vi.fn(() => ({
  generateContent: mockGenerateContent,
}))

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class MockGoogleGenerativeAI {
      constructor(apiKey) {
        this.apiKey = apiKey
        this.getGenerativeModel = mockGetGenerativeModel
      }
    },
  }
})

describe('geminiService - analyzeClause', () => {
  const validClauseItem = {
    clauseText: 'The party may terminate at any time without penalty.',
    riskLevel: 'medium',
    explanation: 'Unilateral termination right could disrupt operations.',
    suggestedQuestion: 'Can we add reciprocal termination terms?',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-gemini-key-123')
  })

  it('verifies analyzeClause constructs and sends a request with input clause text included in the prompt', async () => {
    const inputClause = 'All intellectual property created shall belong exclusively to the vendor.'

    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify([{ ...validClauseItem, clauseText: inputClause }]),
      },
    })

    await analyzeClause(inputClause)

    expect(mockGetGenerativeModel).toHaveBeenCalledWith({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    })

    expect(mockGenerateContent).toHaveBeenCalledTimes(1)
    const [sentPrompt] = mockGenerateContent.mock.calls[0]
    expect(sentPrompt).toContain(inputClause)
    expect(sentPrompt).toContain('You are an expert legal-assistance AI')
  })

  it('verifies it returns the parsed result when the mock returns valid JSON', async () => {
    const mockOutput = [validClauseItem]
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify(mockOutput),
      },
    })

    const result = await analyzeClause('Some sample text')

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(validClauseItem)
  })

  it('verifies it throws an error when the mock returns invalid/malformed JSON', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => 'Not a JSON response',
      },
    })

    await expect(analyzeClause('Some sample text')).rejects.toThrow(
      /Failed to parse Gemini response as JSON/i
    )
  })

  it('throws an error if API key is not configured', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', '')

    await expect(analyzeClause('Some text')).rejects.toThrow(
      /Gemini API key is not configured/i
    )
  })

  it('throws an error if clauseText is empty or missing', async () => {
    await expect(analyzeClause('')).rejects.toThrow(
      /Please provide valid contract or clause text/i
    )
    await expect(analyzeClause('   ')).rejects.toThrow(
      /Please provide valid contract or clause text/i
    )
  })
})
