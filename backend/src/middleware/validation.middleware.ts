import { Request, Response, NextFunction } from 'express';
import { validationResult, body, param, ValidationChain } from 'express-validator';

/**
 * Generic middleware to execute validation chains and return error list
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations in parallel
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: errors.array().map((err) => ({
        field: (err as any).path || '',
        message: err.msg,
      })),
    });
  };
};

// ─── AUTHENTICATION VALIDATORS ──────────────────────────────────────────────

export const registerRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('targetRole')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Target role cannot exceed 100 characters'),
  body('experienceLevel')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Experience level must be beginner, intermediate, or advanced'),
];

export const loginRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const updateProfileRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('targetRole')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Target role cannot exceed 100 characters'),
  body('experienceLevel')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Experience level must be beginner, intermediate, or advanced'),
];

// ─── INTERVIEW VALIDATORS ───────────────────────────────────────────────────

export const startInterviewRules = [
  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isLength({ max: 100 })
    .withMessage('Role cannot exceed 100 characters'),
  body('type')
    .notEmpty()
    .withMessage('Interview type is required')
    .isIn(['behavioral', 'technical', 'hr', 'mixed'])
    .withMessage('Interview type must be behavioral, technical, hr, or mixed'),
  body('difficulty')
    .notEmpty()
    .withMessage('Difficulty is required')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be beginner, intermediate, or advanced'),
  body('duration')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('Duration must be between 1 and 60 minutes'),
];

export const submitTextAnswerRules = [
  param('interviewId')
    .isMongoId()
    .withMessage('Invalid Interview ID'),
  body('answerText')
    .notEmpty()
    .withMessage('Answer text is required')
    .isLength({ max: 5000 })
    .withMessage('Answer text cannot exceed 5000 characters'),
];

export const submitVoiceAnswerRules = [
  param('interviewId')
    .isMongoId()
    .withMessage('Invalid Interview ID'),
  body('duration')
    .optional()
    .isFloat({ min: 0.1 })
    .withMessage('Recording duration must be a valid float greater than 0'),
];
