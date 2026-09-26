import { describe, it, expect, vi, beforeEach } from 'vitest'
import { signInAnon, onAuthChange } from './authService'

const mockSignInAnonymously = vi.fn()
const mockOnAuthStateChanged = vi.fn()

vi.mock('firebase/auth', () => ({
  signInAnonymously: (...args) => mockSignInAnonymously(...args),
  onAuthStateChanged: (...args) => mockOnAuthStateChanged(...args),
  getAuth: vi.fn(() => ({})),
}))

vi.mock('./firebaseConfig', () => ({
  auth: {},
  db: {},
  app: {},
}))

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('signInAnon successfully signs in anonymously and returns user', async () => {
    const mockUser = { uid: 'anon-user-123', isAnonymous: true }
    mockSignInAnonymously.mockResolvedValueOnce({ user: mockUser })

    const user = await signInAnon()
    expect(mockSignInAnonymously).toHaveBeenCalledTimes(1)
    expect(user).toEqual(mockUser)
  })

  it('signInAnon rethrows error if sign-in fails', async () => {
    mockSignInAnonymously.mockRejectedValueOnce(new Error('Auth network error'))

    await expect(signInAnon()).rejects.toThrow('Auth network error')
  })

  it('onAuthChange wraps onAuthStateChanged properly', () => {
    const callback = vi.fn()
    const mockUnsubscribe = vi.fn()
    mockOnAuthStateChanged.mockReturnValueOnce(mockUnsubscribe)

    const unsubscribe = onAuthChange(callback)
    expect(mockOnAuthStateChanged).toHaveBeenCalledWith(expect.anything(), callback)
    expect(unsubscribe).toBe(mockUnsubscribe)
  })
})
