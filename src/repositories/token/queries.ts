import { eq } from 'drizzle-orm'

import db, { secureTokensTable } from '@/db'

import type { CreateTokenInput, TokenRecord, UpdateTokenInput } from './types'

const createToken = async (token: CreateTokenInput): Promise<number> => {
  const [createdToken] = await db
    .insert(secureTokensTable)
    .values(token)
    .returning({ id: secureTokensTable.id })

  return createdToken.id
}

const findByToken = async (token: string): Promise<TokenRecord | undefined> => {
  const [foundToken] = await db
    .select()
    .from(secureTokensTable)
    .where(
      eq(secureTokensTable.token, token),
    )

  return foundToken
}

const updateToken = async (
  tokenId: number,
  updates: UpdateTokenInput,
): Promise<void> => {
  await db
    .update(secureTokensTable)
    .set(updates)
    .where(eq(secureTokensTable.id, tokenId))
}

export {
  createToken,
  findByToken,
  updateToken,
}
