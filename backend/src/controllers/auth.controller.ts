import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const signToken = (userId: any, email: string, role: string) =>
  (jwt.sign as any)({ userId, email, role }, process.env.JWT_SECRET!, { expiresIn: '7d' });

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const user = new User({ email, password, name, role: role || 'BORROWER' });
    await user.save();

    const token = signToken(user._id, user.email, user.role);
    res.status(201).json({ message: 'Account created successfully', token, user });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' });

    const token = signToken(user._id, user.email, user.role);
    const userObj = user.toJSON();
    res.json({ message: 'Login successful', token, user: userObj });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
