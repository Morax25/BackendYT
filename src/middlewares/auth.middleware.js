import { ACCESS_TOKEN_SECRET } from '../constants.js';
import { User } from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken';

export const verifyJWT = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);

  if (!token) {
    throw new ApiError(402, 'Unauthorized Request');
  }

  const decoded = verifyToken(token);
  req.user = createUserPayload(decoded);

  next();
});

export const attachFullUser = asyncHandler(async (req, _res, next) => {
  if (!req.user?._id) {
    throw new ApiError(401, 'Authentication required');
  }

  const user = await fetchUserById(req.user._id);

  if (!user) {
    throw new ApiError(401, 'User not found or has been deleted');
  }

  req.user = user;
  next();
});

export const requireRole = (...roles) => {
  return asyncHandler(async (req, _res, next) => {
    if (!req.user?.role) {
      throw new ApiError(403, 'Access denied');
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'Insufficient permissions');
    }

    next();
  });
};

const extractToken = (req) => {
  const cookieToken = req.cookies?.accessToken;
  const headerToken = req.headers?.authorization?.replace(/^Bearer\s+/i, '');
  return cookieToken || headerToken || null;
};

const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);

    if (!decoded._id) {
      throw new ApiError(401, 'Invalid token payload');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, 'Access token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, 'Invalid access token');
    }
    throw error;
  }
};

const createUserPayload = (decoded) => ({
  _id: decoded._id,
  email: decoded.email,
  role: decoded.role,
  username: decoded.username,
});

const fetchUserById = async (userId) => {
  const user = await User.findById(userId)
    .select('-password -refreshToken')
    .lean();
  return user;
};
