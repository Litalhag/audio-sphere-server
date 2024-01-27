import express from 'express'
import {
  register,
  login,
  logout,
  loginCurrentUser,
  updateUserDetails,
  updatePassword,
  forgotPassword,
  resetPassword,
  googleAuth,
  getUsers,
} from '../controllers/auth.js'
import { protect } from '../middleware/auth.js'
import User from '../models/User.js'
import advancedResults from '../middleware/advancedResults.js'
import passport from 'passport'

const router = express.Router()

// *************************
// Standard AUTHENTICATION:*
// *************************
router.post('/register', register)
router.post('/login', login)
router.get('/current-user', protect, loginCurrentUser)
router.put('/update-user-details', protect, updateUserDetails)
router.put('/update-user-password', protect, updatePassword)
router.post('/forgot-password', forgotPassword)
router.put('/reset-password/:resettoken', resetPassword)

// ***********************
// GOOGLE AUTHENTICATION:*
// ***********************
// Google Authentication Route
router.post('/googleAuth', googleAuth)
router.get('/logout', logout) // clears cookie
router.get('/getUsers', getUsers)
//protect?

// router.get('/user/:userId', protect, getUserData)

export default router
