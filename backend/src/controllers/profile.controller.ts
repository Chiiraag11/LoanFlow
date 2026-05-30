import { Request, Response } from 'express';
import BorrowerProfile from '../models/BorrowerProfile';
import { runBRE } from '../services/bre.service';

export const createOrUpdateProfile = async (req: Request, res: Response) => {
  try {
    const { fullName, pan, dateOfBirth, monthlySalary, employmentMode } = req.body;
    const userId = req.user!.userId;

    const panUpper = pan.toUpperCase();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panUpper)) {
      return res.status(400).json({ message: 'Invalid PAN format. Expected format: ABCDE1234F' });
    }

    const breResult = runBRE({ dateOfBirth: new Date(dateOfBirth), monthlySalary: Number(monthlySalary), pan: panUpper, employmentMode });
    if (!breResult.passed) {
      return res.status(422).json({ message: 'Application rejected by Business Rule Engine', reason: breResult.reason, breRejected: true });
    }

    const profile = await BorrowerProfile.findOneAndUpdate(
      { userId },
      { userId, fullName, pan: panUpper, dateOfBirth: new Date(dateOfBirth), monthlySalary: Number(monthlySalary), employmentMode },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Profile saved successfully', profile });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const profile = await BorrowerProfile.findOne({ userId: req.user!.userId });
    res.json({ profile });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
