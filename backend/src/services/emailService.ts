import { Resend } from 'resend';

class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendTestEmail(to: string, subject: string = 'Test Email from Eventify') {
    try {
      const { data, error } = await this.resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: [to], // Note: en la versión 6.5.2, `to` es un array de strings
        subject: subject,
        html: this.getTestEmailTemplate(),
      });

      if (error) {
        throw new Error(`Email error: ${error.message}`);
      }

      console.log('✅ Email enviado exitosamente:', data?.id);
      return data;
    } catch (error) {
      console.error('❌ Error enviando email:', error);
      throw error;
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<any> {
  try {
    const { data, error } = await this.resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      throw new Error(`Email error: ${error.message}`);
    }

    console.log('✅ Email enviado exitosamente:', data?.id);
    return data;
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    throw error;
  }
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