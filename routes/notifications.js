import express from 'express'
import {
  getUnreadNotifications,
  markNotificationsAsRead,
} from '../controllers/notifications.js'

const router = express.Router()

router.get('/notifications/:receiverUid', getUnreadNotifications)
router.put('notifications/read/:receiverUid', markNotificationsAsRead)

export default router
