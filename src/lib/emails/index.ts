const sendWelcomeEmail = ({
  firstName,
  email,
  token,
}: {
  firstName: string
  email: string
  token: string
}) => {
  // eslint-disable-next-line no-console
  console.log(`Sending welcome email to ${firstName} at ${email} with token: ${token}`)
}

export { sendWelcomeEmail }
