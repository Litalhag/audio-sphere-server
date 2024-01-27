import Message from '../models/Message.js'
import ErrorResponse from '../utils/errorResponse.js'
import asyncHandler from '../middleware/async.js'
import User from '../models/User.js'

// @desc    Get messages between two users
// @route   GET /api/v1/messages
// @access  Private
export const getMessages = asyncHandler(async (req, res, next) => {
  // const { from, to } = req.body
  const { senderId, receiverId } = req.params
  console.log('Receiver:', receiverId, 'Sender:', senderId)
  // const senderIDB = await User.find({
  //   googleId: senderId,
  // })
  // console.log('user', senderIDB)
  const messages = await Message.find({
    users: {
      $all: [senderId, receiverId],
    },
  }).sort({ updatedAt: 1 })

  const projectedMessages = messages.map((message) => {
    console.log('sender:', message.sender)
    return {
      sender: message.sender.uid.toString() === senderId,
      messageText: message.messageText,
    }
  })

  console.log('FETCH FROM CONTROLLER', projectedMessages)

  res.status(200).json({
    success: true,
    data: projectedMessages,
  })
})

// @desc    Send a new message
// @route   POST /api/v1/messages
// @access  Private
export const addMessage = asyncHandler(async (newMessageData) => {
  console.log('newMessageData from add msg:', newMessageData)

  const createdMessage = await Message.create({
    messageText: newMessageData.messageText,
    users: [newMessageData.sender.uid, newMessageData.receiver],
    sender: newMessageData.sender,
    timeStamp: newMessageData.timestamp,
  })

  console.log('createdMessage', createdMessage)

  console.log(createdMessage)

  if (!createdMessage) {
    throw new Error('something went wrong..')
  }
})

// @desc    Delete a message
// @route   DELETE /api/v1/messages/:id
// @access  Private
export const deleteMessage = asyncHandler(async (req, res, next) => {
  const message = await Message.findById(req.params.id)

  if (!message) {
    return next(
      new ErrorResponse(`No message found with the id of ${req.params.id}`, 404)
    )
  }

  await message.deleteOne()

  res.status(200).json({
    success: true,
    data: {},
  })
})

// @desc    Get all messages for a user
// @route   GET /api/v1/messages/:userId
// @access  Private
// export const getMessagesForUser = asyncHandler(async (req, res, next) => {
//   res.status(200).json(res.advancedResults)
// })
