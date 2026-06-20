import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import Resume from '../models/Resume';
import User from '../models/User';
import * as aiService from '../services/ai.service';
import * as storageService from '../services/storage.service';
import { AuthRequest } from '../types';

export const uploadResume = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No resume file uploaded' });
      return;
    }

    const localPath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    let rawText = '';

    try {
      if (ext === '.pdf') {
        const fileBuffer = fs.readFileSync(localPath);
        const pdfData = await pdfParse(fileBuffer);
        rawText = pdfData.text;
      } else if (ext === '.docx' || ext === '.doc') {
        const docxResult = await mammoth.extractRawText({ path: localPath });
        rawText = docxResult.value;
      } else {
        res.status(400).json({ success: false, error: 'Unsupported file format' });
        return;
      }
    } catch (parseError: any) {
      console.error('File parsing error:', parseError);
      res.status(400).json({ success: false, error: 'Failed to extract text from file. Please ensure the file is not corrupted.' });
      return;
    }

    if (!rawText.trim()) {
      res.status(400).json({ success: false, error: 'No readable text could be found in the resume.' });
      return;
    }

    // Call AI to parse structured data
    const parsedData = await aiService.parseResume(rawText);

    // Upload file to active storage provider (local or S3)
    const fileUrl = await storageService.uploadFile(
      localPath,
      `resumes/${req.file.filename}`,
      req.file.mimetype
    );

    // Create resume document in database
    const resume = await Resume.create({
      userId: req.user?.id,
      parsedData,
      rawText,
      uploadedAt: new Date()
    });

    // Update user's resumeUrl
    await User.findByIdAndUpdate(req.user?.id, { resumeUrl: fileUrl });

    res.status(201).json({
      success: true,
      message: 'Resume parsed and saved successfully',
      data: {
        resumeId: resume._id,
        fileUrl,
        parsedData
      }
    });
  } catch (err: any) {
    console.error('Upload resume error:', err);
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
};

export const getResume = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user?.id });
    if (!resume) {
      res.status(404).json({ success: false, error: 'Resume not found' });
      return;
    }
    res.json({ success: true, data: resume });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
};

export const getUserResume = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resume = await Resume.findOne({ userId: req.user?.id }).sort({ uploadedAt: -1 });
    if (!resume) {
      res.status(404).json({ success: false, error: 'No resume found for this user' });
      return;
    }
    res.json({ success: true, data: resume });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
};
