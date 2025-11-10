import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import { REFRESH_TOKEN_SECRET } from '../constants.js';

//User Register
export const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password, avatar, coverImage } =
    req.validatedData;
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    throw new ApiError(409, 'User already exists');
  }

  const user = await User.create({
    fullName: fullName,
    email: email,
    avatar: avatar,
    coverImage: coverImage,
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
    .json(new ApiResponse(201, 'User registered successfully', createdUser));
});

//Generate Refresh and Access Token
const generateActionAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
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

//User Login
export const userLogin = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  if (!username && !email)
    throw new ApiError(400, 'Username or Email is required');
  if (!password) throw new ApiError(400, 'Password is Required');
  const user = await User.findOne({
    $or: [{ username }, { email }],
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
  const loggedInUser = await User.findById(user._id).select(
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
      new ApiResponse(200, 'User logged in successfully', {
        user: loggedInUser,
        accessToken: accessToken,
        refreshToken: refreshToken,
      })
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
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200, {}, 'User logged out'));
});

//Refresh Access Token
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req?.cookies?.refreshToken || req?.body?.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError((400, 'Unauthorized request'));
  }
  try {
    const decodedToken = jwt.verify(incomingRefreshToken, REFRESH_TOKEN_SECRET);
    console.log('type', typeof decodedToken);
    const user = await User.findById(decodedToken?._id);
    if (!user) throw new ApiError(401, 'Invalid refresh token');
    if (incomingRefreshToken !== user?.refreshToken)
      throw new ApiError(401, 'Refresh token is expired');

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateActionAndRefreshToken(user._id);
    res
      .status(200)
      .cookie('accessToken', accessToken)
      .cookie('resfreshToken', newRefreshToken)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            newRefreshToken,
          },
          'Access token refreshed successfully'
        )
      );
  } catch (error) {
    throw new ApiError(401, error.message || 'Invalid refresh token');
  }
});

//Change Password
export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(400, 'Invalid token');
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) throw new ApiError(400, 'Incorrect password');
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, 'Password changed successfully'));
});

//getUser
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req?.user?._id);
  if (!user) throw new ApiError(400, 'user not found or has been deleted');
  return res
    .status(200)
    .json(new ApiResponse(200, 'User found successfully', user));
});

//Update account details
export const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    {
      new: true,
    }
  ).select('-password -refreshToken');
  if (!user) throw new ApiError(400, 'User not found');
  return res
    .status(200)
    .json(new ApiResponse(200, 'Details updated successfully', user));
});
 
//Get user channel profile
export const getUserChannelProfile = asyncHandler(async (req, res) => {

  const { username } = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, 'Please provide a valid username');
  }
  const userId = req.validatedData?._id;
  console.log('this is user', await User.findOne({ username: username }));

  const channel = await User.aggregate([
    {
      $match: { username: username.toLowerCase() },
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'channel',
        as: 'subscribers',
      },
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'subscriber',
        as: 'subscribedTo',
      },
    },
    {
      $addFields: {
        subscribersCount: { $size: '$subscribers' },
        subscribedChannelCount: { $size: '$subscribedTo' },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        subscribedChannelCount: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) throw new ApiError(404, 'Channel does not exist');

  channel[0].isSubscribed = channel[0].subscribers?.some(
    (s) => s.subscriber?.toString() === userId?.toString()
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, 'User channel fetched successfully', channel[0])
    );
});
