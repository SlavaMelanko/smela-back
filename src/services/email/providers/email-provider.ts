import type { EmailPayload } from './email-payload'

export interface EmailProvider {
  send: (payload: EmailPayload) => Promise<void>
}
