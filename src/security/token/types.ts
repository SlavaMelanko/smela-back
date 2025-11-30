export enum TokenType {
  EmailVerification = 'email_verification',
  PasswordReset = 'password_reset',
  RefreshToken = 'refresh_token',
}

export enum TokenStatus {
  Pending = 'pending',
  Used = 'used',
  Deprecated = 'deprecated',
}
