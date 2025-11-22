// backend/src/controllers/emailController.ts
import { Request, Response } from 'express';
import emailService from '../services/emailService';

export const sendTestEmail = async (req: Request, res: Response) => {
  try {
    console.log('📧 Email controller called with body:', req.body);
    
    const { to, subject } = req.body;

    // Validar campos requeridos
    if (!to) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required field: to (email address)' 
      });
    }

    console.log('📤 Sending email to:', to);
    
    // Enviar email
    const data = await emailService.sendTestEmail(to, subject);

    res.json({
      success: true,
      message: 'Test email sent successfully',
      data: {
        id: data?.id,
        to: to
      }
    });
  } catch (error) {
    console.error('❌ Error in sendTestEmail controller:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};