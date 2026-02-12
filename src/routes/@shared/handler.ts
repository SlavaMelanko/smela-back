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
 * const handler = async (c: ValidatedJsonCtx<SignupBody>) => {
 *   c.req.valid('json') // ✓ Now TypeScript knows 'json' is valid
 * }
 * ```
 */

import type { Context } from 'hono'

import type { AppContext } from '@/context'

interface JsonInput<Body> {
  in: { json: Body }
  out: { json: Body }
}

/**
 * Context for routes with JSON body validation (POST, PUT, PATCH).
 * @example
 * const signupHandler = async (c: ValidatedJsonCtx<SignupBody>) => {
 *   const payload = c.req.valid('json') // typed as SignupBody
 * }
 */
export type ValidatedJsonCtx<Body> = Context<AppContext, string, JsonInput<Body>>

interface QueryInput<Query> {
  in: { query: Query }
  out: { query: Query }
}

/**
 * Context for routes with query parameter validation (GET).
 * @example
 * const listHandler = async (c: ValidatedQueryCtx<ListQuery>) => {
 *   const query = c.req.valid('query') // typed as ListQuery
 * }
 */
export type ValidatedQueryCtx<Query> = Context<AppContext, string, QueryInput<Query>>

/**
 * Context for routes without body validation (GET, DELETE).
 * @example
 * const healthHandler = async (c: AppCtx) => c.json({ status: 'ok' })
 */
export type AppCtx = Context<AppContext, string>

interface ParamInput<Param> {
  in: { param: Param }
  out: { param: Param }
}

/**
 * Context for routes with path parameter validation (GET /resource/:id).
 * @example
 * const detailHandler = async (c: ValidatedParamCtx<{ id: number }>) => {
 *   const { id } = c.req.valid('param') // typed as { id: number }
 * }
 */
export type ValidatedParamCtx<Param> = Context<AppContext, string, ParamInput<Param>>

interface ParamJsonInput<Param, Body> {
  in: { param: Param, json: Body }
  out: { param: Param, json: Body }
}

/**
 * Context for routes with both path parameter and JSON body validation (PUT, PATCH).
 * @example
 * const updateHandler = async (c: ValidatedParamJsonCtx<{ id: string }, UpdateBody>) => {
 *   const { id } = c.req.valid('param') // typed as { id: string }
 *   const body = c.req.valid('json') // typed as UpdateBody
 * }
 */
export type ValidatedParamJsonCtx<Param, Body>
  = Context<AppContext, string, ParamJsonInput<Param, Body>>
