import express from 'express'
import {
  getSounds,
  getSound,
  createSound,
  updateSound,
  downloadSound,
} from '../controllers/sounds.js'

import advancedResults from '../middleware/advancedResults.js'
import { googleProtect } from '../middleware/googleProtect.js'
import Sound from '../models/Sound.js'

const router = express.Router()

router
  .route('/')
  .get(advancedResults(Sound), getSounds)
  .post(googleProtect, createSound)

router.route('/:id').get(getSound).put(googleProtect, updateSound)

router.post('/:id/download', googleProtect, downloadSound)

export default router

// router.route('/:id/photo').put(soundPhotoUpload)
// router.route('/:id/audio').put(googleProtect, soundAudioUpload)
