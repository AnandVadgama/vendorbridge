import nodemailer from 'nodemailer';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

// Retrieve SMTP settings from environment variables
const SMTP_HOST = process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '2525', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@vendorbridge.com';

/**
 * Creates and returns a transporter. Falls back to a mock transporter if user/password is missing
 * to avoid breaking the application flow during hackathon demos.
 */
function getTransporter() {
  if (!SMTP_USER || !SMTP_PASSWORD) {
    console.warn(
      '⚠️ SMTP_USER or SMTP_PASSWORD is not set. Email utility will run in SIMULATION mode.'
    );
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // True for port 465, false for other ports (like 587 or 2525)
    auth: {
      user: SMTP_USER,
      password: SMTP_PASSWORD,
    },
  } as any);
}

/**
 * Send an email with optional attachments (like PDFs)
 */
export async function sendEmail({ to, subject, html, attachments }: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const transporter = getTransporter();

  const mailOptions = {
    from: SMTP_FROM,
    to,
    subject,
    html,
    attachments: attachments?.map((att) => ({
      filename: att.filename,
      content: att.content,
      contentType: att.contentType,
    })),
  };

  if (!transporter) {
    // Simulation mode: print to console
    console.log('--- EMAIL SEND SIMULATION ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Attachments: ${attachments?.map((a) => a.filename).join(', ') || 'None'}`);
    console.log('-----------------------------');
    
    // Simulate minor network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    return {
      success: true,
      messageId: `simulated-${Date.now()}`,
    };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Email sent successfully: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error('❌ Failed to send email:', error);
    return {
      success: false,
      error: error.message || 'Unknown SMTP Error',
    };
  }
}
