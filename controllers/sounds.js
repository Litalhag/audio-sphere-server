import mongoose from 'mongoose'
import ErrorResponse from '../utils/errorResponse.js'
import asyncHandler from '../middleware/async.js'
import Sound from '../models/Sound.js'
import path from 'path'
import axios from 'axios'
import cloudinary from 'cloudinary'
import advancedResults from '../middleware/advancedResults.js'
import User from '../models/User.js'

// @desc    Get all sounds
// @route   GET /api/v1/sounds
// @access  Public
export const getSounds = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults)
})

// @desc    Get single sound
// @route   GET /api/v1/sounds/:id
// @access  Public
export const getSound = asyncHandler(async (req, res, next) => {
  const sound = await Sound.findById(req.params.id)

  if (!sound) {
    return next(
      new ErrorResponse(`Sound not found with id of ${req.params.id}`, 404)
    )
  }

  res.status(200).json({ success: true, data: sound })
})

// @desc    Create new sound
// @route   POST /api/v1/sounds
// @access  Private
export const createSound = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id

  // Check for existing sound with the same name
  const existingSound = await Sound.findOne({ name: req.body.name })
  if (existingSound) {
    return next(new ErrorResponse('Duplicate name error', 400))
  }

  // Check if duration is in 'mm:ss' format
  const durationRegex = /^\d{2}:\d{2}$/
  if (!durationRegex.test(req.body.duration)) {
    return next(new ErrorResponse('Duration must be in the format mm:ss', 400))
  }

  // Create the sound (without fetching duration from Cloudinary)
  const sound = await Sound.create(req.body)

  await User.findByIdAndUpdate(req.user.id, {
    $push: { contentUploaded: sound._id },
  })

  res.status(201).json({
    success: true,
    data: sound,
  })
})

// @desc    Download sound
// @route   DELETE /api/v1/sounds/:id/download
// @access  Private
export const downloadSound = asyncHandler(async (req, res, next) => {
  try {
    const sound = await Sound.findById(req.params.id)

    if (!sound) {
      return next(
        new ErrorResponse(`Sound not found with id of ${req.params.id}`, 404)
      )
    }

    sound.downloads += 1
    const updatedSound = await sound.save()

    res.status(200).json({ success: true, data: updatedSound })
  } catch (error) {
    next(error)
  }
})

// @desc    Delete sound
// @route   DELETE /api/v1/users/:userId/deleteSound/:soundId
// @access  Private
export const deleteSound = asyncHandler(async (req, res, next) => {
  const googleUserId = req.params.userId // Google User ID
  const soundId = req.params.soundId // MongoDB ObjectId

  // Find user by Google User ID
  const user = await User.findOne({ googleId: googleUserId })

  if (!user) {
    return next(
      new ErrorResponse(`User not found with Google ID of ${googleUserId}`, 404)
    )
  }

  // Find the sound by its ObjectId
  if (!mongoose.Types.ObjectId.isValid(soundId)) {
    return next(new ErrorResponse(`Invalid sound id: ${soundId}`, 400))
  }
  const sound = await Sound.findById(soundId)

  if (!sound) {
    return next(new ErrorResponse(`Sound not found with id of ${soundId}`, 404))
  }

  // Check if the found user is the owner of the sound
  if (sound.user.toString() !== user._id.toString()) {
    return next(
      new ErrorResponse(`User is not authorized to delete this sound`, 401)
    )
  }

  // Delete the sound
  await sound.deleteOne()
  res.status(200).json({ success: true, data: {} })
})

// @desc    Update sound
// @route   PUT /api/v1/sounds/:id
// @access  Private
export const updateSound = asyncHandler(async (req, res, next) => {
  let sound = await Sound.findById(req.params.id)

  if (!sound) {
    return next(
      new ErrorResponse(`Sound not found with id of ${req.params.id}`, 404)
    )
  }

  // Verify user is sound owner
  if (sound.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.params.id} is not authorized to update this sound`,
        401
      )
    )
  }

  sound = await Sound.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({ success: true, data: sound })
})

// @desc      Upload photo for sound
// @route     PUT /api/v1/sounds/:id/photo
// @access    Private
export const soundPhotoUpload = asyncHandler(async (req, res, next) => {
  const sound = await Sound.findById(req.params.id)

  if (!sound) {
    return next(
      new ErrorResponse(`Sound not found with id of ${req.params.id}`, 404)
    )
  }

  // Make sure user is sound owner
  if (sound.user.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.params.id} is not authorized to delete this sound`,
        401
      )
    )
  }

  // Check if a file is uploaded
  if (req.files) {
    const file = req.files.file

    // Make sure the image is a photo
    if (!file.mimetype.startsWith('image')) {
      return next(new ErrorResponse(`Please upload an image file`, 400))
    }

    // Check file size
    if (file.size > process.env.MAX_IMAGE_UPLOAD) {
      return next(
        new ErrorResponse(
          `Please upload an image less than ${process.env.MAX_IMAGE_UPLOAD}`,
          400
        )
      )
    }

    // Create custom filename
    file.name = `photo_${sound._id}${path.parse(file.name).ext}`

    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
      if (err) {
        console.error(err)
        return next(new ErrorResponse(`Problem with file upload`, 500))
      }

      await Sound.findByIdAndUpdate(req.params.id, { photo: file.name })

      res.status(200).json({
        success: true,
        data: file.name,
      })
    })
  } else if (req.body.url) {
    // Check if a photo URL is provided
    const { url } = req.body

    // Validate the URL
    if (!url.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i)) {
      return next(new ErrorResponse(`Please upload a valid image URL`, 400))
    }

    // Update the Sound photo with the URL
    await Sound.findByIdAndUpdate(req.params.id, { photo: url })

    res.status(200).json({
      success: true,
      data: url,
    })
  } else {
    return next(new ErrorResponse(`Please upload a file or provide a URL`, 400))
  }
})
