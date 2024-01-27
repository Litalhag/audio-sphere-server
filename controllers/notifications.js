import asyncHandler from '../middleware/async.js'
import Notification from '../models/Notification.js'

// @desc    Get unread notifications for a user
// @route   GET /api/v1/notifications/:receiverUid
// @access  Private
export const getUnreadNotifications = asyncHandler(async (req, res, next) => {
  const receiverUid = req.params.receiverUid
  const notifications = await Notification.find({
    receiverUid: receiverUid,
    isRead: false,
  })

  res.status(200).json({
    success: true,
    count: notifications.length,
    data: notifications,
  })
})

// @desc    Mark notifications as read
// @route   PUT /api/v1/notifications/read/:receiverUid
// @access  Private
export const markNotificationsAsRead = asyncHandler(async (req, res, next) => {
  const receiverUid = req.params.receiverUid
  await Notification.updateMany(
    { receiverUid: receiverUid, isRead: false },
    { isRead: true }
  )

  res.status(200).json({
    success: true,
    message: 'Notifications marked as read',
  })
})
