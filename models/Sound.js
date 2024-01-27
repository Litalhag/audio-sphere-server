import mongoose from 'mongoose'
import slugify from 'slugify'
import { durationToSeconds } from '../utils/durationToSeconds.js'

const SoundSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'Name can not be more than 40 characters'],
    },
    slug: String,
    description: {
      type: String,
      required: false,
      maxlength: [30, 'Description can not be more than 30 characters'],
    },
    tags: {
      type: [String], // array of strings
      default: [], // default empty array
      required: [true, 'Tags are required'],
      validate: {
        validator: function (array) {
          return array.length >= 3
        },
        message: 'There should be at least 3 tags.',
      },
    },
    category: {
      type: [String], // array of strings
      default: [], // default empty array
      required: [true, 'Category is required'],
      validate: {
        validator: function (array) {
          return array.length > 0
        },
        message: 'At least one category must be specified.',
      },
    },
    audio: {
      type: String,
      required: [true, 'Audio is required'],
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
    },
    duration: {
      type: String,
      required: [true, 'Duration is required'],
      validate: {
        validator: function (value) {
          // Regular expression to validate the format is 'mm:ss'
          return /^\d{2}:\d{2}$/.test(value)
        },
        message: 'Duration must be in the format mm:ss',
      },
    },
    durationInSeconds: {
      type: Number,
      min: [1, 'Duration must be more than one second'],
    },

    waveformImage: {
      type: String,
      required: false, // populate this once the waveform has been generated
    },
    downloads: {
      type: Number,
      default: 0,
    },

    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    toJSON: {
      virtuals: true,
      // Hide the _id field from the frontend
      transform: function (_, ret) {
        ret.id = ret._id
        delete ret._id
        delete ret.__v
      },
    },
    toObject: {
      virtuals: true,
      // Hide the _id field from the frontend
      transform: function (_, ret) {
        ret.id = ret._id
        delete ret._id
        delete ret.__v
      },
    },
    timestamps: true,
  }
)

// Create sound slug from the name
SoundSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true })
  }
  next()
})

// Virtual for formatted duration
SoundSchema.pre('save', function (next) {
  if (/^\d{2}:\d{2}$/.test(this.duration)) {
    const [minutes, seconds] = this.duration.split(':').map(Number)
    this.durationInSeconds = minutes * 60 + seconds
  }
  next()
})

export default mongoose.model('Sound', SoundSchema)
