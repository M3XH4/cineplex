import express from 'express';
import { processChatMessage } from '../controllers/chatbotController.js';

const router = express.Router();

router.post('/message', processChatMessage);

export default router;
