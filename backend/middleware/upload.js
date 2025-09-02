const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = process.env.UPLOAD_PATH || './uploads';
    
    // Organize by file type
    if (file.fieldname === 'avatar') {
      uploadPath = path.join(uploadPath, 'avatars');
    } else if (file.fieldname === 'news_image') {
      uploadPath = path.join(uploadPath, 'news');
    } else if (file.fieldname === 'gallery_image') {
      uploadPath = path.join(uploadPath, 'gallery');
    } else if (file.fieldname === 'merchandise_image') {
      uploadPath = path.join(uploadPath, 'merchandise');
    } else if (file.fieldname === 'player_photo') {
      uploadPath = path.join(uploadPath, 'players');
    } else {
      uploadPath = path.join(uploadPath, 'misc');
    }
    
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = uuidv4();
    cb(null, `${name}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: fileFilter
});

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected file field' });
    }
  }
  
  if (error.message.includes('Only image files are allowed')) {
    return res.status(400).json({ error: error.message });
  }
  
  next(error);
};

module.exports = {
  upload,
  handleUploadError
};