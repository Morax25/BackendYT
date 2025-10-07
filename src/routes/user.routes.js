// routes/user.routes.js
import { Router } from 'express';
import {
  logOutUser,
  registerUser,
  userLogin,
} from '../controllers/user.controller.js';
import upload from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

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

export default router;
