/**
 * reCAPTCHA API validation result structure.
 *
 * Response from Google's reCAPTCHA verification endpoint.
 */
export interface Result {
  'success': boolean
  'challenge_ts'?: string
  'hostname'?: string
  'error-codes'?: string[]
}
