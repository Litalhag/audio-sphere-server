import multer from 'multer'

const upload = multer({ dest: 'uploads/' })

// In your route
app.put('/api/v1/sounds/:id/audio', upload.single('file'), soundAudioUpload)
