import { Resend } from 'resend'

// Lazily initialize resend to ensure environment variables are loaded
let resend;

const getResendClient = () => {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('❌ RESEND_API_KEY is missing from environment variables');
    } else {
        console.log('✅ Resend client initialized with key starting with:', apiKey.substring(0, 5));
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

export const sendInviteEmail = async (email, token) => {
  try {
    const appUrl = process.env.APP_URL;
    if (!appUrl) {
        console.error('❌ APP_URL is missing from environment variables');
        throw new Error('APP_URL is missing');
    }

    const inviteLink = `${appUrl}/set-password?token=${token}`
    const client = getResendClient();

    console.log(`📨 Attempting to send invite email to: ${email}`);
    console.log(`🔗 Invite link: ${inviteLink}`);

    const payload = {
      from: 'Church MS <onboarding@resend.dev>',
      to: email,
      subject: 'You are invited 🎉',
      html: `
        <h2>Welcome!</h2>
        <p>You have been invited to join the platform.</p>
        <p>Click below to set your password:</p>
        <a href="${inviteLink}" target="_blank">Set Password</a>
        <p>This link will expire in 24 hours.</p>
      `
    };

    const response = await client.emails.send(payload);

    if (response.error) {
      console.error('❌ Resend API Error:', response.error);
      throw response.error;
    }

    console.log('✅ Email sent successfully. Resend Response ID:', response.data?.id);
    return response.data;
  } catch (err) {
    console.error('❌ Failed to send invite email:', err);
    throw err;
  }
}
