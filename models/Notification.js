import mongoose from 'mongoose'

const NotificationSchema = new mongoose.Schema(
  {
    receiverUid: {
      type: String,
      required: true,
    },
    sender: {
      type: Object,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.model('Notification', NotificationSchema)
