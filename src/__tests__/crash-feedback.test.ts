import * as Sentry from '@sentry/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MAX_CRASH_FEEDBACK_LENGTH,
  submitCrashFeedback,
} from '../utils/crashFeedback'

vi.mock('@sentry/react', () => ({ captureFeedback: vi.fn() }))

const captureFeedback = vi.mocked(Sentry.captureFeedback)

describe('submitCrashFeedback', () => {
  beforeEach(() => {
    captureFeedback.mockReset()
  })

  it('sends the message linked to the crash event', () => {
    expect(submitCrashFeedback('I clicked X', 'evt123')).toBe(true)
    expect(captureFeedback).toHaveBeenCalledWith({
      message: 'I clicked X',
      associatedEventId: 'evt123',
    })
  })

  it('never sends a name or email (the app is anonymous)', () => {
    submitCrashFeedback('hello', 'evt123')
    const params = captureFeedback.mock.calls[0][0]
    expect(params).not.toHaveProperty('name')
    expect(params).not.toHaveProperty('email')
  })

  it('omits associatedEventId when there is no event id', () => {
    expect(submitCrashFeedback('hello')).toBe(true)
    expect(submitCrashFeedback('hello', '')).toBe(true)
    for (const [params] of captureFeedback.mock.calls) {
      expect(params).toEqual({ message: 'hello' })
    }
  })

  it('trims the message and refuses a blank one', () => {
    expect(submitCrashFeedback('  hi  ', 'e')).toBe(true)
    expect(captureFeedback.mock.calls[0][0].message).toBe('hi')

    captureFeedback.mockClear()
    expect(submitCrashFeedback('   \n ', 'e')).toBe(false)
    expect(captureFeedback).not.toHaveBeenCalled()
  })

  it('truncates a message longer than the limit', () => {
    submitCrashFeedback('a'.repeat(MAX_CRASH_FEEDBACK_LENGTH + 50), 'e')
    expect(captureFeedback.mock.calls[0][0].message).toHaveLength(
      MAX_CRASH_FEEDBACK_LENGTH,
    )
  })

  it('returns false instead of throwing when Sentry throws', () => {
    captureFeedback.mockImplementation(() => {
      throw new Error('boom')
    })
    expect(submitCrashFeedback('hello', 'e')).toBe(false)
  })
})
