const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const env = require('../config/env');

const uploadsDir = path.resolve(__dirname, '../../uploads');

if (env.cloudinary.enabled) {
  const cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret
  });
}

async function saveImage(file) {
  if (env.cloudinary.enabled) {
    const cloudinary = require('cloudinary').v2;
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'staymate', resource_type: 'image' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      stream.end(file.buffer);
    });
  }

  await fs.mkdir(uploadsDir, { recursive: true });
  const ext = (path.extname(file.originalname) || '.jpg').toLowerCase().replace(/[^a-z0-9.]/g, '');
  const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt}`;
  await fs.writeFile(path.join(uploadsDir, filename), file.buffer);
  return `/uploads/${filename}`;
}

module.exports = { saveImage, uploadsDir };
