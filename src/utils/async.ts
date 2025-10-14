/**
 * Wraps an async function with a timeout mechanism using AbortController.
 * If the function doesn't complete within the specified timeout, the promise
 * will be rejected with a timeout error.
 *
 * @param asyncFn - The async function to execute
 * @param timeoutMs - Timeout in milliseconds (default: 10 seconds)
 * @returns Promise that resolves with the function result or rejects on timeout
 * @throws Throws 'Timeout.' error when the timeout is exceeded
 *
 * @example
 * // Basic usage with default 10-second timeout
 * const result = await withTimeout(async () => {
 *   return await fetch('/api/data')
 * })
 *
 * @example
 * // Custom timeout of 5 seconds
 * const result = await withTimeout(
 *   () => uploadFile(file),
 *   5000
 * )
 *
 * @example
 * // Error handling
 * try {
 *   const result = await withTimeout(() => slowOperation())
 * } catch (error) {
 *   if (error.message === 'Timeout.') {
 *     console.log('Operation timed out')
 *   } else {
 *     console.log('Operation failed:', error.message)
 *   }
 * }
 */
export const withTimeout = async <T>(
  asyncFn: () => Promise<T>,
  timeoutMs: number = 10000,
): Promise<T> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const result = await Promise.race([
      asyncFn(),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () =>
          reject(new Error('Timeout.')))
      }),
    ])

    return result
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Sleeps for the specified number of milliseconds.
 * Useful for implementing delays, retry logic, or rate limiting.
 *
 * @param ms - Number of milliseconds to sleep
 * @returns Promise that resolves after the specified delay
 *
 * @example
 * // Sleep for 1 second
 * await sleepFor(1000)
 *
 * @example
 * // Use in retry logic with exponential backoff
 * for (let attempt = 0; attempt < maxRetries; attempt++) {
 *   try {
 *     return await riskyOperation()
 *   } catch (error) {
 *     if (attempt === maxRetries - 1) throw error
 *     await sleepFor(exponentialBackoffDelay(1000, attempt))
 *   }
 * }
 */
export const sleepFor = async (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Calculates exponential backoff delay for retry mechanisms.
 * Each attempt doubles the delay time from the base delay.
 *
 * @param baseDelayMs - Base delay in milliseconds for the first retry
 * @param attempt - Current attempt number (0-based)
 * @param maxDelayMs - Optional maximum delay cap in milliseconds
 * @returns Calculated delay in milliseconds
 *
 * @example
 * // Basic exponential backoff: 1000ms, 2000ms, 4000ms, 8000ms
 * const delay1 = exponentialBackoffDelay(1000, 0) // 1000ms
 * const delay2 = exponentialBackoffDelay(1000, 1) // 2000ms
 * const delay3 = exponentialBackoffDelay(1000, 2) // 4000ms
 *
 * @example
 * // With maximum delay cap
 * const delay = exponentialBackoffDelay(1000, 5, 10000) // 10000ms (capped)
 *
 * @example
 * // Use in retry loop
 * for (let attempt = 0; attempt < maxRetries; attempt++) {
 *   try {
 *     return await riskyOperation()
 *   } catch (error) {
 *     if (attempt === maxRetries - 1) throw error
 *     const delay = exponentialBackoffDelay(1000, attempt, 30000)
 *     await sleepFor(delay)
 *   }
 * }
 */
export const exponentialBackoffDelay = (
  baseDelayMs: number,
  attempt: number,
  maxDelayMs?: number,
): number => {
  const delay = baseDelayMs * 2 ** attempt

  return maxDelayMs ? Math.min(delay, maxDelayMs) : delay
}
