import mongoose from 'mongoose'

const MessageSchema = new mongoose.Schema(
  {
    messageText: {
      type: String,
      required: true,
    },
    users: Array,
    sender: {
      // type: mongoose.Schema.Types.ObjectId,
      type: Object,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.model('Message', MessageSchema)
