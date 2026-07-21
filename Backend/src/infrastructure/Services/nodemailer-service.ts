// infrastructure/services/NotificationService.ts

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { injectable } from 'inversify';
import { IEmailService } from '../../domain/Repository/i-email-repository';
import { videoCallInvitationEmail } from '../../service/email-service';
dotenv.config();

@injectable()
export class EmailService implements IEmailService {
  private transporter: any = null;
  private emailService: string = 'gmail';
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.emailService = this.getEmailService();
    this.initPromise = this.initializeTransporter();
  }

  private getEmailService(): string {
    return (process.env.EMAIL_SERVICE || 'gmail').trim().toLowerCase();
  }

  private getResendApiKey(): string {
    return (process.env.RESEND_API_KEY || process.env.EMAIL_PASS || '').trim();
  }

  private getResendFrom(): string {
    return (process.env.RESEND_FROM || 'onboarding@resend.dev').trim();
  }

  private isEmailEnabled(): boolean {
    return process.env.ENABLE_EMAIL === 'true';
  }

  private async refreshProviderIfChanged(): Promise<void> {
    const currentService = this.getEmailService();
    if (currentService !== this.emailService) {
      this.emailService = currentService;
      this.transporter = null;
      this.initPromise = this.initializeTransporter();
    }
  }

  private async initializeTransporter() {
    if (this.emailService === 'resend') {
      console.log('[RESEND] Using Resend email service');
      return;
    } else if (this.emailService === 'ethereal') {
      try {
        // Generate test account
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.log(`[ETHEREAL] Test email account ready. Emails will be previewed.`);
      } catch (error) {
        console.error('[ETHEREAL] Failed to create test account:', error);
        this.transporter = this.createGmailTransporter();
      }
    } else if (this.emailService === 'mailtrap') {
      this.transporter = nodemailer.createTransport({
        host: 'live.smtp.mailtrap.io',
        port: 587,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      console.log('[MAILTRAP] Using Mailtrap email service');
    } else {
      this.transporter = this.createGmailTransporter();
      console.log('[GMAIL] Using Gmail email service');
    }
  }

  private createGmailTransporter() {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  private async ensureTransporter() {
    if (this.emailService === 'resend') {
      return;
    }

    if (this.initPromise) {
      await this.initPromise;
    }
  }

  private async sendViaResend(to: string, subject: string, html: string): Promise<void> {
    const resendApiKey = this.getResendApiKey();
    if (!resendApiKey || resendApiKey === 're_your_resend_api_key') {
      throw new Error('Resend API key is missing or placeholder. Set RESEND_API_KEY in .env');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: this.getResendFrom(),
        to,
        subject,
        html,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(`Resend API error: ${result?.message || JSON.stringify(result)}`);
    }

    console.log(`✅ [EMAIL SUCCESS] Email sent via Resend to: ${to}`);
    console.log(`📧 Message ID: ${result.id}`);
  }

  private async sendMail(to: string, subject: string, html: string): Promise<void> {
    await this.refreshProviderIfChanged();

    if (this.emailService === 'resend') {
      const resendApiKey = this.getResendApiKey();
      const resendLooksConfigured =
        resendApiKey && resendApiKey !== 're_your_resend_api_key';

      if (resendLooksConfigured) {
        await this.sendViaResend(to, subject, html);
        return;
      }

      const gmailUser = (process.env.EMAIL_USER || '').trim();
      const gmailPass = (process.env.EMAIL_PASS || '').trim();

      if (gmailUser && gmailPass) {
        console.warn('[EMAIL] RESEND_API_KEY is missing/placeholder. Falling back to Gmail transport.');
        const gmailTransporter = this.createGmailTransporter();
        await gmailTransporter.sendMail({
          from: `"Complaint Management System" <${gmailUser}>`,
          to,
          subject,
          html,
        });
        console.log(`✅ [EMAIL SUCCESS] Email sent via Gmail fallback to: ${to}`);
        return;
      }

      throw new Error(
        'Resend is selected but RESEND_API_KEY is missing/placeholder, and Gmail fallback credentials are not set. Configure RESEND_API_KEY or EMAIL_USER+EMAIL_PASS.'
      );
    }

    await this.ensureTransporter();
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }

    const result = await this.transporter.sendMail({
      from: `"Complaint Management System" <${this.emailService === 'ethereal' ? 'test@ethereal.email' : (process.env.EMAIL_USER || 'noreply@zenster.com')}>`,
      to,
      subject,
      html,
    });

    if (this.emailService === 'ethereal') {
      const previewUrl = nodemailer.getTestMessageUrl(result);
      console.log(`\n✅ [EMAIL SUCCESS] Email sent!`);
      console.log(`📧 Preview URL: ${previewUrl}\n`);
    } else {
      console.log(`✅ [EMAIL SUCCESS] Email sent to: ${to}`);
    }
  }

  async sendResetOTP(email: string, otp: string): Promise<void> {
    if (!this.isEmailEnabled()) {
      console.log(`[EMAIL DISABLED] Reset OTP email would be sent to: ${email}`);
      return;
    }
    await this.sendMail(
      email,
      'Password Reset OTP',
      `<div>...Your OTP is ${otp}...</div>`
    );
  }

  async sendComplaintStatusUpdate(email: string, complaintId: string, status: string, comments?: string): Promise<void> {
    if (!this.isEmailEnabled()) {
      console.log(`[EMAIL DISABLED] Status update email for complaint ${complaintId} would be sent to: ${email}`);
      return;
    }
    const statusMap = {
      in_progress: { text: 'In Progress', color: '#f59e0b' },
      resolved: { text: 'Resolved', color: '#10b981' },
      rejected: { text: 'Rejected', color: '#ef4444' },
      default: { text: 'Submitted', color: '#3b82f6' }
    };

    const { text: statusText, color: statusColor } = statusMap[status as keyof typeof statusMap] || statusMap.default;

    await this.sendMail(
      email,
      `Complaint Status Update: ${statusText}`,
      `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Complaint Status Update</h2>
          <p>Your complaint (ID: ${complaintId}) is now <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span>.</p>
          ${comments ? `<p>Comments: ${comments}</p>` : ''}
        </div>`
    );
  }

  async sendComplaintReassignmentEmail(email: string, data: any): Promise<void> {
    await this.sendMail(
      email,
      `Complaint Reassigned (ID: ${data.complaintId})`,
      `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Complaint Reassignment</h2>
          <p>Product: ${data.productName}</p>
          <p>Rejected by: ${data.oldMechanic.name}</p>
          <p>Reason: ${data.rejectionReason}</p>
          <p>New Mechanic: ${data.newMechanic.name}</p>
        </div>`
    );
  }

  async sendNoMechanicAvailableEmail(data: any): Promise<void> {
    await this.sendMail(
      data.recipientEmail,
      `No Mechanic Available for Complaint ${data.complaintId}`,
      `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: red;">Urgent: No Mechanic Available</h2>
          <p>Product: ${data.productName}</p>
          <p>Reason: ${data.rejectionReason}</p>
        </div>`
    );
  }

  async sendUniversalSMS(phoneNumber: string, message: string): Promise<boolean> {
    const smsTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const cleanNumber = phoneNumber.replace(/\D/g, '');
    const gateways = [
      '@vtext.com', '@txt.att.net', '@tmomail.net',
      '@messaging.sprintpcs.com', '@msg.fi.google.com', '@email.uscc.net'
    ];

    for (const gateway of gateways) {
      try {
        await smsTransporter.sendMail({
          from: `"Complaint System" <${process.env.EMAIL_USER}>`,
          to: `${cleanNumber}${gateway}`,
          text: message.substring(0, 160),
          subject: ''
        });
        return true;
      } catch (err) {
        console.warn(`Failed via ${gateway}`);
      }
    }

    throw new Error('All SMS gateways failed');
  }

  async sendEmployeeWelcomeEmail(email: string, name: string, password?: string): Promise<void> {
    await this.refreshProviderIfChanged();
    console.log(`[EMAIL SERVICE] Starting sendEmployeeWelcomeEmail - Service: ${this.emailService}, Enabled: ${this.isEmailEnabled()}`);
    
    if (!this.isEmailEnabled()) {
      console.log(`[EMAIL DISABLED] Welcome email for ${name} would be sent to: ${email}`);
      return;
    }

    console.log(`[EMAIL] Sending welcome email to: ${email}`);
    
    try {
      await this.sendMail(
        email,
        'Welcome to Zenster!',
        `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Welcome, ${name} 👋</h2>
            <p>Your account has been created.</p>
            ${password ? `<p><strong>Password:</strong> ${password}</p>` : ""}
            <p>Log in and update your password ASAP.</p>
          </div>`
      );
    } catch (error) {
      console.error("[EMAIL ERROR] Failed to send email:", error);
      throw error;
    }
  }

   async sendVideoCallInvitation(
    recipientEmail: string,
    recipientName: string,
    initiatorName: string,
    callLink: string
  ): Promise<void> {
    if (!this.isEmailEnabled()) {
      console.log(`[EMAIL DISABLED] Video call invitation for ${recipientName} would be sent to: ${recipientEmail}`);
      return;
    }
    try {
      await this.sendMail(
        recipientEmail,
        `Video Call Invitation from ${initiatorName}`,
        videoCallInvitationEmail({
          recipientName,
          callInitiator: initiatorName,
          callLink,
        })
      );
    } catch (error) {
      console.error('Error sending video call invitation:', error);
      throw new Error('Failed to send video call invitation');
    }
  }
}
