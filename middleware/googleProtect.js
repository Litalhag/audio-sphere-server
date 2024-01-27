import admin from 'firebase-admin'
import jwt from 'jsonwebtoken'
import ErrorResponse from '../utils/errorResponse.js'
import asyncHandler from './async.js'
import User from '../models/User.js'
import { decode } from 'jsonwebtoken'

export const googleProtect = asyncHandler(async (req, res, next) => {
  const token = req.cookies['token'] // custom token

  if (!token) {
    console.error('No custom token found in cookies')
    return res.status(401).json({ error: 'Unauthorized - No custom token' })
  }

  try {
    // Verify the custom token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Find the user based on the decoded data
    const user = await User.findById(decoded.id)

    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    req.user = user // Attach user to the request object
    next() // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Error verifying custom token:', error)
    return res
      .status(401)
      .json({ error: 'Unauthorized - Error verifying custom token' })
  }
})

// export const googleProtect = asyncHandler(async (req, res, next) => {
//   const token = req.cookies['token']
//   console.log('Token retrieved from cookies:', token)

//   if (!token) {
//     console.error('No token found in cookies')
//     return res.status(401).json({ error: 'Unauthorized - No token' })
//   }

//   try {
//     const decodedToken = await admin.auth().verifyIdToken(token)

//     // Additional check for token integrity
//     if (!decodedToken || !decodedToken.uid) {
//       console.error('Invalid token structure:', decodedToken)
//       return res.status(401).json({ error: 'Unauthorized - Invalid token' })
//     }

//     req.user = await User.findOne({ googleId: decodedToken.uid })

//     if (!req.user) {
//       console.error('User not found with UID:', decodedToken.uid)
//       return res.status(401).json({ error: 'User not found' })
//     }

//     next()
//   } catch (error) {
//     console.error('Error verifying token:', error)
//     return res
//       .status(401)
//       .json({ error: 'Unauthorized - Error verifying token' })
//   }
// })

// const googleProtect = (req, res, next) => {
//   const token = req.headers.authorization

//   if (!token) {
//     return res.status(401).json({ error: 'Unauthorized' })
//   }

//   admin
//     .auth()
//     .verifyIdToken(token)
//     .then((decodedToken) => {
//       req.user = decodedToken
//       next()
//     })
//     .catch((error) => {
//       console.error('Error verifying token:', error)
//       res.status(401).json({ error: 'Unauthrized' })
//     })
// }
