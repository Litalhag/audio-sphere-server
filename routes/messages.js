import express from 'express'
import {
  getMessages,
  addMessage,
  deleteMessage,
} from '../controllers/messages.js'
import Message from '../models/Message.js'
import advancedResults from '../middleware/advancedResults.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Route to get messages between two users
router.get('/:receiverId/:senderId', getMessages)

// Route to send a new message
router.post('/', protect, addMessage)

router.route('/:id').delete(protect, deleteMessage)

export default router
