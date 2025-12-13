import { Request, Response } from 'express';
import { OrganizerRepository } from '../repositories/OrganizerRepository';
import { generateToken } from '../utils/jwt';

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