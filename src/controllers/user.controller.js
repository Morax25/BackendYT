import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import uploadOnCloudinary from '../utils/cloudinary.js';
import ApiResponse from '../utils/ApiResponse.js';
import fs from 'fs';

//User Register

export const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;
  if (
    [fullName, email, username, password].some((field) => field?.trim() === '')
  ) {
    throw new ApiError(400, 'All fields are required');
  }
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    fs.unlinkSync(req.files.avatar[0].path);
    throw new ApiError(409, 'User already exists');
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req?.files?.cover?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, 'avatar is required');
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const cover = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, 'avatar is required');
  }

  const user = await User.create({
    fullName: fullName,
    email: email,
    avatar: avatar?.url,
    cover: cover?.url || '',
    password: password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    '-password -refreshToken -watchHistory'
  );

  if (!createdUser) {
    throw new ApiError(
      500,
      'Something went wrong while registering the user please try again'
    );
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, 'User registered successfully'));
});

//User Login

const generateActionAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      'Something went wrong while generating refresh and access token'
    );
  }
};

export const userLogin = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  if (!username || !email)
    throw new ApiError(400, 'Username or Email is required');
  if (!password) throw new ApiError(400, 'Password is Required');
  const user = await User.findOne({
    $or: [{ username, email }],
  });
  if (!user) {
    throw new ApiError(404, 'User does not exists');
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid Password or Email');
  }
  const { accessToken, refreshToken } = await generateActionAndRefreshToken(
    user._id
  );
  const loggedInUser = User.findById(user._id).select(
    '-password -refreshToken'
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
        'User logged in successfully'
      )
    );
});

//Logout User

export const logOutUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie('AccessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200, {}, 'User logged out'));
});
