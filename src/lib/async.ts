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
          reject(new Error('Timeout.')) )
      }),
    ])

    return result
  } finally {
    clearTimeout(timeoutId)
  }
}
