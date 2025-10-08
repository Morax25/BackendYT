import { z } from 'zod';
import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';

const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId format',
  });

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must not exceed 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters long')
  .max(30, 'Username must not exceed 30 characters')
  .regex(
    /^[a-z0-9_-]+$/,
    'Username can only contain lowercase letters, numbers, hyphens, and underscores'
  )
  .transform((val) => val.toLowerCase().trim());

const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email must not exceed 255 characters')
  .transform((val) => val.toLowerCase().trim())
  .refine(
    (email) => {
      const disposableDomains = [
        'tempmail.com',
        '10minutemail.com',
        'guerrillamail.com',
      ];
      const domain = email.split('@')[1];
      return !disposableDomains.includes(domain);
    },
    { message: 'Disposable email addresses are not allowed' }
  );

const fullNameSchema = z
  .string()
  .min(2, 'Full name must be at least 2 characters long')
  .max(100, 'Full name must not exceed 100 characters')
  .regex(
    /^[a-zA-Z\s'-]+$/,
    'Full name can only contain letters, spaces, hyphens, and apostrophes'
  )
  .transform((val) => val.trim())
  .refine((name) => name.split(' ').filter(Boolean).length >= 1, {
    message: 'Full name must contain at least one word',
  });

const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL must not exceed 2048 characters')
  .refine(
    (url) => {
      if (process.env.NODE_ENV === 'production') {
        return url.startsWith('https://');
      }
      return true;
    },
    { message: 'Only HTTPS URLs are allowed in production' }
  );

const watchHistorySchema = z
  .array(objectIdSchema)
  .max(1000, 'Watch history cannot exceed 1000 videos')
  .default([]);

export const userRegistrationSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  fullName: fullNameSchema,
  avatar: urlSchema,
  coverImage: urlSchema.optional(),
  password: passwordSchema,
});

export const userLoginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Username or email is required')
    .transform((val) => val.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required'),
});

export const userUpdateSchema = z
  .object({
    username: usernameSchema.optional(),
    email: emailSchema.optional(),
    fullName: fullNameSchema.optional(),
    avatar: urlSchema.optional(),
    coverImage: urlSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export const watchHistoryUpdateSchema = z.object({
  videoId: objectIdSchema,
});

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token is required')
    .max(500, 'Invalid refresh token format'),
});

export const userSchema = z.object({
  _id: objectIdSchema.optional(),
  username: usernameSchema,
  email: emailSchema,
  fullName: fullNameSchema,
  avatar: urlSchema,
  coverImage: urlSchema.optional(),
  watchHistory: watchHistorySchema,
  password: z.string(),
  refreshToken: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const emailVerificationSchema = z.object({
  email: emailSchema,
  verificationCode: z
    .string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must contain only digits'),
});

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export const passwordResetSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const userQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, { message: 'Page must be greater than 0' }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, {
      message: 'Limit must be between 1 and 100',
    }),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['username', 'email', 'fullName', 'createdAt']).optional(),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

function parseErrors(errorString) {
  const errors = {};

  errorString.split(',').forEach(entry => {
    const [key, message] = entry.split(/:(.+)/); // split on first colon only
    if (!key || !message) return;

    const field = key.trim();
    const msg = message.trim();

    if (!errors[field]) {
      errors[field] = [];
    }

    errors[field].push(msg);
  });

  return errors;
}

// Simplified validation middleware using ApiError
export const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataSource =
        source === 'query'
          ? req.query
          : source === 'params'
            ? req.params
            : req.body;
      const validatedData = schema.parse(dataSource);
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues
          .map((err) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        throw new ApiError(400, errorMessage, parseErrors(errorMessage))
      }
      return next(new ApiError(500, 'Validation error occurred'));
    }
  };
};

// Alternative: More detailed validation errors
export const validateRequestDetailed = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataSource =
        source === 'query'
          ? req.query
          : source === 'params'
            ? req.params
            : req.body;
      const validatedData = schema.parse(dataSource);
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        const errorMessage = `Validation failed: ${formattedErrors.map((e) => e.message).join(', ')}`;
        return next(new ApiError(400, errorMessage, formattedErrors));
      }
      return next(new ApiError(500, 'Validation error occurred'));
    }
  };
};
