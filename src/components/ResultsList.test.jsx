import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import ResultsList from './ResultsList'

describe('ResultsList Component', () => {
  const sampleResults = [
    {
      clauseText: 'Indemnity clause with unlimited liability.',
      riskLevel: 'high',
      explanation: 'Exposes party to catastrophic legal costs.',
      suggestedQuestion: 'Can we cap liability at contract value?',
    },
    {
      clauseText: 'Termination for convenience with 30 days notice.',
      riskLevel: 'medium',
      explanation: 'Either party may terminate prematurely.',
      suggestedQuestion: 'What wind-down costs are protected?',
    },
    {
      clauseText: 'Governing law shall be the State of California.',
      riskLevel: 'low',
      explanation: 'Standard choice of venue clause.',
      suggestedQuestion: 'Is California jurisdiction standard for our entities?',
    },
    {
      clauseText: 'Another high risk clause.',
      riskLevel: 'high',
      explanation: 'Uncapped IP indemnification.',
      suggestedQuestion: 'Can we limit indemnity?',
    },
  ]

  it('renders one ClauseCard per item in the results array', () => {
    render(<ResultsList results={sampleResults} />)

    // Check each clauseText is rendered
    sampleResults.forEach((item) => {
      expect(screen.getByText(`"${item.clauseText}"`)).toBeInTheDocument()
    })

    // 4 clauses identified badge
    expect(screen.getByText(/4 clauses identified/i)).toBeInTheDocument()
  })

  it('displays the correct risk breakdown counts (X High, Y Medium, Z Low) in the summary header', () => {
    render(<ResultsList results={sampleResults} />)

    // 2 High, 1 Medium, 1 Low
    expect(screen.getByText('2 High')).toBeInTheDocument()
    expect(screen.getByText('1 Medium')).toBeInTheDocument()
    expect(screen.getByText('1 Low')).toBeInTheDocument()
  })

  it('renders an appropriate empty/no-results state when results is an empty array', () => {
    render(<ResultsList results={[]} />)

    expect(screen.getByText(/No clauses identified to display/i)).toBeInTheDocument()
  })
})
