import nodemailer from 'nodemailer';

// 1. Initialize the Transporter with explicit SMTP settings
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,            // Port 465 is for Secure SSL
  secure: true,         // Must be true if using port 465
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD, // Your 16-character App Password
  },
  // Optional: Increases reliability on some modern cloud hosts
  pool: true, 
  maxConnections: 5,
});

export const sendInviteEmail = async (email, token) => {
  try {
    // Ensure environment variables exist before proceeding
    const appUrl = process.env.APP_URL;
    const senderEmail = process.env.SMTP_EMAIL;

    if (!appUrl || !senderEmail) {
      throw new Error('Missing EMAIL or APP_URL environment variables');
    }

    const inviteLink = `${appUrl}/set-password?token=${token}`;

    // 2. Configure the Mail Options
    const mailOptions = {
      from: `"Church MS" <${senderEmail}>`, 
      to: email,
      subject: 'You are invited 🎉',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <h2>Welcome!</h2>
          <p>You have been invited to join the Church Management System.</p>
          <p>Click the button below to set your password and get started:</p>
          <a href="${inviteLink}" 
             style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
             Set Password
          </a>
          <p style="margin-top: 20px; font-size: 0.8em; color: #666;">
            This link will expire in 24 hours.
          </p>
        </div>
      `,
    };

    // 3. Send the email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ SMTP Error:', error);
    throw error;
  }
};
