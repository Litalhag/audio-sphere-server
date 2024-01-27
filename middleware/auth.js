import jwt from 'jsonwebtoken'
import ErrorResponse from '../utils/errorResponse.js'
import asyncHandler from './async.js'
import User from '../models/User.js'

// Protect routes
export const protect = asyncHandler(async (req, res, next) => {
  let token

  // checking headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1]
    // Set token from cookie
  }
  // else if (req.cookies.token) {
  //   token = req.cookies.token;
  // }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401))
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    console.log(decoded)
    req.user = await User.findById(decoded.id)

    next()
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401))
  }
})
