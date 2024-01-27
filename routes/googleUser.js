import express from 'express'
import { getUserData, saveSound, removeSound } from '../controllers/auth.js'
import { deleteSound } from '../controllers/sounds.js'
import { googleProtect } from '../middleware/googleProtect.js'

const router = express.Router()

// User Data Route
router.get('/:userId', getUserData)
router.put('/:userId/saveSound/:soundId', googleProtect, saveSound)
router.put('/:userId/removeSound/:soundId', googleProtect, removeSound)
router.delete('/:userId/deleteSound/:soundId', googleProtect, deleteSound)

export default router
