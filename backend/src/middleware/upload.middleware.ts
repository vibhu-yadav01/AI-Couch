import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

// Ensure upload directories exist
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir('uploads/resumes');
ensureDir('uploads/audio');

// ─── Resume Upload (PDF / DOCX) ─────────────────────────────────────────────
const resumeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/resumes/');
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const resumeFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = ['.pdf', '.docx', '.doc'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    const error = new Error('Only PDF and DOCX files are allowed for resume upload') as any;
    error.status = 400;
    cb(error);
  }
};

export const resumeUpload = multer({
  storage: resumeStorage,
  fileFilter: resumeFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ─── Audio Upload (MP3 / WAV / M4A / WEBM) ──────────────────────────────────
const audioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/audio/');
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.webm';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const audioFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/webm', 
    'audio/ogg', 'audio/x-m4a', 'audio/x-caf', 'audio/caf', 'audio/aac', 'audio/3gpp'
  ];
  const allowedExts = ['.mp3', '.wav', '.m4a', '.webm', '.ogg', '.caf', '.aac', '.3gp'];
  const ext = path.extname(file.originalname).toLowerCase();
  const baseMime = file.mimetype ? file.mimetype.split(';')[0].toLowerCase().trim() : '';

  console.log('[upload.middleware] Audio file upload attempt:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    baseMime,
    ext
  });

  if (allowedMimes.includes(file.mimetype) || allowedMimes.includes(baseMime) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    const errorMsg = `Unsupported audio format. Received mimetype: '${file.mimetype}', extension: '${ext}'`;
    console.warn('[upload.middleware] Rejected audio file upload:', errorMsg);
    const error = new Error(errorMsg) as any;
    error.status = 400;
    cb(error);
  }
};

export const audioUpload = multer({
  storage: audioStorage,
  fileFilter: audioFileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});
