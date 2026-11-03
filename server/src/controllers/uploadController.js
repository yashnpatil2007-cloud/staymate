const asyncHandler = require('../utils/asyncHandler');
const { saveImage } = require('../utils/storage');
const { AppError } = require('../middleware/error');
const env = require('../config/env');

const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.length) {
    throw new AppError('Please select at least one image.', 400);
  }
  const urls = await Promise.all(req.files.map((file) => saveImage(file)));
  res.status(201).json({
    success: true,
    urls,
    storage: env.cloudinary.enabled ? 'cloudinary' : 'local'
  });
});

module.exports = { uploadImages };
