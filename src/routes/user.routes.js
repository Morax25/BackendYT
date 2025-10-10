// routes/user.routes.js
import { Router } from 'express';
import {
  changeCurrentPassword,
  getUser,
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

const router = Router();

router.post(
  '/register',
  upload.fields([
    {
      name: 'avatar',
      maxCount: 1,
    },
    {
      name: 'cover',
      maxCount: 1,
    },
  ]),
  registerUser
);
router.post('/login', userLogin);

//secure routes

router.post('/logout', verifyJWT, logOutUser);
router.post('/change-password', verifyJWT, changeCurrentPassword);
router.post('/refresh-token', refreshAccessToken);
router.get('/get-user', verifyJWT, getUser)
router.post('/update-account', verifyJWT, updateAccountDetails)

export default router;
