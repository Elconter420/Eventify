import { Request, Response } from 'express';
import { OrganizerRepository } from '../repositories/OrganizerRepository';
import { generatePasswordResetToken, generateToken, verifyPasswordResetToken } from '../utils/jwt';
import emailService from '../services/emailService';

const organizerRepo = new OrganizerRepository();

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, full_name } = req.body;

    console.log('🎯 Register attempt:', { email, full_name });

    // Validaciones básicas
    if (!email || !password || !full_name) {
      return res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Email, password, and full name are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'WEAK_PASSWORD', 
        message: 'Password must be at least 6 characters long'
      });
    }

    // Verificar si el email ya existe
    const existingOrganizer = await organizerRepo.findByEmail(email);
    if (existingOrganizer) {
      return res.status(409).json({
        error: 'EMAIL_EXISTS',
        message: 'Email already registered'
      });
    }

    // Crear organizador
    const organizer = await organizerRepo.create({
      email,
      password,
      full_name
    });

    console.log('✅ Organizer created:', organizer.id);

    // Generar token
    const token = generateToken({
      userId: organizer.id,
      email: organizer.email
    });

    res.status(201).json({
      message: 'Organizer registered successfully',
      token,
      user: {
        id: organizer.id,
        email: organizer.email,
        full_name: organizer.full_name
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      error: 'REGISTRATION_FAILED',
      message: 'Internal server error during registration'
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    console.log('🎯 Login attempt:', { email });

    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({
        error: 'MISSING_FIELDS',
        message: 'Email and password are required'
      });
    }

    // Verificar credenciales
    const organizer = await organizerRepo.verifyCredentials(email, password);
    
    if (!organizer) {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      });
    }

    console.log('✅ Login successful:', organizer.id);

    // Generar token
    const token = generateToken({
      userId: organizer.id,
      email: organizer.email
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: organizer.id,
        email: organizer.email,
        full_name: organizer.full_name
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      error: 'LOGIN_FAILED',
      message: 'Internal server error during login'
    });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    console.log('🎯 Profile request from user:', req.user);
    
    const organizer = await organizerRepo.findById(req.user!.userId);
    
    if (!organizer) {
      return res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    // No retornar información sensible
    const { password_hash, ...organizerWithoutPassword } = organizer;

    res.json({
      user: organizerWithoutPassword
    });

  } catch (error) {
    console.error('❌ Profile error:', error);
    res.status(500).json({
      error: 'PROFILE_FETCH_FAILED',
      message: 'Error fetching user profile'
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Access token required'
      });
    }

    const { full_name } = req.body as { full_name?: string };

    if (typeof full_name !== 'string' || full_name.trim().length < 2) {
      return res.status(400).json({
        error: 'INVALID_FULL_NAME',
        message: 'Full name must be at least 2 characters'
      });
    }

    const updated = await organizerRepo.updateProfileName(req.user.userId, full_name.trim());

    if (!updated) {
      return res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    return res.json({
      message: 'Profile updated',
      user: updated
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    return res.status(500).json({
      error: 'PROFILE_UPDATE_FAILED',
      message: 'Internal server error updating profile'
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        error: 'MISSING_EMAIL',
        message: 'Email is required'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const organizer = await organizerRepo.findByEmail(normalizedEmail);

    // Responder siempre 200 para evitar enumeración de usuarios
    if (!organizer) {
      return res.json({
        message: 'Si el correo existe, te enviaremos un enlace para restablecer tu contraseña.'
      });
    }

    const token = generatePasswordResetToken({
      userId: organizer.id,
      email: organizer.email,
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${encodeURIComponent(token)}`;

    await emailService.sendEmail(
      organizer.email,
      'Restablecer contraseña - Eventify',
      `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Restablecer contraseña</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h1 style="color: #6366f1; text-align: center;">🔒 Restablecer contraseña</h1>
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p>Recibimos una solicitud para restablecer tu contraseña.</p>
                <p>Haz clic en el botón para crear una nueva contraseña:</p>
                <div style="text-align: center; margin: 24px 0;">
                  <a href="${resetUrl}" style="display: inline-block; padding: 12px 22px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Restablecer contraseña
                  </a>
                </div>
                <p style="font-size: 12px; color: #64748b;">
                  Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                  <a href="${resetUrl}" style="color: #6366f1;">${resetUrl}</a>
                </p>
                <p style="font-size: 12px; color: #64748b; margin-top: 16px;">
                  Este enlace expira en 1 hora. Si no solicitaste esto, puedes ignorar este correo.
                </p>
              </div>
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 14px;">Enviado por Eventify</p>
              </div>
            </div>
          </body>
        </html>
      `
    );

    return res.json({
      message: 'Si el correo existe, te enviaremos un enlace para restablecer tu contraseña.'
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    return res.status(500).json({
      error: 'FORGOT_PASSWORD_FAILED',
      message: 'Internal server error'
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body as { token?: string; password?: string };

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        error: 'MISSING_TOKEN',
        message: 'Token is required'
      });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        error: 'MISSING_PASSWORD',
        message: 'Password is required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'WEAK_PASSWORD',
        message: 'Password must be at least 6 characters long'
      });
    }

    let payload;
    try {
      payload = verifyPasswordResetToken(token);
    } catch {
      return res.status(400).json({
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      });
    }

    if (payload.purpose !== 'password_reset') {
      return res.status(400).json({
        error: 'INVALID_TOKEN',
        message: 'Invalid token'
      });
    }

    const organizer = await organizerRepo.findById(payload.userId);
    if (!organizer) {
      return res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: 'User not found'
      });
    }

    const updated = await organizerRepo.updatePassword(payload.userId, password);
    if (!updated) {
      return res.status(500).json({
        error: 'PASSWORD_UPDATE_FAILED',
        message: 'Could not update password'
      });
    }

    return res.json({
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    return res.status(500).json({
      error: 'RESET_PASSWORD_FAILED',
      message: 'Internal server error'
    });
  }
};