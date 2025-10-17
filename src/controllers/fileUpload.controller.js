import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

export const uploadFile = asyncHandler(async (req, res)=> {
   const files = req.files
   try {
      const uploads = files.map((file)=>(uploadOnCloudinary(file.path)))
      const response = await Promise.all(uploads)
      const filesUrl = response.map((files)=>({url : files.url, public_id:files.public_id, size:files.bytes}))
      console.log("Uploaded files url",filesUrl)
      return res.status(201).json(new ApiResponse(201, "Files uploaded successfully", filesUrl))
   } catch (error) {
      console.log(error)
      throw new ApiError(400, "Error uploading files", error.message)
   }
})