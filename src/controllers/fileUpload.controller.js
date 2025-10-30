import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import uploadOnCloudinary from '../utils/cloudinary.js';

export const uploadFile = asyncHandler(async (req, res) => {
  const { files } = req;
  if (!files?.length) {
    throw new ApiError(400, 'No files provided');
  }
  const uploadResults = await Promise.all(
    files.map((file) => uploadOnCloudinary(file.path))
  );
  const result = uploadResults.map((item) => ({
    url: item.url,
    public_id: item.public_id,
    size: item.bytes,
  }));
  return res
    .status(201)
    .json(new ApiResponse(201, 'Files uploaded successfully', result));
});
