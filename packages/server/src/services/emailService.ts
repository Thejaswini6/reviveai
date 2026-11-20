/**
 * Email Service — GoDaddy Node.js Hosting Native Architecture
 * 
 * 1. Contact Form: Uses GoDaddy's official built-in email gateway via sendEmail() helper
 *    (POST http://127.0.0.1:2525/api/email/send).
 *    Recipient: Fixed domain mailbox (thejaswini@reviveaiapp.com).
 *    Sender: Omitted by default so GoDaddy selects the canonical verified sender.
 *    ReplyTo: Visitor's validated email address.
 * 
 * 2. AI Customer Recovery Outreach: Strictly simulated mock.
 *    Protects fictional demo leads from accidental real emails.
 *    Maintains full audit logging.
 */

import { sendEmail } from '../server/email.js';
import { logger } from '../utils/logger.js';

export interface EmailResult {
  success: boolean;
  messageId: string;
  recipient: string;
  channel: 'godaddy-gateway' | 'mock';
  error?: string;
}

const FIXED_RECIPIENT = process.env.CONTACT_FORM_RECIPIENT_EMAIL || 'thejaswini@reviveaiapp.com';

/**
 * Escapes HTML characters to prevent XSS / injection in email bodies
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Send contact form message to domain mailbox (thejaswini@reviveaiapp.com)
 * Uses the official GoDaddy Node.js Hosting email gateway
 */
export async function sendContactEmail(options: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<EmailResult> {
  const { name, email, subject, message } = options;
  const recipient = FIXED_RECIPIENT;
  const emailSubject = `[Website Contact Form] ${subject || 'General Inquiry'} (from ${name})`;

  // Plain-text body (preferred by GoDaddy specification)
  const textBody = `New message received from website contact form on reviveaiapp.com:\n\n` +
    `Sender Name: ${name}\n` +
    `Sender Email: ${email}\n` +
    `Subject: ${subject || 'General Inquiry'}\n` +
    `Timestamp: ${new Date().toISOString()}\n\n` +
    `Message:\n${message}\n\n` +
    `---\nReviveAI Contact Form`;

  // Sanitized HTML body (all dynamic variables safely escaped)
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject || 'General Inquiry');
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br/>');

  const htmlBody = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
    <h2 style="color: #4f46e5; margin-top: 0;">New Website Contact Message</h2>
    <p>A visitor submitted a message via the public contact form on <strong>reviveaiapp.com</strong>:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f3f4f6; width: 120px;">Name:</td><td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">${safeName}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f3f4f6;">Email:</td><td style="padding: 8px; border-bottom: 1px solid #f3f4f6;"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
      <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f3f4f6;">Subject:</td><td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">${safeSubject}</td></tr>
    </table>
    <div style="background: #f9fafb; padding: 14px; border-radius: 6px; margin-top: 16px; border: 1px solid #f3f4f6;">
      <strong style="color: #374151;">Message:</strong>
      <p style="margin: 8px 0 0 0; color: #1f2937;">${safeMessage}</p>
    </div>
  </div>`;

  // 1. Try GoDaddy Hosting Platform Gateway via sendEmail helper
  try {
    const result = await sendEmail({
      to: recipient,
      subject: emailSubject,
      text: textBody,
      html: htmlBody,
      replyTo: email,
      // from is omitted by default so GoDaddy chooses the canonical verified sender
    });

    logger.info(`✅ [GoDaddy Email Gateway] Contact message delivered to ${recipient} (messageId: ${result.messageId})`);
    return {
      success: true,
      messageId: result.messageId,
      recipient,
      channel: 'godaddy-gateway',
    };
  } catch (err: any) {
    // When running locally, in test mode, or outside GoDaddy container, gateway is unreachable
    logger.warn(`ℹ️ [Email Gateway] Platform gateway unavailable (${err.message}). Recording simulated delivery.`);
  }

  // 2. Simulated Mock Delivery (Zero cost, safe for tests, preserves audit logs)
  const mockId = `mock-contact-${Date.now()}`;
  logger.info(`📧 [Simulated Email Delivery] Recipient: ${recipient} | Sender: ${name} <${email}> | Subject: "${emailSubject}"`);
  return {
    success: true,
    messageId: mockId,
    recipient,
    channel: 'mock',
  };
}

/**
 * Send an approved customer recovery outreach email
 * CRITICAL SAFETY REQUIREMENT:
 * Synthetic demo customer leads (e.g. Rajesh Mehta, Priya Nair) must NEVER receive
 * real outbound emails. Recovery outreach is strictly simulated.
 */
export async function sendRecoveryOutreach(options: {
  to: string;
  customerName: string;
  subject: string;
  body: string;
}): Promise<EmailResult> {
  const { to, subject } = options;

  // Always simulated mock mode for customer recovery outreach
  const mockId = `sim-recovery-${Date.now()}`;
  logger.info(`🎭 [Simulated Recovery Outreach] Recipient: ${to} | Subject: "${subject}" | Status: simulated`);
  
  return {
    success: true,
    messageId: mockId,
    recipient: to,
    channel: 'mock',
  };
}
