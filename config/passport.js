import dotenv from 'dotenv'
dotenv.config({ path: './config/config.env' })
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import User from '../models/User.js'

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:5000/auth/google/callback',
    },
    function (accessToken, refreshToken, profile, done) {
      User.findOrCreate(
        { googleId: profile.id },
        {
          googleId: profile.id,
          // user fields to set during creation
        },
        function (err, user) {
          return done(err, user)
        }
      )
    }
  )
)

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  User.findById(id, function (err, user) {
    done(err, user)
  })
})

export default passport
