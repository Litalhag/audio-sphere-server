import admin from 'firebase-admin'
import ErrorResponse from '../utils/errorResponse.js'
import asyncHandler from '../middleware/async.js'
import User from '../models/User.js'
import { sendEmail } from '../utils/sendEmail.js'
import crypto from 'crypto'
import mongoose from 'mongoose'
const { ObjectId } = mongoose.Types
import passport from 'passport'
// import { authenticate } from 'passport-google-oauth20'

// *************************
// Standard AUTHENTICATION:*
// *************************
// @desc      Register user
// @route     POST /api/v1/auth/register
// @access    Public
export const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
  })

  sendTokenResponse(user, 200, res)
})

// @desc      Login user
// @route     POST /api/v1/auth/login
// @access    Public
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400))
  }

  // Check for user
  const user = await User.findOne({ email: email }).select('+password')

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401))
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password)

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401))
  }

  sendTokenResponse(user, 200, res)
})

// @desc    Get current logged in user
// @route   POST /api/v1/auth/current-user
// @access  Private
export const loginCurrentUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)

  res.status(200).json(user)
})

// @desc      Update user details
// @route     PUT /api/v1/auth/updatedetails
// @access    Private
export const updateUserDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
  }

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    success: true,
    data: user,
  })
})

// @desc      Update password
// @route     PUT /api/v1/auth/updatepassword
// @access    Private
export const updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password')

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Password is incorrect', 401))
  }

  user.password = req.body.newPassword
  await user.save()

  sendTokenResponse(user, 200, res)
})

// @desc      Forgot password
// @route     POST /api/v1/auth/forgotpassword
// @access    Public
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email })

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404))
  }

  const resetToken = user.getResetPasswordToken()

  await user.save({ validateBeforeSave: false })

  // Create reset url
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/reset-password/${resetToken}`

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      message,
    })

    res.status(200).json({ success: true, data: 'Email sent' })
  } catch (err) {
    console.log(err)
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined

    await user.save({ validateBeforeSave: false })

    return next(new ErrorResponse('Email could not be sent', 500))
  }
})

// @desc      Reset password
// @route     PUT /api/v1/auth/resetpassword/:resettoken
// @access    Public
export const resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex')

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  })

  if (!user) {
    return next(new ErrorResponse('Invalid token', 400))
  }

  // Set new password
  user.password = req.body.password
  user.resetPasswordToken = undefined
  user.resetPasswordExpire = undefined
  await user.save()

  sendTokenResponse(user, 200, res)
})

// ///////////////////////////////////////////////////////////
// /////////////////Relevant controllers//////////////////////
// ///////////////////////////////////////////////////////////

// @desc      Log user out / *clear cookie*
// @route     GET /api/v1/auth/logout
// @access    Private
export const logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  })

  res.status(200).json({
    success: true,
    data: {},
  })
})

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken()

  const isProduction = process.env.NODE_ENV === 'production'

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'None' : 'Lax',
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({ success: true, token, userId: user._id })

  console.log('Sending token response:', { token, userId: user._id })
}

// get all users

// @desc    Get all users
// @route   GET /api/v1/getUsers
// @access  Public
export const getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find()
  // console.log(users)
  return res.status(200).json({ success: true, data: users })
})

// ***********************
// GOOGLE AUTHENTICATION:*
// ***********************
// @desc      Google Authentication
// @route     POST /api/v1/auth/google
// @access    Public
export const googleAuth = asyncHandler(async (req, res, next) => {
  const { idToken } = req.body
  console.log('Received idToken:', idToken)

  try {
    // Verify the ID token using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    console.log('Decoded Token:', decodedToken)
    const uid = decodedToken.uid

    // Find or create a user in your database
    const user = await User.findOrCreate(
      { googleId: uid },
      {
        googleId: uid,
        email: decodedToken.email,
        name: decodedToken.name,
        image: decodedToken.picture,
      }
    )

    // Send token response
    sendTokenResponse(user, 200, res)
  } catch (error) {
    console.error('Error in Google authentication:', error)
    return next(new ErrorResponse('Failed to authenticate with Google', 401))
  }
})

export const getUserData = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.params.userId
    console.log('UserID from URL:', userId)

    let user

    // Check if userId is a valid ObjectId, and use it if it is
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId).select('-password -_id -googleId')
    } else {
      // If it's not a valid ObjectId, use its googleId
      user = await User.findOne({ googleId: userId }).select('-password')
    }

    console.log('Fetched user data:', user)

    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${userId}`, 404))
    }

    res.status(200).json(user)
  } catch (error) {
    next(error)
  }
})

// @desc    Save a sound to user's profile
// @route   PUT /api/v1/users/:userId/saveSound/:soundId
// @access  Private
export const saveSound = asyncHandler(async (req, res, next) => {
  console.log(
    `Request to save sound: userId=${req.params.userId}, soundId=${req.params.soundId}`
  )

  try {
    let user

    // Check if userId is a valid ObjectId, and use it if it is
    if (mongoose.Types.ObjectId.isValid(req.params.userId)) {
      user = await User.findById(req.params.userId)
    } else {
      // If it's not a valid ObjectId, assume it's a googleId
      user = await User.findOne({ googleId: req.params.userId })
    }

    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.userId}`, 404)
      )
    }

    const soundId = req.params.soundId

    // Check if sound already saved
    if (user.contentSaved.includes(soundId)) {
      console.log(`Sound already saved: soundId=${soundId}`)
      return next(new ErrorResponse(`Sound already saved`, 400))
    }

    user.contentSaved.push(soundId)
    await user.save()

    res.status(200).json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error('Error saving sound:', error)
    return next(new ErrorResponse('Error saving sound', 500))
  }
})

// @desc    Remove a sound from user's profile
// @route   PUT /api/v1/users/:userId/removeSound/:soundId
// @access  Private
export const removeSound = asyncHandler(async (req, res, next) => {
  console.log(
    `Request to remove sound: userId=${req.params.userId}, soundId=${req.params.soundId}`
  )

  try {
    let user

    // Check if userId is a valid ObjectId, and use it if it is
    if (mongoose.Types.ObjectId.isValid(req.params.userId)) {
      user = await User.findById(req.params.userId)
    } else {
      // If it's not a valid ObjectId, uses its a googleId
      user = await User.findOne({ googleId: req.params.userId })
    }

    if (!user) {
      return next(
        new ErrorResponse(`User not found with id of ${req.params.userId}`, 404)
      )
    }

    const soundId = req.params.soundId

    // Check if sound is in saved content
    if (!user.contentSaved.includes(soundId)) {
      return next(new ErrorResponse(`Sound not found in saved content`, 400))
    }

    // Remove the sound from contentSaved
    user.contentSaved = user.contentSaved.filter(
      (id) => id.toString() !== soundId
    )
    await user.save()

    res.status(200).json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error('Error removing sound:', error)
    return next(new ErrorResponse('Error removing sound', 500))
  }
})
