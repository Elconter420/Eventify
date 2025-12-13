import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

class EmailService {
  private resend: Resend | null = null;
  private smtp: Transporter | null = null;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey || apiKey === 'tu_api_key_de_resend_aqui') {
      console.warn('⚠️  RESEND_API_KEY no configurada. servicio de email en modo simulación.');
      this.resend = null;
    } else {
      this.resend = new Resend(apiKey);
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      this.smtp = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      console.log('✅ SMTP configurado');
    }
  }

  async sendTestEmail(to: string, subject: string = 'Test Email from Eventify') {
    return this.sendEmail(to, subject, this.getTestEmailTemplate());
  }

  async sendEmail(to: string, subject: string, html: string): Promise<any> {
  const from = process.env.RESEND_FROM_EMAIL;

  // 1) Preferir Resend si está configurado
  if (this.resend && from) {
    try {
      const { data, error } = await this.resend.emails.send({
        from,
        to: [to],
        subject,
        html,
      });

      if (error) {
        throw new Error(`Email error: ${error.message}`);
      }

      console.log('✅ Email enviado por Resend:', data?.id);
      return { ...data, provider: 'resend' };
    } catch (error) {
      console.warn('⚠️  Resend falló, intentando SMTP...', error);
      // continúa a SMTP
    }
  }

  // 2) Fallback SMTP (Gmail/Outlook/etc.) si está configurado
  if (this.smtp) {
    const smtpFrom = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const info = await this.smtp.sendMail({
      from: smtpFrom,
      to,
      subject,
      html,
    });
    console.log('✅ Email enviado por SMTP:', info.messageId);
    return { id: info.messageId, provider: 'smtp' };
  }

  // 3) Último recurso: simulación
  console.log('📧 [MODO SIMULACIÓN] Email a:', to, 'Asunto:', subject);
  if (!from) {
    console.warn('⚠️  RESEND_FROM_EMAIL no configurada. Email en modo simulación.');
  }
  if (!this.resend) {
    console.warn('⚠️  RESEND_API_KEY no configurada (o inválida). Email en modo simulación.');
  }
  if (!this.smtp) {
    console.warn('⚠️  SMTP no configurado. Email en modo simulación.');
  }
  return {
    id: 'simulated-' + Date.now(),
    message: 'Email simulado (configura Resend o SMTP)',
    provider: 'simulated',
  };
}

  async sendEmailSmtpOnly(to: string, subject: string, html: string): Promise<any> {
    // SMTP-only para envíos masivos (evita limitación de Resend sin dominio)
    if (this.smtp) {
      const smtpFrom = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
      const info = await this.smtp.sendMail({
        from: smtpFrom,
        to,
        subject,
        html,
      });
      return { id: info.messageId, provider: 'smtp' };
    }

    console.log('📧 [MODO SIMULACIÓN] Email (SMTP-only) a:', to, 'Asunto:', subject);
    console.warn('⚠️  SMTP no configurado. Email en modo simulación.');
    return {
      id: 'simulated-' + Date.now(),
      message: 'Email simulado (SMTP no configurado)',
      provider: 'simulated',
    };
  }

  async sendRegistrationSuccessEmail(params: {
    to: string;
    attendeeName: string;
    eventTitle: string;
    eventDateISO?: string;
    eventLocation?: string | null;
    cancelUrl?: string;
    smtpOnly?: boolean;
  }): Promise<any> {
    const { to, attendeeName, eventTitle, eventDateISO, eventLocation, cancelUrl, smtpOnly } = params;

    const subject = `Registro exitoso: ${eventTitle}`;

    const dateLabel = eventDateISO
      ? new Date(eventDateISO).toLocaleString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Registro exitoso</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h1 style="color: #6366f1; text-align: center;">✅ Registro exitoso</h1>

            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p>Hola <strong>${attendeeName}</strong>,</p>
              <p>Tu registro al evento <strong>${eventTitle}</strong> fue realizado correctamente.</p>

              ${dateLabel ? `<p><strong>📅 Fecha:</strong> ${dateLabel}</p>` : ''}
              ${eventLocation ? `<p><strong>📍 Lugar:</strong> ${eventLocation}</p>` : ''}

              ${cancelUrl ? `
                <div style="text-align: center; margin: 24px 0;">
                  <a href="${cancelUrl}" style="display: inline-block; padding: 12px 18px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Cancelar mi registro
                  </a>
                </div>
                <p style="font-size: 12px; color: #64748b;">
                  Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                  <a href="${cancelUrl}" style="color: #6366f1;">${cancelUrl}</a>
                </p>
              ` : ''}

              <p style="font-size: 14px; color: #64748b; margin-top: 20px;">
                Si recibiste este correo por error, puedes ignorarlo.
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px;">Enviado por Eventify</p>
            </div>
          </div>
        </body>
      </html>
    `;

    if (smtpOnly) {
      return this.sendEmailSmtpOnly(to, subject, html);
    }

    return this.sendEmail(to, subject, html);
  }

  async sendConfirmationEmail(to: string, token: string): Promise<any> {
    const confirmUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/confirm/${token}`;
    const subject = 'Confirma tu registro al evento';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Confirma tu registro</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h1 style="color: #6366f1; text-align: center;">🎉 ¡Confirma tu registro!</h1>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #334155;">¡Gracias por registrarte!</h2>
              <p>Para completar tu registro, por favor confirma tu correo electrónico haciendo clic en el botón de abajo:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${confirmUrl}" style="display: inline-block; padding: 12px 30px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Confirmar Registro
                </a>
              </div>
              
              <p style="font-size: 14px; color: #64748b;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                <a href="${confirmUrl}" style="color: #6366f1;">${confirmUrl}</a>
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px;">
                Este email fue enviado automáticamente desde Eventify.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    return this.sendEmail(to, subject, html);
  }

  private getTestEmailTemplate(): string {
  return `
    <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Eventify - Test Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h1 style="color: #6366f1; text-align: center;">🎉 ¡Eventify Test Email!</h1>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #334155;">¡Hola desde Eventify!</h2>
              <p>Este es un email de prueba para verificar que nuestro sistema de notificaciones está funcionando correctamente.</p>
              
              <div style="margin: 25px 0;">
                <p><strong>📅 Plataforma:</strong> Sistema de Gestión de Eventos</p>
                <p><strong>🛠 Stack:</strong> Node.js + React + TypeScript</p>
                <p><strong>📧 Servicio:</strong> Resend API</p>
                <p><strong>✅ Estado:</strong> ¡Configuración exitosa!</p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px;">
                Este email fue enviado automáticamente desde el sistema Eventify.
              </p>
            </div>
          </div>
        </body>
      </html>
  `;
}
}

export default new EmailService();