const MESSAGES = {
  invalid_credentials: 'Incorrect email or password.',
  email_not_confirmed: 'Please confirm your email before logging in.',
  over_email_send_rate_limit:
    'Too many emails were sent. Please wait a while and try again.',
  over_request_rate_limit:
    'Too many attempts. Please wait a few minutes and try again.',
  weak_password: 'Please choose a stronger password.',
  same_password: 'Your new password must be different from the old one.',
  email_address_invalid: 'This email address cannot be used.',
  email_address_not_authorized:
    'Emails cannot be sent to this address yet. Use an address from the Supabase project team.',
  signup_disabled: 'Registration is currently closed.',
  user_banned: 'This account has been suspended.',
  otp_expired: 'This link has expired or was already used.',
}

/** Turns a Supabase Auth error into a message for the user. */
export function getAuthErrorMessage(error) {
  if (MESSAGES[error?.code]) return MESSAGES[error.code]
  if (error?.name === 'AuthRetryableFetchError') {
    return 'Cannot reach the login service. Check your connection.'
  }
  return 'Something went wrong. Please try again.'
}
