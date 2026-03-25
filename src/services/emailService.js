import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const sendInviteEmail = async (email, token) => {
  const inviteLink = `${process.env.APP_URL}/set-password?token=${token}`

  await resend.emails.send({
    from: 'Your App <onboarding@resend.dev>',
    to: email,
    subject: 'You are invited 🎉',
    html: `
      <h2>Welcome!</h2>
      <p>You have been invited to join the platform.</p>
      <p>Click below to set your password:</p>
      <a href="${inviteLink}" target="_blank">Set Password</a>
      <p>This link will expire in 24 hours.</p>
    `
  })
}