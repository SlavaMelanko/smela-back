/**
 * Handler Type Utilities for Split File Architecture
 *
 * When routes are inline, Hono infers types through the middleware chain:
 * ```typescript
 * route.post('/signup', requestValidator('json', schema), async (c) => {
 *   const payload = c.req.valid('json') // ✓ TypeScript infers 'json' is valid
 * })
 * ```
 *
 * When handlers are in separate files, the type chain breaks:
 * ```typescript
 * // handler.ts - TypeScript has no idea about requestValidator
 * const handler = async (c) => {
 *   c.req.valid('json') // ✗ Error: 'json' not assignable to 'never'
 * }
 *
 * // index.ts - Type info doesn't flow back to handler.ts
 * route.post('/signup', requestValidator('json', schema), handler)
 * ```
 *
 * These types manually declare what `requestValidator` would have inferred:
 * ```typescript
 * const handler = async (c: ValidatedCtx<SignupBody>) => {
 *   c.req.valid('json') // ✓ Now TypeScript knows 'json' is valid
 * }
 * ```
 */

import type { Context } from 'hono'

import type { AppContext } from '@/context'

/**
 * Defines the shape of validated JSON input for Hono's type system.
 * The `in` and `out` properties tell Hono that 'json' is a valid target.
 */
interface JsonInput<Body> {
  in: { json: Body }
  out: { json: Body }
}

/**
 * Context for routes with JSON body validation (POST, PUT, PATCH).
 * @example
 * const signupHandler = async (c: ValidatedCtx<SignupBody>) => {
 *   const payload = c.req.valid('json') // typed as SignupBody
 * }
 */
export type ValidatedCtx<Body> = Context<AppContext, string, JsonInput<Body>>

/**
 * Context for routes without body validation (GET, DELETE).
 * @example
 * const healthHandler = async (c: AppCtx) => c.json({ status: 'ok' })
 */
export type AppCtx = Context<AppContext, string>
