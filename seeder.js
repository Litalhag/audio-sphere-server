import fs from 'fs'
import mongoose from 'mongoose'
import colors from 'colors'
import dotenv from 'dotenv'

import Sound from './models/Sound.js'
import User from './models/User.js'

// Configure dotenv to read config.env file
dotenv.config({ path: './config/config.env' })

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)

// Import data and store to a JavaScript array of objects
const sounds = JSON.parse(
  fs.readFileSync(new URL('./_data/sounds.json', import.meta.url), 'utf-8')
)
const users = JSON.parse(
  fs.readFileSync(new URL('./_data/users.json', import.meta.url), 'utf-8')
)

// Import into DB
const importData = async () => {
  try {
    await Sound.create(sounds)
    await User.create(users)

    console.log('Data Imported...'.green.inverse)
    process.exit()
  } catch (err) {
    console.error(err)
  }
}

// Delete data
const deleteData = async () => {
  try {
    await Sound.deleteMany()
    await User.deleteMany()

    console.log('Data Destroyed...'.red.inverse)
    process.exit()
  } catch (err) {
    console.error(err)
  }
}

if (process.argv[2] === '-i') {
  importData()
} else if (process.argv[2] === '-d') {
  deleteData()
}

// node seeder -i
// node seeder -d
