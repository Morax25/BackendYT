import { Router } from 'express';
import {
  changeCurrentPassword,
  getUser,
  getUserChannelProfile,
  logOutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  userLogin,
} from '../controllers/user.controller.js';
import upload from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  validateRequest,
  userRegistrationSchema,
} from '../validators/user.validator.js';
import { uploadFile } from '../controllers/fileUpload.controller.js';

const router = Router();
router.post('/register', validateRequest(userRegistrationSchema), registerUser);
router.post('/login', userLogin);

//secure routes
router.post('/upload', upload.array('files', 2), uploadFile);
router.post('/logout', verifyJWT, logOutUser);
router.post('/change-password', verifyJWT, changeCurrentPassword);
router.post('/refresh-token', refreshAccessToken);
router.get('/get-user', verifyJWT, getUser);
router.post('/update-account', verifyJWT, updateAccountDetails);
router.get('/channel/:username', verifyJWT,getUserChannelProfile)

export default router;
