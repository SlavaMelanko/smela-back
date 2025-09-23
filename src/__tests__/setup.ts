import { afterEach, beforeEach, mock } from 'bun:test'

// Global test setup - automatically cleans up mocks between tests
beforeEach(() => {
  // Any global setup needed before each test
})

afterEach(() => {
  // Clean up all mocks after each test to prevent interference
  mock.restore()
})
