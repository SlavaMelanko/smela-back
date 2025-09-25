import { mock } from 'bun:test'
import path from 'node:path'

export interface MockResult {
  clear: () => void
}

/**
 * Due to an issue with Bun (https://github.com/oven-sh/bun/issues/7823), we need to manually restore mocked modules
 * after we're done. We do this by setting the mocked value to the original module.
 *
 * When setting up a test that will mock a module, the block should add this:
 * const moduleMocker = new ModuleMocker()
 *
 * afterEach(() => {
 *   moduleMocker.clear()
 * })
 *
 * When a test mocks a module, it should do it this way:
 *
 * await moduleMocker.mock('@/services/token.ts', () => ({
 *   getBucketToken: mock(() => {
 *     throw new Error('Unexpected error')
 *   })
 * }))
 *
 */
export class ModuleMocker {
  private mocks: MockResult[] = []
  private callerPath: string

  constructor() {
    // Capture caller's file path for relative path resolution
    const stack = new Error('Error').stack
    const callerLine = stack?.split('\n')[2] // Get caller's stack line
    const match = callerLine?.match(/\((.*?):\d+:\d+\)$/) || callerLine?.match(/at (.*?):\d+:\d+$/)

    if (match) {
      this.callerPath = path.dirname(match[1])
    } else {
      // Fallback: assume caller is in a test directory
      this.callerPath = process.cwd()
    }
  }

  private resolveModulePath(modulePath: string): string {
    // If path starts with @/ or is absolute, return as-is
    if (modulePath.startsWith('@/') || path.isAbsolute(modulePath) || !modulePath.startsWith('.')) {
      return modulePath
    }

    // For relative paths, resolve them relative to the caller's directory
    const resolvedPath = path.resolve(this.callerPath, modulePath)

    // Convert to @/ alias path by replacing project root
    const projectRoot = process.cwd()
    const srcPath = path.join(projectRoot, 'src')

    if (resolvedPath.startsWith(srcPath)) {
      const relativePath = path.relative(srcPath, resolvedPath)

      return `@/${relativePath.replace(/\\/g, '/')}` // Normalize path separators
    }

    // If not in src directory, return the resolved absolute path
    return resolvedPath
  }

  async mock(modulePath: string, renderMocks: () => Record<string, any>) {
    const resolvedPath = this.resolveModulePath(modulePath)
    const original = {
      ...(await import(resolvedPath)),
    }
    const mocks = renderMocks()
    const result = {
      ...original,
      ...mocks,
    }

    mock.module(resolvedPath, () => result)

    this.mocks.push({
      clear: () => {
        mock.module(resolvedPath, () => original)
      },
    })
  }

  clear() {
    this.mocks.forEach(mockResult => mockResult.clear())
    this.mocks = []
  }
}
