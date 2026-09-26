import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import ClauseCard from './ClauseCard'

describe('ClauseCard Component', () => {
  const mockClause = {
    clauseText: 'The employee agrees not to compete for a period of 2 years.',
    riskLevel: 'high',
    explanation: 'Non-compete durations exceeding 1 year may be unreasonable and restrict future employment.',
    suggestedQuestion: 'Is a 2-year non-compete enforceable in our jurisdiction?',
  }

  it('renders clauseText, explanation, and suggestedQuestion correctly', () => {
    render(<ClauseCard clause={mockClause} />)

    // Check clause text (inside blockquote)
    expect(
      screen.getByText(`"${mockClause.clauseText}"`)
    ).toBeInTheDocument()

    // Check explanation
    expect(screen.getByText(mockClause.explanation)).toBeInTheDocument()

    // Check suggested question
    expect(
      screen.getByText(`"${mockClause.suggestedQuestion}"`)
    ).toBeInTheDocument()

    // Check "Ask your lawyer:" label
    expect(screen.getByText(/Ask your lawyer:/i)).toBeInTheDocument()
  })

  it('applies the correct color class and styling for high riskLevel', () => {
    const { container } = render(
      <ClauseCard clause={{ ...mockClause, riskLevel: 'high' }} />
    )

    expect(screen.getByText('High Risk')).toBeInTheDocument()
    const card = container.firstChild
    expect(card).toHaveClass('border-l-rose-500')
  })

  it('applies the correct color class and styling for medium riskLevel', () => {
    const { container } = render(
      <ClauseCard clause={{ ...mockClause, riskLevel: 'medium' }} />
    )

    expect(screen.getByText('Medium Risk')).toBeInTheDocument()
    const card = container.firstChild
    expect(card).toHaveClass('border-l-amber-500')
  })

  it('applies the correct color class and styling for low riskLevel', () => {
    const { container } = render(
      <ClauseCard clause={{ ...mockClause, riskLevel: 'low' }} />
    )

    expect(screen.getByText('Low Risk')).toBeInTheDocument()
    const card = container.firstChild
    expect(card).toHaveClass('border-l-emerald-500')
  })

  it('handles null or missing clause prop gracefully', () => {
    const { container } = render(<ClauseCard clause={null} />)
    expect(container.firstChild).toBeNull()
  })
})
