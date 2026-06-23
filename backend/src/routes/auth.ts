import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-travel-key-123';

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Please enter all fields (name, email, password).' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await UserRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      res.status(400).json({ error: 'An account with this email already exists.' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await UserRepository.createUser({
      name,
      email: normalizedEmail,
      passwordHash
    });

    // Create JWT
    const token = jwt.sign(
      { id: newUser.id || newUser._id.toString(), email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id || newUser._id.toString(),
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error. Failed to register user.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Please enter all fields (email, password).' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserRepository.findByEmail(normalizedEmail);
    if (!user) {
      res.status(400).json({ error: 'Invalid email or password.' });
      return;
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ error: 'Invalid email or password.' });
      return;
    }

    // Create JWT
    const token = jwt.sign(
      { id: user.id || user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id || user._id.toString(),
        name: user.name,
        email: user.email
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error. Failed to log in.' });
  }
});

export default router;
