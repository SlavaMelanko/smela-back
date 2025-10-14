export enum TokenType {
  EmailVerification = 'email_verification',
  PasswordReset = 'password_reset',
}

export enum TokenStatus {
  Pending = 'pending',
  Used = 'used',
  Deprecated = 'deprecated',
}
