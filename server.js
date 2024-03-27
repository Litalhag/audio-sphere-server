import express from 'express'
import path from 'path'
// import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

import morgan from 'morgan'
import colors from 'colors'
import fileupload from 'express-fileupload'
import cookieParser from 'cookie-parser'
import ExpressMongoSanitize from 'express-mongo-sanitize'
// import helmet from 'helmet'
import xss from 'xss-clean'
// import rateLimit from 'express-rate-limit'
import hpp from 'hpp'
import cors from 'cors'
import admin from 'firebase-admin'
// import serviceAccount from './config/audiosphere-firebase-adminsdk.json' assert { type: 'json' }

import { Server as SocketIOServer } from 'socket.io'
import cloudinary from 'cloudinary'
import errorHandler from './middleware/error.js'

import connectDB from './config/db.js'

import passport from './config/passport.js'
// Route files
import sounds from './routes/sounds.js'
import messages from './routes/messages.js'
import auth from './routes/auth.js'
import googleUser from './routes/googleUser.js'
import notifications from './routes/notifications.js'
import { addMessage } from './controllers/messages.js'

// Load env vars
dotenv.config({ path: './config/config.env' })

// Cloudinary configuration
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

// console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID)
// console.log('Google Client Secret:', process.env.GOOGLE_CLIENT_SECRET)

// Connect to database
connectDB()

const app = express()

// Body parser
app.use(express.json())

// Cookie Parser
app.use(cookieParser())

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// File uploading
app.use(fileupload())

// Determine directory name
// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)

// Sanitize data
app.use(ExpressMongoSanitize())

// Set Security headers
// app.use(helmet())

// Prevent XSS attacks
app.use(xss())

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 10 * 60 * 100000, // 10 minutes
//   max: 1000,
// })

// app.use(limiter)

// Prevent http param pollution
app.use(hpp())

// Enable CORS
// const corsOptions = {
//   origin: process.env.FRONTEND_URL,
//   credentials: true,
// }
// app.use(cors(corsOptions))

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve('public')))
} else {
  const corsOptions = {
    origin: [
      'https://audio-sphere.onrender.com',
      'http://127.0.0.1:3000',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://localhost:5173',
    ],
    credentials: true,
  }
  app.use(cors(corsOptions))
}

// Set static folder
// app.use(express.static(path.join(__dirname, 'public')))

// Initialize passport
app.use(passport.initialize())

// Mount routers
app.use('/api/v1/sounds', sounds)
app.use('/api/v1/messages', messages)
app.use('/api/v1/auth', auth)
app.use('/api/v1/user', googleUser)
app.use('/api/v1/notifications', notifications)

// Catch all other routes and return the index.html
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.resolve('public', 'index.html'))
  })
}

// Error Handler
app.use(errorHandler)

const PORT = process.env.PORT || 5000

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
)

const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  // line break replacement
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
}

// initialize Admin SDK:
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

// Socket.IO to server
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
  },
})

// global map to keep track of online users gives an object of online users
global.onlineUsers = new Map()
// Map(2) {
//      uid                                socekt.id
//  'HWsEirCxOKc6e1pV1274EJtiep63' => 'JRFN2-K8gmQBQwRAAAAB',
//  'cYDHIl77PzWgbAnoW2SDiOUxV6I2' => 'meo3txKBLGzjz1mBAAAF'
//}

io.on('connection', (socket) => {
  console.log('A user connected with socket id:', socket.id)

  // stores their socket id when a user logs in
  socket.on('add-user', (userId) => {
    console.log(userId)
    onlineUsers.set(userId, socket.id)
  })

  // handling message sending
  socket.on('send-msg', (newMessageData) => {
    console.log('New message data from socket:', newMessageData)
    // console.log('receiver id ', newMessageData.receiver)
    const sendUserSocket = onlineUsers.get(newMessageData.receiver)
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit('new-message', newMessageData)
      socket.to(sendUserSocket).emit('notification', newMessageData)
      // io.to('notification', newMessageData)
    }

    addMessage(newMessageData)
  })

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id)
    // removes user from onlineUsers map
    onlineUsers.delete(socket.id)
  })
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red)
  // Close server & exit process
  server.close(() => process.exit(1))
})
