import multer from 'multer';

// Configure multer to use memory storage
const storage = multer.memoryStorage();

// Create the multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5 MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  },
});

// Middleware to handle a single file upload from a field named "image"
export const uploadImage = upload.single('image');
