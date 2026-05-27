import express from 'express';
import { register, login, refresh, logout, getMe, updateMe, googleLogin } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validateLogin, validateRegister } from '../middleware/validate.js';

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/google', googleLogin);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

export default router;
