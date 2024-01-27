import mongoose from 'mongoose'
import dotenv from 'dotenv'
import fs from 'fs'
import colors from 'colors'
import User from './models/User.js'
import Sound from './models/Sound.js'

// Configure dotenv to read config.env file
dotenv.config({ path: './config/config.env' })

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)

// Import data
const sounds = JSON.parse(
  fs.readFileSync(new URL('./_data/testSounds.json', import.meta.url), 'utf-8')
)
const users = JSON.parse(
  fs.readFileSync(new URL('./_data/users.json', import.meta.url), 'utf-8')
)

const importAndAssociateData = async () => {
  try {
    // Import Users
    await User.create(users)
    console.log('Users Imported...'.green.inverse)

    // Import and Associate Sounds
    for (const sound of sounds) {
      const user = await User.findOne({ email: sound.uploader })
      if (user) {
        const newSound = await Sound.create({ ...sound, user: user._id })
        user.contentUploaded.push(newSound._id)
        await user.save()
      }
    }
    console.log('Sounds Imported and Associated...'.green.inverse)
  } catch (error) {
    console.error('Error during import and association:', error)
  } finally {
    mongoose.disconnect()
  }
}

if (process.argv[2] === '-ia') {
  importAndAssociateData()
}

// node associator.js -ia
