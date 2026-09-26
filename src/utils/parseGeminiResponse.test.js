import { describe, it, expect } from 'vitest'
import { parseGeminiResponse } from './parseGeminiResponse'

describe('parseGeminiResponse', () => {
  const validClause = {
    clauseText: 'The contractor shall indemnify the client against all liabilities.',
    riskLevel: 'high',
    explanation: 'Broad indemnification clause without financial caps.',
    suggestedQuestion: 'Can we add a liability cap or mutual indemnity?',
  }

  it('correctly parses a clean JSON array response', () => {
    const rawInput = JSON.stringify([validClause])
    const result = parseGeminiResponse(rawInput)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      clauseText: validClause.clauseText,
      riskLevel: 'high',
      explanation: validClause.explanation,
      suggestedQuestion: validClause.suggestedQuestion,
    })
  })

  it('correctly strips markdown code fences (```json ... ```) before parsing', () => {
    const rawInput = `\`\`\`json\n[\n  ${JSON.stringify(validClause)}\n]\n\`\`\``
    const result = parseGeminiResponse(rawInput)

    expect(result).toHaveLength(1)
    expect(result[0].clauseText).toBe(validClause.clauseText)
    expect(result[0].riskLevel).toBe('high')
  })

  it('correctly strips plain markdown fences (``` ... ```) before parsing', () => {
    const rawInput = `\`\`\`\n[\n  ${JSON.stringify(validClause)}\n]\n\`\`\``
    const result = parseGeminiResponse(rawInput)

    expect(result).toHaveLength(1)
    expect(result[0].clauseText).toBe(validClause.clauseText)
  })

  it('throws a clear error when given malformed/invalid JSON', () => {
    const invalidJson = '[{ "clauseText": "Broken JSON", "riskLevel": "low" '
    expect(() => parseGeminiResponse(invalidJson)).toThrow(/Failed to parse Gemini response as JSON/i)
  })

  it('throws a clear error when given an empty or non-string input', () => {
    expect(() => parseGeminiResponse('')).toThrow(/Expected non-empty string/i)
    expect(() => parseGeminiResponse(null)).toThrow(/Expected non-empty string/i)
  })

  it('throws a clear error when a required field is missing from an item', () => {
    const requiredFields = ['clauseText', 'riskLevel', 'explanation', 'suggestedQuestion']

    for (const field of requiredFields) {
      const incompleteClause = { ...validClause }
      delete incompleteClause[field]

      const input = JSON.stringify([incompleteClause])
      expect(() => parseGeminiResponse(input)).toThrow(
        new RegExp(`missing required field "${field}"`, 'i')
      )
    }
  })

  it('throws a clear error when a required field is an empty string', () => {
    const emptyFieldClause = { ...validClause, explanation: '   ' }
    const input = JSON.stringify([emptyFieldClause])

    expect(() => parseGeminiResponse(input)).toThrow(/missing required field "explanation"/i)
  })

  it('rejects an invalid riskLevel value that isn\'t "low", "medium", or "high"', () => {
    const invalidRiskClause = {
      ...validClause,
      riskLevel: 'critical',
    }
    const input = JSON.stringify([invalidRiskClause])

    expect(() => parseGeminiResponse(input)).toThrow(
      /Invalid riskLevel "critical".*Must be one of: "low", "medium", or "high"/i
    )
  })
})
