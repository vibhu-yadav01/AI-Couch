import { Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest } from '../types';

const signToken = (id: string, email: string): string => {
  return jwt.sign(
    { id, email },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );
};

// POST /api/auth/register
export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, targetRole, experienceLevel } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, error: 'Name, email and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ success: false, error: 'Email already registered' });
      return;
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      targetRole: targetRole || '',
      experienceLevel: experienceLevel || 'beginner',
    });

    const token = signToken(user._id.toString(), user.email);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          targetRole: user.targetRole,
          experienceLevel: user.experienceLevel,
          resumeUrl: user.resumeUrl,
        },
      },
    });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
};

// POST /api/auth/login
export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    const token = signToken(user._id.toString(), user.email);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          targetRole: user.targetRole,
          experienceLevel: user.experienceLevel,
          resumeUrl: user.resumeUrl,
        },
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
};

// GET /api/auth/profile
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        targetRole: user.targetRole,
        experienceLevel: user.experienceLevel,
        resumeUrl: user.resumeUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
};

// PUT /api/auth/profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, targetRole, experienceLevel } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (targetRole !== undefined) updateData.targetRole = targetRole;
    if (experienceLevel) updateData.experienceLevel = experienceLevel;

    const user = await User.findByIdAndUpdate(req.user?.id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        targetRole: user.targetRole,
        experienceLevel: user.experienceLevel,
        resumeUrl: user.resumeUrl,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
};
