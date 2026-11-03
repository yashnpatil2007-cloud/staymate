const multer = require('multer');
const { AppError } = require('./error');

const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (req, file, cb) => {
    if (!allowed.includes(file.mimetype)) {
      return cb(new AppError('Only JPG, PNG, WEBP or GIF images are allowed.', 400));
    }
    cb(null, true);
  }
});

module.exports = upload;
