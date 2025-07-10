enum Token {
  EmailVerification = 'email_verification',
  PasswordReset = 'password_reset',
}

enum TokenStatus {
  Pending = 'pending',
  Used = 'used',
  Deprecated = 'deprecated',
}

export { Token, TokenStatus }
