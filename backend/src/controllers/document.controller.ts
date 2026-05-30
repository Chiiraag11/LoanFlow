import { Request, Response } from 'express';
import Document from '../models/Document';

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const doc = await Document.create({
      borrowerId: req.user!.userId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
    });

    res.status(201).json({ message: 'Document uploaded successfully', document: doc });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyDocuments = async (req: Request, res: Response) => {
  try {
    const docs = await Document.find({ borrowerId: req.user!.userId }).sort({ createdAt: -1 });
    res.json({ documents: docs });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
