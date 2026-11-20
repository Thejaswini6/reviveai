/**
 * Email Service
 * Supports both simulated mock delivery and real GoDaddy / Titan domain SMTP delivery
 */

import nodemailer from 'nodemailer';
import { ENV } from '../env.js';
import { logger } from '../utils/logger.js';

interface EmailResult {
  success: boolean;
  messageId: string;
  recipient: string;
  channel: 'smtp' | 'mock';
  error?: string;
}

/**
 * Creates an SMTP transporter if configured
 */
function createTransporter() {
  if (ENV.EMAIL_ADAPTER !== 'smtp' || !ENV.SMTP_HOST || !ENV.SMTP_USER || !ENV.SMTP_PASSWORD) {
    return null;
  }

  const port = ENV.SMTP_PORT || 587;
  const isSecure = port === 465;

  return nodemailer.createTransport({
    host: ENV.SMTP_HOST,
    port,
    secure: isSecure,
    auth: {
      user: ENV.SMTP_USER,
      pass: ENV.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false, // Prevents self-signed cert blocks on mail proxies
    },
  });
}

/**
 * Send an approved recovery outreach email to a customer
 */
export async function sendRecoveryOutreach(options: {
  to: string;
  customerName: string;
  subject: string;
  body: string;
}): Promise<EmailResult> {
  const { to, customerName, subject, body } = options;

  if (ENV.EMAIL_ADAPTER === 'smtp') {
    const transporter = createTransporter();
    if (!transporter) {
      logger.warn('⚠️ SMTP requested but credentials incomplete. Falling back to simulated log.');
    } else {
      try {
        const fromAddress = ENV.SMTP_FROM || ENV.SMTP_USER || 'support@coolcare.invalid';
        const info = await transporter.sendMail({
          from: `"CoolCare AC Services" <${fromAddress}>`,
          to,
          subject,
          text: body,
          html: `<div style="font-family: -apple-system, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; padding: 20px;">
            <p>${body.replace(/\n/g, '<br/>')}</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="font-size: 12px; color: #6b7280;">
              Sent by CoolCare AC Services. To manage your notification preferences or opt out, reply with "unsubscribe".
            </p>
          </div>`,
        });

        logger.info(`✅ [SMTP Outbound] Recovery email delivered to ${to} (Message ID: ${info.messageId})`);
        return {
          success: true,
          messageId: info.messageId,
          recipient: to,
          channel: 'smtp',
        };
      } catch (err: any) {
        logger.error(`❌ [SMTP Outbound Error] Failed to send email to ${to}:`, err);
        return {
          success: false,
          messageId: `failed-${Date.now()}`,
          recipient: to,
          channel: 'smtp',
          error: err.message,
        };
      }
    }
  }

  // Simulated Mock Mode (Zero risk, no emails dispatched)
  const mockId = `mock-email-${Date.now()}`;
  logger.info(`📧 [Simulated Email] Mode: MOCK | Recipient: ${to} | Subject: "${subject}"`);
  return {
    success: true,
    messageId: mockId,
    recipient: to,
    channel: 'mock',
  };
}

/**
 * Send contact form submission to business owner mailbox
 * Fulfills GoDaddy Hackathon requirements (Slide 10, 12, 18)
 */
export async function sendContactFormNotification(inquiry: {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  message: string;
  leadId: string;
}): Promise<EmailResult> {
  const { name, email, phone, service, message, leadId } = inquiry;
  const businessMailbox = ENV.SMTP_FROM || ENV.SMTP_USER || 'hello@yourdomain.com';
  const subject = `[New Website Lead ${leadId}] Inquiry from ${name} - ${service || 'General Service'}`;

  if (ENV.EMAIL_ADAPTER === 'smtp') {
    const transporter = createTransporter();
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: `"ReviveAI Contact Bot" <${businessMailbox}>`,
          to: businessMailbox,
          replyTo: email,
          subject,
          text: `New Lead Ingestion from Website Contact Form:\n\nLead ID: ${leadId}\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nService: ${service || 'General'}\n\nMessage:\n${message}`,
          html: `<div style="font-family: -apple-system, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #4f46e5; margin-top: 0;">New Customer Lead Received</h2>
            <p>A new customer submitted an inquiry through your ReviveAI website contact form:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f3f4f6;">Lead ID:</td><td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">${leadId}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f3f4f6;">Name:</td><td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">${name}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f3f4f6;">Email:</td><td style="padding: 8px; border-bottom: 1px solid #f3f4f6;"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f3f4f6;">Phone:</td><td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">${phone || 'N/A'}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f3f4f6;">Service:</td><td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">${service || 'General'}</td></tr>
            </table>
            <div style="background: #f9fafb; padding: 12px; border-radius: 6px; margin-top: 16px;">
              <strong>Customer Message:</strong>
              <p style="margin: 8px 0 0 0; white-space: pre-wrap;">${message}</p>
            </div>
            <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">
              This inquiry has been logged into ReviveAI. If the customer does not convert within 3 days, ReviveAI will automatically prepare a recovery proposal for your approval.
            </p>
          </div>`,
        });

        logger.info(`✅ [Contact Form SMTP] Forwarded lead ${leadId} to domain mailbox ${businessMailbox} (${info.messageId})`);
        return {
          success: true,
          messageId: info.messageId,
          recipient: businessMailbox,
          channel: 'smtp',
        };
      } catch (err: any) {
        logger.error(`❌ [Contact Form SMTP Error] Failed to forward to mailbox ${businessMailbox}:`, err);
        return {
          success: false,
          messageId: `failed-contact-${Date.now()}`,
          recipient: businessMailbox,
          channel: 'smtp',
          error: err.message,
        };
      }
    }
  }

  // Simulated Mock Forwarding
  const mockId = `mock-contact-${Date.now()}`;
  logger.info(`📬 [Contact Form Ingestion] Lead ${leadId} received from ${name} (${email}). Forwarding simulated to ${businessMailbox}`);
  return {
    success: true,
    messageId: mockId,
    recipient: businessMailbox,
    channel: 'mock',
  };
}
